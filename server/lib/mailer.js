'use strict';

const nodemailer = require('nodemailer');

const { config } = require('../config');
const { stripControl } = require('./validate');
const { log } = require('./logger');

let transporter = null;

function getTransporter() {
  if (!config.mail.enabled) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
    // Reject invalid certificates. Never disable this to work around a broken host.
    tls: { rejectUnauthorized: true },
  });

  return transporter;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** Render submitted fields as a plain-text and HTML notification body. */
function renderBody(title, fields) {
  const rows = Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== '');

  const text = [title, '='.repeat(title.length), '']
    .concat(rows.map(([k, v]) => `${k}:\n${v}\n`))
    .join('\n');

  const html =
    `<h2 style="font-family:system-ui,sans-serif">${escapeHtml(title)}</h2>` +
    '<table style="font-family:system-ui,sans-serif;border-collapse:collapse">' +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 14px 6px 0;vertical-align:top;color:#555"><strong>${escapeHtml(
            k
          )}</strong></td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
      )
      .join('') +
    '</table>';

  return { text, html };
}

/**
 * Send a notification about a submission.
 *
 * Every header-bound value is passed through stripControl() first: an unsanitised
 * newline in a subject or reply-to lets a submitter inject arbitrary headers.
 * Failures are logged and swallowed — a mail outage must not lose the submission,
 * which is already committed to the database by this point.
 *
 * @returns {Promise<boolean>} true when the message was accepted by the SMTP server
 */
async function sendNotification({ subject, title, fields, replyTo, to, attachments }) {
  const tx = getTransporter();
  if (!tx) {
    log('info', 'mail.skipped', { reason: 'smtp-not-configured', subject: stripControl(subject) });
    return false;
  }

  const { text, html } = renderBody(title, fields);

  try {
    await tx.sendMail({
      from: config.mail.from,
      to: to || config.mail.to,
      subject: stripControl(subject).slice(0, 200),
      replyTo: replyTo ? stripControl(replyTo).slice(0, 254) : undefined,
      text,
      html,
      attachments: attachments || undefined,
    });
    return true;
  } catch (err) {
    log('error', 'mail.failed', { subject: stripControl(subject), error: err.message });
    return false;
  }
}

/** Verify SMTP connectivity at startup so misconfiguration surfaces immediately. */
async function verifyTransport() {
  const tx = getTransporter();
  if (!tx) return { configured: false, ok: false };
  try {
    await tx.verify();
    return { configured: true, ok: true };
  } catch (err) {
    return { configured: true, ok: false, error: err.message };
  }
}

module.exports = { sendNotification, verifyTransport, renderBody };
