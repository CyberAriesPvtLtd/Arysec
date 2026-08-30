'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');

const { config } = require('./config');
const { securityHeaders, globalLimiter } = require('./middleware/security');
const { log, hashIp } = require('./lib/logger');
const apiRoutes = require('./routes/api');

/**
 * express.static rooted at `root`, active only when `applies(req)` is true.
 * Wrapping rather than mounting keeps each site's URLs at the root of its own
 * host, and stops either site's files leaking onto the other's domain.
 */
function hostScopedStatic(root, applies, staticOptions) {
  const serve = express.static(root, staticOptions);
  return (req, res, next) => (applies(req) ? serve(req, res, next) : next());
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.set('etag', 'strong');

  app.use(compression());
  securityHeaders().forEach((mw) => app.use(mw));
  app.use(globalLimiter());

  app.use(express.json({ limit: config.jsonLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.jsonLimit }));

  // Malformed JSON reaches the error handler as a SyntaxError; answer it as a 400
  // rather than letting it surface as a 500.
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ ok: false, error: 'Malformed request body.' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: 'Request body too large.' });
    }
    return next(err);
  });

  app.use('/api', apiRoutes);

  // ---- Static site -------------------------------------------------------
  // Fingerprint-free assets get a short cache with revalidation; HTML is never
  // cached at the edge so a rebuild is visible immediately.
  const staticOptions = {
    extensions: false,
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html') || ((filePath.endsWith('.css') || filePath.endsWith('.js')) && !/\.[0-9a-f]{8}\.(css|js)$/.test(filePath))) {
        // Prevent aggressive browser caching of unversioned styling and code
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      } else if (/\.woff2?$/.test(filePath)) {
        // Font files never change without a filename change.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.[0-9a-f]{8}\.(css|js)$/.test(filePath)) {
        // Content-hashed by the build
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(svg|png|jpe?g|webp|ico)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  };

  /**
   * The academy is generated into public/academy/ but is served from the root of
   * academy.arysec.in. Two middlewares keep those views consistent:
   *
   *   1. On an academy host, requests resolve inside public/academy/ first.
   *   2. On a canonical main-site host, /academy/... is redirected to the
   *      subdomain, so a page is never reachable at two addresses and never
   *      splits its ranking. Anywhere else — a preview deployment, a staging
   *      host, localhost — the subdomain does not resolve, so the academy is
   *      served in place under /academy/ and stays browsable.
   *
   * Both use the same path-resolution guard as the clean-URL handler below: the
   * candidate is resolved and confirmed to sit inside the served root before any
   * read, so '..' segments cannot escape it.
   */
  const academyRoot = path.join(config.publicDir, config.academyDir);
  const isAcademyHost = (req) => config.academyHosts.includes(String(req.hostname || '').toLowerCase());
  const isCanonicalSiteHost = (req) => config.siteHosts.includes(String(req.hostname || '').toLowerCase());

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();

    if (isAcademyHost(req)) {
      // Never let the academy host reach the parent site's pages by path.
      if (req.path === '/' + config.academyDir || req.path.startsWith('/' + config.academyDir + '/')) {
        const rest = req.path.slice(config.academyDir.length + 1) || '/';
        return res.redirect(301, rest + req.originalUrl.slice(req.path.length));
      }
      return next();
    }

    if (
      isCanonicalSiteHost(req) &&
      (req.path === '/' + config.academyDir || req.path.startsWith('/' + config.academyDir + '/'))
    ) {
      const rest = req.path.slice(config.academyDir.length + 1) || '/';
      const query = req.originalUrl.slice(req.path.length);
      return res.redirect(301, config.academyOrigin + rest + query);
    }

    return next();
  });

  app.use(hostScopedStatic(academyRoot, isAcademyHost, staticOptions));
  app.use(hostScopedStatic(config.publicDir, (req) => !isAcademyHost(req), staticOptions));

  /**
   * Clean-URL resolution: '/about/' and '/about' both serve public/about/index.html.
   * The candidate path is resolved and confirmed to sit inside publicDir before any
   * read, so '..' segments cannot escape the served root.
   */
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();

    let decoded;
    try {
      decoded = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    if (decoded.includes('\0')) return next();

    const relative = decoded.replace(/^\/+/, '').replace(/\/+$/, '');
    const serveRoot = isAcademyHost(req) ? academyRoot : config.publicDir;
    const candidate = path.resolve(serveRoot, relative, 'index.html');

    const root = path.resolve(serveRoot) + path.sep;
    if (!candidate.startsWith(root)) return next();

    if (fs.existsSync(candidate)) {
      // Redirect to the canonical trailing-slash form so a page is not reachable
      // at two URLs (and does not split its own search ranking).
      if (relative && !req.path.endsWith('/')) {
        const query = req.originalUrl.slice(req.path.length);
        return res.redirect(301, `${req.path}/${query}`);
      }
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(candidate);
    }

    return next();
  });

  // ---- 404 ---------------------------------------------------------------
  app.use((req, res) => {
    const notFoundPage = path.join(isAcademyHost(req) ? academyRoot : config.publicDir, '404.html');
    res.status(404);
    if (req.accepts('html') && fs.existsSync(notFoundPage)) {
      return res.sendFile(notFoundPage);
    }
    return res.json({ ok: false, error: 'Not found.' });
  });

  // ---- Error handler -----------------------------------------------------
  // Never leak a stack trace or internal message to the client.
  app.use((err, req, res, _next) => {
    log('error', 'request.failed', {
      path: req.path,
      method: req.method,
      ipHash: hashIp(req.ip),
      error: err.message,
      stack: config.isProd ? undefined : err.stack,
    });

    if (res.headersSent) return;

    res.status(err.status || 500);
    if (req.path.startsWith('/api/')) {
      return res.json({ ok: false, error: 'Something went wrong on our side. Please try again.' });
    }
    return res.type('text/plain').send('Something went wrong on our side. Please try again.');
  });

  return app;
}

module.exports = { createApp };
