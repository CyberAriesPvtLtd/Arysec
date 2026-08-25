#!/usr/bin/env node
'use strict';

/**
 * Post-build integrity check for the generated site.
 *
 * Verifies that every internal link resolves to a real page or asset, that every
 * in-page anchor target exists, that required meta tags are present, and that no
 * page ships an inline script or style attribute (which the CSP would block).
 *
 *   node scripts/check-links.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

/**
 * Both generated sites are checked. The academy is emitted inside the main
 * output but is served from the root of its own subdomain, so its links resolve
 * against public/academy/ rather than public/ — checking them against the wrong
 * root would report every academy link as broken.
 */
const SITES = [
  { label: 'main', root: PUBLIC, domain: 'https://www.arysec.in', skip: [path.join(PUBLIC, 'academy')] },
  { label: 'academy', root: path.join(PUBLIC, 'academy'), domain: 'https://academy.arysec.in', skip: [] },
];

const problems = [];
const stats = { pages: 0, links: 0, anchors: 0 };

function walk(dir, skip, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skip.includes(full)) continue;
      walk(full, skip, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/** Map a site-absolute href to the file that should serve it, within one site. */
function resolveTarget(root, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return path.join(root, 'index.html');
  const rel = clean.replace(/^\//, '');
  if (/\.[a-z0-9]+$/i.test(rel)) return path.join(root, rel);
  return path.join(root, rel.replace(/\/$/, ''), 'index.html');
}

function idsIn(html) {
  const ids = new Set();
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

const htmlCache = new Map();
const readHtml = (file) => {
  if (!htmlCache.has(file)) htmlCache.set(file, fs.readFileSync(file, 'utf8'));
  return htmlCache.get(file);
};

for (const site of SITES) {
  checkSite(site);
}

function checkSite(site) {
const { root: PUBLIC, domain: DOMAIN, label: LABEL } = site;
const files = walk(PUBLIC, site.skip);

for (const file of files) {
  const rel = `[${LABEL}] /` + path.relative(PUBLIC, file).replace(/\\/g, '/');
  const html = readHtml(file);
  stats.pages++;

  // --- required metadata ---
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch || titleMatch[1].length < 5) {
    problems.push(`${rel}: missing or empty <title>`);
  } else if (titleMatch[1].length > 70) {
    problems.push(`${rel}: <title> is ${titleMatch[1].length} chars (max 70 — it will be cut in search results)`);
  }

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  if (!descMatch) {
    problems.push(`${rel}: missing meta description`);
  } else if (descMatch[1].length < 70 || descMatch[1].length > 175) {
    problems.push(`${rel}: meta description is ${descMatch[1].length} chars (want 70-175)`);
  }

  const canonicals = (html.match(/<link rel="canonical"/g) || []).length;
  if (canonicals !== 1) problems.push(`${rel}: ${canonicals} canonical links (expected exactly 1)`);
  if (!/<html lang="/.test(html)) problems.push(`${rel}: missing lang attribute on <html>`);
  if (!/<meta name="robots"/.test(html)) problems.push(`${rel}: missing robots meta`);
  if (!/<meta property="og:image" content="[^"]+\.png"/.test(html)) {
    problems.push(`${rel}: og:image missing or not a PNG (social platforms do not render SVG)`);
  }
  if (!/<h1[ >]/.test(html)) problems.push(`${rel}: no <h1>`);

  // Self-hosted assets only: a third-party font or CDN reference reintroduces a
  // render-blocking origin and breaks the tightened CSP.
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\./.test(html)) {
    problems.push(`${rel}: references a third-party font/CDN origin`);
  }

  const h1Count = (html.match(/<h1[ >]/g) || []).length;
  if (h1Count > 1) problems.push(`${rel}: ${h1Count} <h1> elements (expected exactly 1)`);

  // Heading levels must not skip (h1 -> h3), which breaks screen-reader navigation.
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const levels = (main.match(/<h([1-6])[ >]/g) || []).map((t) => Number(t.match(/\d/)[0]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      problems.push(`${rel}: heading level skips h${levels[i - 1]} -> h${levels[i]}`);
      break;
    }
  }

  // --- CSP hygiene: no inline scripts or style attributes ---
  const inlineScript = /<script(?![^>]*\ssrc=)(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/i;
  if (inlineScript.test(html)) problems.push(`${rel}: contains an inline <script> (blocked by CSP)`);
  if (/\sstyle="/.test(html)) problems.push(`${rel}: contains an inline style attribute (blocked by CSP)`);
  if (/\son(click|load|error|mouseover|submit)=/i.test(html)) {
    problems.push(`${rel}: contains an inline event handler attribute (blocked by CSP)`);
  }

  // --- JSON-LD parses ---
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let ld;
  while ((ld = ldRe.exec(html))) {
    try {
      JSON.parse(ld[1]);
    } catch (err) {
      problems.push(`${rel}: invalid JSON-LD (${err.message})`);
    }
  }

  // --- links ---
  const linkRe = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('data:') ||
      href === '#'
    ) {
      continue;
    }
    if (!href.startsWith('/') && !href.startsWith('#')) {
      problems.push(`${rel}: relative link "${href}" — all internal links must be site-absolute`);
      continue;
    }

    stats.links++;

    if (href.startsWith('#')) {
      stats.anchors++;
      if (!idsIn(html).has(href.slice(1))) {
        problems.push(`${rel}: anchor "${href}" has no matching id on the page`);
      }
      continue;
    }

    const target = resolveTarget(PUBLIC, href);
    if (!fs.existsSync(target)) {
      problems.push(`${rel}: link "${href}" does not resolve (expected ${path.relative(ROOT, target)})`);
      continue;
    }

    const fragment = href.split('#')[1];
    if (fragment) {
      stats.anchors++;
      if (!idsIn(readHtml(target)).has(fragment)) {
        problems.push(`${rel}: link "${href}" points at a missing anchor`);
      }
    }
  }
}

// --- required non-HTML output ---
const required = ['sitemap.xml', 'robots.txt', 'site.webmanifest', '404.html'];
// security.txt is published once, for the entity, on the main domain.
if (LABEL === 'main') required.push('.well-known/security.txt');
required.forEach((f) => {
  if (!fs.existsSync(path.join(PUBLIC, f))) problems.push(`[${LABEL}] missing required file: ${f}`);
});

// --- every page appears in the sitemap ---
const sitemap = fs.readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
for (const file of files) {
  const rel = '/' + path.relative(PUBLIC, file).replace(/\\/g, '/');
  if (rel === '/404.html') continue;
  const url = rel.replace(/index\.html$/, '');
  if (!sitemap.includes(`<loc>${DOMAIN}${url}</loc>`)) {
    problems.push(`[${LABEL}] sitemap.xml: missing entry for ${url}`);
  }
}
}

process.stdout.write(
  `Checked ${SITES.length} sites, ${stats.pages} pages, ${stats.links} internal links, ${stats.anchors} anchors.\n`
);

if (problems.length) {
  process.stderr.write(`\n${problems.length} problem(s) found:\n  ` + problems.join('\n  ') + '\n\n');
  process.exit(1);
}

process.stdout.write('No problems found.\n');
