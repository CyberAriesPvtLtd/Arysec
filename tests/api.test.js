'use strict';

/**
 * Integration tests for the API. Runs the real Express app against a temporary
 * database so nothing touches the deployed data file.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('node:http');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arysec-test-'));
process.env.DB_FILE = path.join(tmpDir, 'test.db');
process.env.UPLOAD_DIR = path.join(tmpDir, 'uploads');
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.RATE_FORM_MAX = '1000';
process.env.RATE_GLOBAL_MAX = '5000';
process.env.MIN_FORM_SECONDS = '0';

const { createApp } = require('../server/app');
const { closeDb, listSubmissions } = require('../server/lib/db');

let server;
let base;

test.before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function post(pathname, body) {
  return fetch(base + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * GET without following redirects, optionally under a different Host header.
 * Uses node:http rather than fetch because Host is a forbidden header for fetch,
 * and host-based routing is exactly what these tests exercise.
 */
function get(pathname, host) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: server.address().port,
        path: pathname,
        method: 'GET',
        headers: { Host: host || 'www.arysec.in', Accept: 'text/html' },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const validContact = () => ({
  name: 'Test Person',
  email: 'test.person@example.com',
  company: 'Example Ltd',
  phone: '+91 90048 57727',
  service: 'vCISO as a Service',
  message: 'We need help preparing for an ISO 27001 certification audit next quarter.',
  consent: 'yes',
  formLoadedAt: String(Date.now() - 20_000),
  website: '',
});

test('pages reference content-hashed assets, so a rebuild is never served stale', async () => {
  // Fixed asset names meant a browser kept the previous stylesheet from its own
  // cache for hours after a deploy — new markup styled by the old CSS.
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.body, /<link rel="stylesheet" href="\/css\/styles\.[0-9a-f]{8}\.css">/);
  assert.match(res.body, /<script src="\/js\/main\.[0-9a-f]{8}\.js" defer><\/script>/);
});

test('a fingerprinted asset is served immutable', async () => {
  const page = await get('/');
  const href = page.body.match(/href="(\/css\/styles\.[0-9a-f]{8}\.css)"/)[1];
  const res = await get(href);
  assert.equal(res.status, 200);
  assert.match(res.headers['cache-control'], /immutable/);
  assert.match(res.body, /--accent: #ff6a18/);
});

test('the academy host serves the academy site at its root', async () => {
  const res = await get('/', 'academy.arysec.in');
  assert.equal(res.status, 200);
  assert.match(res.body, /<link rel="canonical" href="https:\/\/academy\.arysec\.in\/">/);
  assert.match(res.body, /Arysec Academy/);
});

test('the main host serves the main site at its root', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.body, /<link rel="canonical" href="https:\/\/www\.arysec\.in\/">/);
});

test('/academy/ on the main host redirects to the subdomain', async () => {
  const res = await get('/academy/programmes/');
  assert.equal(res.status, 301);
  assert.equal(res.headers.location, 'https://academy.arysec.in/programmes/');
});

test('/academy/ on the academy host redirects to the equivalent root path', async () => {
  const res = await get('/academy/programmes/', 'academy.arysec.in');
  assert.equal(res.status, 301);
  assert.equal(res.headers.location, '/programmes/');
});

test('a preview host serves the academy in place instead of redirecting away', async () => {
  // The subdomain does not resolve on a preview deployment or on localhost, so
  // bouncing to it would make the academy unreviewable there.
  const res = await get('/academy/programmes/', 'arysec-git-preview.vercel.app');
  assert.equal(res.status, 200);
  assert.match(res.body, /Arysec Academy/);
});

test('the academy host cannot reach the main site by path', async () => {
  const res = await get('/services/vciso/', 'academy.arysec.in');
  assert.equal(res.status, 404);
});

test('the main host cannot reach academy files by path', async () => {
  const res = await get('/programmes/', 'www.arysec.in');
  assert.equal(res.status, 404);
});

test('each host serves its own 404 page', async () => {
  const academy = await get('/no-such-page/', 'academy.arysec.in');
  assert.equal(academy.status, 404);
  assert.match(academy.body, /Academy Home/);

  const main = await get('/no-such-page/');
  assert.equal(main.status, 404);
  assert.match(main.body, /All Services/);
});

test('health endpoint responds', async () => {
  const res = await fetch(base + '/api/health');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);
});

test('valid contact submission is accepted and stored', async () => {
  const res = await post('/api/contact', validContact());
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);

  const rows = listSubmissions('contact', 10);
  const stored = rows.find((r) => r.email === 'test.person@example.com');
  assert.ok(stored, 'submission should be persisted');
  assert.strictEqual(stored.consent, 1);
  assert.strictEqual(stored.name, 'Test Person');
});

const validAcademy = () => ({
  name: 'Training Buyer',
  email: 'training.buyer@example.com',
  company: 'Example Ltd',
  phone: '+91 90048 57727',
  programme: 'Phishing Simulation & Drills',
  delegates: '120',
  message: 'We would like quarterly phishing drills for the whole company, starting next quarter.',
  consent: 'yes',
  formLoadedAt: String(Date.now() - 20_000),
  website: '',
});

test('valid academy enquiry is accepted and stored under its own kind', async () => {
  const res = await post('/api/academy-enquiry', validAcademy());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);

  const rows = listSubmissions('academy', 10);
  const row = rows.find((r) => r.email === 'training.buyer@example.com');
  assert.ok(row, 'academy submission was not stored');
  assert.equal(row.kind, 'academy');
  assert.equal(row.subject, 'Phishing Simulation & Drills');
  assert.match(row.message, /Approximate delegates: 120/);
});

test('academy enquiry without a programme falls back to a general subject', async () => {
  const payload = { ...validAcademy(), email: 'no.programme@example.com' };
  delete payload.programme;
  delete payload.delegates;
  const res = await post('/api/academy-enquiry', payload);
  assert.equal(res.status, 200);

  const row = listSubmissions('academy', 20).find((r) => r.email === 'no.programme@example.com');
  assert.ok(row);
  assert.equal(row.subject, 'General training enquiry');
  // With no delegate count the message is stored exactly as submitted.
  assert.ok(!row.message.startsWith('Approximate delegates'));
});

test('academy enquiry rejects a submission without consent', async () => {
  const payload = { ...validAcademy(), email: 'no.consent@example.com' };
  delete payload.consent;
  const res = await post('/api/academy-enquiry', payload);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.errors.consent);
});

test('academy enquiry rejects an over-long delegate count', async () => {
  const res = await post('/api/academy-enquiry', { ...validAcademy(), delegates: 'x'.repeat(200) });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.delegates);
});

test('academy honeypot submissions get a success response but are not stored', async () => {
  const before = listSubmissions('academy', 100).length;
  const res = await post('/api/academy-enquiry', {
    ...validAcademy(),
    email: 'academy.bot@example.com',
    website: 'http://spam.example',
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
  assert.equal(listSubmissions('academy', 100).length, before);
});

test('contact rejects a missing required field with a per-field error', async () => {
  const payload = validContact();
  delete payload.message;
  const res = await post('/api/contact', payload);
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.ok, false);
  assert.ok(body.errors.message, 'expected a field-level error for message');
});

test('contact rejects a submission without consent', async () => {
  const payload = { ...validContact(), consent: 'no' };
  const res = await post('/api/contact', payload);
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.consent);
});

test('contact rejects an invalid email address', async () => {
  const res = await post('/api/contact', { ...validContact(), email: 'nope' });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.email);
});

test('CRLF in a submitted name is neutralised before storage', async () => {
  const payload = {
    ...validContact(),
    email: 'crlf.test@example.com',
    name: 'Evil\r\nBcc: victim@example.com',
  };
  const res = await post('/api/contact', payload);
  assert.strictEqual(res.status, 200);

  const stored = listSubmissions('contact', 20).find((r) => r.email === 'crlf.test@example.com');
  assert.ok(stored);
  assert.ok(!stored.name.includes('\n'), 'stored name must not contain a newline');
  assert.ok(!stored.name.includes('\r'), 'stored name must not contain a carriage return');
});

test('honeypot submissions get a success response but are not stored', async () => {
  const before = listSubmissions('contact', 100).length;
  const res = await post('/api/contact', {
    ...validContact(),
    email: 'honeypot.bot@example.com',
    website: 'http://spam.example',
  });
  assert.strictEqual(res.status, 200, 'a bot must not learn that it was blocked');
  const body = await res.json();
  assert.strictEqual(body.ok, true);

  const after = listSubmissions('contact', 100);
  assert.strictEqual(after.length, before, 'honeypot submission must not be stored');
  assert.ok(!after.some((r) => r.email === 'honeypot.bot@example.com'));
});

test('oversized message is rejected', async () => {
  const res = await post('/api/contact', { ...validContact(), message: 'x'.repeat(5000) });
  assert.strictEqual(res.status, 400);
});

test('an over-large body is rejected before parsing completes', async () => {
  const res = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(200_000) }),
  });
  assert.ok(res.status === 413 || res.status === 400, `expected 413/400, got ${res.status}`);
});

test('malformed JSON produces a 400, not a 500', async () => {
  const res = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  assert.strictEqual(res.status, 400);
});

test('resource request is accepted and stored', async () => {
  const res = await post('/api/resource-request', {
    resource: 'ISO 27001 Certification Roadmap',
    name: 'Reader Person',
    email: 'reader@example.com',
    company: 'Example Ltd',
    consent: 'yes',
    formLoadedAt: String(Date.now() - 20_000),
  });
  assert.strictEqual(res.status, 200);
  const stored = listSubmissions('resource', 10).find((r) => r.email === 'reader@example.com');
  assert.ok(stored);
  assert.strictEqual(stored.subject, 'ISO 27001 Certification Roadmap');
});

test('newsletter subscription is idempotent', async () => {
  const payload = { email: 'subscriber@example.com', formLoadedAt: String(Date.now() - 20_000) };
  const first = await post('/api/newsletter', payload);
  const second = await post('/api/newsletter', payload);
  assert.strictEqual(first.status, 200);
  assert.strictEqual(second.status, 200, 'resubscribing must not error');
});

test('unknown API routes return JSON 404', async () => {
  const res = await fetch(base + '/api/does-not-exist');
  assert.strictEqual(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
});

test('security headers are present on HTML responses', async () => {
  const res = await fetch(base + '/api/health');
  assert.ok(res.headers.get('content-security-policy'), 'CSP header should be set');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('x-powered-by'), null, 'X-Powered-By must not be exposed');

  const csp = res.headers.get('content-security-policy');
  assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"), 'script-src must not allow unsafe-inline');
  assert.ok(csp.includes("frame-ancestors 'none'"), 'clickjacking protection must be present');
  assert.ok(csp.includes("object-src 'none'"));
});

test('path traversal against the static handler is refused', async () => {
  for (const attempt of [
    '/../package.json',
    '/..%2f..%2fpackage.json',
    '/%2e%2e/%2e%2e/server/config.js',
  ]) {
    const res = await fetch(base + attempt, { redirect: 'manual' });
    assert.ok(res.status >= 400 || res.status === 301, `${attempt} should not serve a file (got ${res.status})`);
    if (res.status < 400) continue;
    const text = await res.text();
    assert.ok(!text.includes('"dependencies"'), `${attempt} leaked package.json`);
    assert.ok(!text.includes('SMTP_HOST'), `${attempt} leaked server config`);
  }
});

test('rate limiting eventually rejects a flood', async () => {
  process.env.RATE_FORM_MAX = '2';
  // The limiter is constructed per-route at app creation, so build a fresh app to
  // pick up the tightened limit rather than mutating the running one.
  const { createApp: freshCreateApp } = require('../server/app');
  delete require.cache[require.resolve('../server/config')];
  delete require.cache[require.resolve('../server/middleware/security')];
  delete require.cache[require.resolve('../server/routes/api')];
  delete require.cache[require.resolve('../server/app')];

  const limitedApp = require('../server/app').createApp();
  const limitedServer = await new Promise((resolve) => {
    const s = limitedApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  const limitedBase = `http://127.0.0.1:${limitedServer.address().port}`;

  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const res = await fetch(limitedBase + '/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `flood${i}@example.com`, formLoadedAt: String(Date.now() - 20_000) }),
    });
    statuses.push(res.status);
  }

  await new Promise((resolve) => limitedServer.close(resolve));
  assert.ok(statuses.includes(429), `expected at least one 429, got ${statuses.join(',')}`);
  assert.ok(freshCreateApp, 'app factory should be importable');
});
