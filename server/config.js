'use strict';

require('dotenv').config();

const path = require('path');

/** Parse a boolean-ish env var. */
function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

/** Parse an integer env var with a fallback. */
function int(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const env = process.env.NODE_ENV || 'production';
const isProd = env === 'production';

const config = {
  env,
  isProd,
  port: int(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',

  /**
   * Number of reverse proxies in front of the app. Rate limiting reads the client IP
   * from X-Forwarded-For, so this MUST match the real deployment: too high and a
   * client can spoof its own IP to evade limits.
   */
  trustProxy: int(process.env.TRUST_PROXY, 0),

  /**
   * Origins allowed to POST to the API. Requests carrying an Origin or Referer header
   * that is not on this list are rejected — a simple, dependency-free CSRF defence for
   * an API that uses no cookies or ambient authority.
   */
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  publicDir: path.join(__dirname, '..', 'public'),

  /**
   * Hosts served from public/academy/ instead of the site root. The generator
   * emits the academy inside the main output so a single deployment serves both
   * domains; this list is what maps the subdomain onto that directory.
   */
  academyHosts: (process.env.ACADEMY_HOSTS || 'academy.arysec.in')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  /** Where /academy/... on the main domain is redirected, so no page has two addresses. */
  academyOrigin: process.env.ACADEMY_ORIGIN || 'https://academy.arysec.in',
  /**
   * Canonical hosts of the main site. Only these redirect /academy/... away to
   * the subdomain: on a preview deployment, a staging host or localhost the
   * subdomain does not resolve, so the academy is served in place instead and
   * stays browsable.
   */
  siteHosts: (process.env.SITE_HOSTS || 'www.arysec.in,arysec.in')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  academyDir: 'academy',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'),
  dbFile: process.env.DB_FILE || path.join(__dirname, 'data', 'submissions.db'),

  /** Max accepted JSON body. Form payloads are small; anything larger is abuse. */
  jsonLimit: process.env.JSON_LIMIT || '32kb',
  maxUploadBytes: int(process.env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024),

  /** Minimum seconds between page load and submit. Bots post instantly. */
  minFormSeconds: int(process.env.MIN_FORM_SECONDS, 3),
  maxFormAgeSeconds: int(process.env.MAX_FORM_AGE_SECONDS, 60 * 60 * 6),

  rateLimit: {
    windowMs: int(process.env.RATE_WINDOW_MS, 15 * 60 * 1000),
    formMax: int(process.env.RATE_FORM_MAX, 5),
    globalMax: int(process.env.RATE_GLOBAL_MAX, 300),
  },

  mail: {
    enabled: bool(process.env.SMTP_HOST, false),
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Arysec Website <no-reply@arysec.in>',
    to: process.env.MAIL_TO || 'info@arysec.in',
    careersTo: process.env.MAIL_CAREERS_TO || 'careers@arysec.in',
    /** Academy enquiries. Falls back to the general mailbox until a
     *  dedicated training address exists. */
    academyTo: process.env.MAIL_ACADEMY_TO || process.env.MAIL_TO || 'info@arysec.in',
  },

  company: {
    name: 'Arysec Technologies LLP',
    email: 'info@arysec.in',
    phone: '+91 90048 57727',
  },
};

/**
 * Fail fast on a misconfigured production deployment rather than starting in a
 * state where enquiries are silently dropped or the CSRF check is inert.
 */
function validate() {
  const problems = [];
  if (config.isProd) {
    if (!config.allowedOrigins.length) {
      problems.push('ALLOWED_ORIGINS must be set in production (comma-separated list of site origins).');
    }
    if (!config.mail.enabled) {
      problems.push(
        'SMTP_HOST is not set: submissions will be stored in the database but nobody will be notified by email.'
      );
    }
  }
  return problems;
}

module.exports = { config, validate };
