'use strict';

const crypto = require('crypto');

/**
 * Minimal structured logger.
 *
 * Deliberately does NOT log personal data. Submission contents stay in the database;
 * logs record only the event, a hashed IP, and non-identifying metadata, so shipping
 * logs to a third party does not become a privacy incident.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[process.env.LOG_LEVEL] || LEVELS.info;

/**
 * Salt for IP hashing. A random per-process salt means hashes are not correlatable
 * across restarts or comparable against a precomputed table of the IPv4 space.
 * Set IP_HASH_SALT to keep hashes stable across restarts (useful for abuse analysis).
 */
const IP_SALT = process.env.IP_HASH_SALT || crypto.randomBytes(32).toString('hex');

/** One-way, salted, truncated IP fingerprint for rate-limit and abuse analysis. */
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHmac('sha256', IP_SALT).update(String(ip)).digest('hex').slice(0, 32);
}

function log(level, event, data) {
  if ((LEVELS[level] || 0) < threshold) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(data || {}),
  });
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

module.exports = { log, hashIp };
