#!/usr/bin/env node
'use strict';

const fs = require('fs');

const { config, validate } = require('./config');
const { createApp } = require('./app');
const { getDb, closeDb } = require('./lib/db');
const { verifyTransport } = require('./lib/mailer');
const { log } = require('./lib/logger');

async function start() {
  if (!fs.existsSync(config.publicDir)) {
    process.stderr.write(
      `\npublic/ does not exist. Run "npm run build" first (or "npm start", which builds then serves).\n\n`
    );
    process.exit(1);
  }

  validate().forEach((problem) => log('warn', 'config.warning', { problem }));

  // Opening the database at startup surfaces a permissions or disk problem here
  // rather than on the first enquiry a real customer submits.
  getDb();

  const mail = await verifyTransport();
  if (!mail.configured) {
    log('warn', 'mail.unconfigured', {
      note: 'SMTP is not configured. Submissions will be stored but no notification email will be sent.',
    });
  } else if (!mail.ok) {
    log('error', 'mail.unreachable', { error: mail.error });
  } else {
    log('info', 'mail.ready', { host: config.mail.host });
  }

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    log('info', 'server.started', {
      url: `http://${config.host}:${config.port}`,
      env: config.env,
      trustProxy: config.trustProxy,
      origins: config.allowedOrigins.length ? config.allowedOrigins : 'unrestricted (development)',
    });
  });

  // Slow-loris style connections should not hold a worker open indefinitely.
  server.headersTimeout = 20000;
  server.requestTimeout = 30000;
  server.keepAliveTimeout = 10000;

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log('info', 'server.stopping', { signal });

    server.close(() => {
      closeDb();
      log('info', 'server.stopped', {});
      process.exit(0);
    });

    // Force exit if connections refuse to drain.
    setTimeout(() => {
      closeDb();
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    log('error', 'unhandled.rejection', { error: reason instanceof Error ? reason.message : String(reason) });
  });
  process.on('uncaughtException', (err) => {
    log('error', 'uncaught.exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  return server;
}

if (require.main === module) {
  start().catch((err) => {
    process.stderr.write(`Failed to start: ${err.message}\n`);
    process.exit(1);
  });
}

module.exports = { start };
