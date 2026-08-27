'use strict';

/**
 * Vercel Function backing every /api/* route (see the rewrite in vercel.json).
 *
 * Nothing under server/ ran on Vercel before this file existed: the project's build
 * command is only `node build/build.js`, which produces the static public/ output —
 * server/server.js and its app.listen() were never invoked, so every form on both
 * sites (contact, careers, newsletter, the academy enquiry form) posted to an /api/*
 * path that no static file and no function matched. Vercel's platform default for a
 * non-safe method with no match is 405, which is what reached real visitors.
 *
 * createApp() also wires up the static-file-serving and academy host-routing
 * middleware, but those never fire here: every /api/* request is fully handled by
 * apiRoutes before Express would reach that code, and nothing outside /api/* is
 * rewritten to this function. That code exists for the self-hosted (systemd/nginx)
 * deployment described in DEPLOYMENT.md, where this same server/app.js serves the
 * entire site, not just the API.
 */

const { createApp } = require('../server/app');

module.exports = createApp();
