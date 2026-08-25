'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const { config } = require('../config');
const { validateFields, spamCheck } = require('../lib/validate');
const { insertSubmission, markNotified, subscribeNewsletter } = require('../lib/db');
const { sendNotification } = require('../lib/mailer');
const { log, hashIp } = require('../lib/logger');
const { originCheck, formLimiter } = require('../middleware/security');

const router = express.Router();

const GENERIC_SUCCESS = 'Thank you. Your message has been received.';

/**
 * Uploads are written to a directory outside the served public/ tree, under a random
 * filename with an extension derived from an allow-list — never from user input.
 */
const ALLOWED_UPLOAD = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

/** Leading bytes that must match for the declared type. Blocks a renamed executable. */
const MAGIC = {
  '.pdf': [Buffer.from('%PDF-')],
  '.doc': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  '.docx': [Buffer.from('PK'), Buffer.from('PK')],
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(config.uploadDir, { recursive: true });
      cb(null, config.uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = ALLOWED_UPLOAD.get(file.mimetype) || '.bin';
      cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1, fields: 30, parts: 40 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_UPLOAD.has(file.mimetype)) {
      return cb(new UploadError('Only PDF, DOC and DOCX files are accepted.'));
    }
    cb(null, true);
  },
});

class UploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UploadError';
  }
}

/** Verify the file's real leading bytes match its extension; delete it if not. */
function verifyMagicBytes(filePath, ext) {
  const signatures = MAGIC[ext];
  if (!signatures) return false;
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(8);
    fs.readSync(fd, head, 0, 8, 0);
    return signatures.some((sig) => head.subarray(0, sig.length).equals(sig));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function safeUnlink(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

function requestMeta(req) {
  return {
    ipHash: hashIp(req.ip),
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
  };
}

/**
 * Reject spam without telling the sender why.
 *
 * Returns true when the request was handled (a 200 with the normal success message,
 * so a bot cannot distinguish a blocked submission from an accepted one).
 */
function handledAsSpam(req, res, kind) {
  const reason = spamCheck(req.body);
  if (!reason) return false;
  log('warn', 'spam.blocked', { kind, reason, ipHash: hashIp(req.ip) });
  res.json({ ok: true, message: GENERIC_SUCCESS });
  return true;
}

function fail(res, errors, message) {
  return res.status(400).json({
    ok: false,
    error: message || 'Please correct the highlighted fields and try again.',
    errors: errors || {},
  });
}

// ---------------------------------------------------------------------------
// POST /api/contact
// ---------------------------------------------------------------------------

router.post('/contact', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'contact')) return;

    const { ok, values, errors } = validateFields(req.body, {
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      phone: { required: false, type: 'phone' },
      service: { required: false, type: 'text', max: 120 },
      message: { required: true, type: 'longtext', min: 10, max: 4000 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'contact',
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      subject: values.service || 'General enquiry',
      message: values.message,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'contact', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      subject: `Website enquiry: ${values.service || 'General'} — ${values.name}`,
      title: 'New website enquiry',
      replyTo: values.email,
      fields: {
        Name: values.name,
        Email: values.email,
        Phone: values.phone,
        Company: values.company,
        'Service of interest': values.service,
        Message: values.message,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({
      ok: true,
      message: 'Thank you — your enquiry has been received. Our team will respond within one business day.',
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/academy-enquiry
// ---------------------------------------------------------------------------

router.post('/academy-enquiry', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'academy')) return;

    const { ok, values, errors } = validateFields(req.body, {
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      phone: { required: false, type: 'phone' },
      programme: { required: false, type: 'text', max: 120 },
      delegates: { required: false, type: 'text', max: 40 },
      message: { required: true, type: 'longtext', min: 10, max: 4000 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const programme = values.programme || 'General training enquiry';
    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'academy',
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      subject: programme,
      // Delegate count is folded into the message so the stored row keeps the
      // shared submission shape rather than growing a column for one form.
      message: values.delegates
        ? `Approximate delegates: ${values.delegates}\n\n${values.message}`
        : values.message,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'academy', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      to: config.mail.academyTo,
      subject: `Academy enquiry: ${programme} — ${values.name}`,
      title: 'New academy training enquiry',
      replyTo: values.email,
      fields: {
        Name: values.name,
        Email: values.email,
        Phone: values.phone,
        Organisation: values.company,
        Programme: programme,
        'Approximate delegates': values.delegates,
        Message: values.message,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({
      ok: true,
      message:
        'Thank you — your enquiry has been received. We will come back to you within one business day.',
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/resource-request
// ---------------------------------------------------------------------------

router.post('/resource-request', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'resource')) return;

    const { ok, values, errors } = validateFields(req.body, {
      resource: { required: true, type: 'text', max: 160 },
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'resource',
      name: values.name,
      email: values.email,
      company: values.company,
      subject: values.resource,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'resource', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      subject: `Resource request: ${values.resource}`,
      title: 'New resource request',
      replyTo: values.email,
      fields: {
        Resource: values.resource,
        Name: values.name,
        Email: values.email,
        Company: values.company,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({ ok: true, message: 'Thank you — we will email your copy shortly.' });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/newsletter
// ---------------------------------------------------------------------------

router.post('/newsletter', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'newsletter')) return;

    const { ok, values, errors } = validateFields(req.body, {
      email: { required: true, type: 'email' },
    });
    if (!ok) return fail(res, errors);

    subscribeNewsletter(values.email, hashIp(req.ip));
    log('info', 'newsletter.subscribed', { ipHash: hashIp(req.ip) });

    return res.json({ ok: true, message: 'You are subscribed. Thank you.' });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/careers  (multipart — optional CV attachment)
// ---------------------------------------------------------------------------

router.post(
  '/careers',
  formLimiter(),
  originCheck,
  (req, res, next) => {
    upload.single('cv')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Your file is larger than the ${Math.round(config.maxUploadBytes / (1024 * 1024))} MB limit.`
            : 'That file could not be accepted.';
        return res.status(400).json({ ok: false, error: message, errors: { cv: message } });
      }
      if (err instanceof UploadError) {
        return res.status(400).json({ ok: false, error: err.message, errors: { cv: err.message } });
      }
      return next(err);
    });
  },
  async (req, res, next) => {
    const uploaded = req.file;
    try {
      if (spamCheck(req.body)) {
        safeUnlink(uploaded && uploaded.path);
        log('warn', 'spam.blocked', { kind: 'careers', ipHash: hashIp(req.ip) });
        return res.json({ ok: true, message: GENERIC_SUCCESS });
      }

      const { ok, values, errors } = validateFields(req.body, {
        name: { required: true, type: 'text', min: 2, max: 100 },
        email: { required: true, type: 'email' },
        phone: { required: false, type: 'phone' },
        role: { required: true, type: 'text', max: 120 },
        link: { required: false, type: 'url', max: 300 },
        message: { required: true, type: 'longtext', min: 10, max: 4000 },
        consent: { required: true, type: 'checkbox' },
      });
      if (!ok) {
        safeUnlink(uploaded && uploaded.path);
        return fail(res, errors);
      }

      // Content sniffing after the fact: a permitted MIME type on a file whose bytes
      // say otherwise is discarded rather than stored and forwarded.
      if (uploaded) {
        const ext = path.extname(uploaded.filename);
        if (!verifyMagicBytes(uploaded.path, ext)) {
          safeUnlink(uploaded.path);
          const message = 'That file does not appear to be a valid PDF or Word document.';
          log('warn', 'upload.rejected', { reason: 'magic-mismatch', ipHash: hashIp(req.ip) });
          return res.status(400).json({ ok: false, error: message, errors: { cv: message } });
        }
      }

      const meta = requestMeta(req);
      const result = insertSubmission({
        kind: 'careers',
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: values.role,
        message: values.message,
        link: values.link,
        attachment: uploaded ? uploaded.filename : null,
        consent: values.consent,
        ...meta,
      });

      log('info', 'submission.received', {
        kind: 'careers',
        id: result.lastInsertRowid,
        hasAttachment: Boolean(uploaded),
        ipHash: meta.ipHash,
      });

      const sent = await sendNotification({
        subject: `Job application: ${values.role} — ${values.name}`,
        title: 'New job application',
        replyTo: values.email,
        to: config.mail.careersTo,
        fields: {
          Role: values.role,
          Name: values.name,
          Email: values.email,
          Phone: values.phone,
          Link: values.link,
          Message: values.message,
          CV: uploaded ? uploaded.filename : 'Not attached',
          Received: new Date().toISOString(),
        },
        attachments: uploaded
          ? [{ filename: uploaded.originalname.replace(/[\r\n"]/g, '').slice(0, 120), path: uploaded.path }]
          : undefined,
      });
      if (sent) markNotified(result.lastInsertRowid);

      return res.json({
        ok: true,
        message: 'Thank you — your application has been received. We will be in touch within a week.',
      });
    } catch (err) {
      safeUnlink(uploaded && uploaded.path);
      return next(err);
    }
  }
);

// ---------------------------------------------------------------------------

router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', uptime: Math.round(process.uptime()) });
});

/** Unknown API route: JSON 404 rather than the HTML error page. */
router.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found.' });
});

module.exports = router;
