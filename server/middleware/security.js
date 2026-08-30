'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { config } = require('../config');
const { log, hashIp } = require('../lib/logger');

/**
 * Content Security Policy.
 *
 * The site ships no inline scripts and no inline style attributes, so both
 * script-src and style-src stay free of 'unsafe-inline'. Fonts are self-hosted,
 * so no third-party origin appears anywhere in the policy.
 */
const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  fontSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  connectSrc: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: config.isProd ? [] : null,
};

function securityHeaders() {
  const directives = { ...CSP_DIRECTIVES };
  if (directives.upgradeInsecureRequests === null) delete directives.upgradeInsecureRequests;

  return [
    helmet({
      contentSecurityPolicy: { useDefaults: false, directives },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    }),
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
      res.removeHeader('X-Powered-By');
      next();
    },
  ];
}

/**
 * Origin check for state-changing requests.
 *
 * The API is cookie-free, so classic CSRF cannot authenticate as a victim — but this
 * still stops the endpoints being driven from arbitrary third-party pages. When
 * ALLOWED_ORIGINS is unset (development) any origin is accepted.
 */
function originCheck(req, res, next) {
  if (!config.allowedOrigins.length) return next();

  const origin = req.get('origin');
  const referer = req.get('referer');
  let candidate = origin;

  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = null;
    }
  }

  // A same-origin form post from a browser that sends neither header is rare but legal.
  if (!candidate) return next();

  if (!config.allowedOrigins.includes(candidate)) {
    log('warn', 'origin.rejected', { origin: candidate, path: req.path, ipHash: hashIp(req.ip) });
    return res.status(403).json({ ok: false, error: 'Request origin not allowed.' });
  }
  return next();
}

/** Shared rate-limiter factory. Keys on the client IP resolved through trust proxy. */
function makeLimiter({ windowMs, max, name }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skip: (req) => process.env.NODE_ENV !== 'test' && (!config.isProd || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip)),
    handler: (req, res) => {
      log('warn', 'ratelimit.hit', { limiter: name, path: req.path, ipHash: hashIp(req.ip) });
      res.status(429).json({
        ok: false,
        error: 'Too many requests from this address. Please try again shortly, or email us directly.',
      });
    },
  });
}

const formLimiter = () =>
  makeLimiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.formMax, name: 'form' });

const hrLimiter = () =>
  makeLimiter({ windowMs: config.rateLimit.windowMs, max: 100, name: 'hr' });

const globalLimiter = () =>
  makeLimiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.globalMax, name: 'global' });

module.exports = { securityHeaders, originCheck, formLimiter, hrLimiter, globalLimiter, CSP_DIRECTIVES };
