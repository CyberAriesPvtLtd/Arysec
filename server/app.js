'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');

const { config } = require('./config');
const { securityHeaders, globalLimiter } = require('./middleware/security');
const { log, hashIp } = require('./lib/logger');
const apiRoutes = require('./routes/api');

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
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\.woff2?$/.test(filePath)) {
        // Font files never change without a filename change.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(css|js|svg|png|jpe?g|webp|ico)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  };

  app.use(express.static(config.publicDir, staticOptions));

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
    const candidate = path.resolve(config.publicDir, relative, 'index.html');

    const root = path.resolve(config.publicDir) + path.sep;
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
    const notFoundPage = path.join(config.publicDir, '404.html');
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
