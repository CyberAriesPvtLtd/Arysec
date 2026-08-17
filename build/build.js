#!/usr/bin/env node
'use strict';

/**
 * Static site generator for the Arysec Technologies LLP website.
 *
 * Reads build/config.js plus the authored content under build/data/, validates it,
 * renders every page through the shared layout, and writes a fully static site into
 * public/. There is no runtime templating: the output is plain HTML that any static
 * host (or the bundled Express server) can serve.
 *
 *   node build/build.js
 */

const fs = require('fs');
const path = require('path');

const config = require('./config');
const { layout } = require('./templates/layout');
const { hasIcon } = require('./lib/icons');
const V = require('./lib/validate');

const homePage = require('./templates/pages/home');
const servicePage = require('./templates/pages/service');
const servicesHubPage = require('./templates/pages/servicesHub');
const solutionsPage = require('./templates/pages/solutions');
const aboutPage = require('./templates/pages/about');
const industriesPage = require('./templates/pages/industries');
const caseStudiesPage = require('./templates/pages/caseStudies');
const { insightsIndex, articlePage } = require('./templates/pages/insights');
const resourcesPage = require('./templates/pages/resources');
const careersPage = require('./templates/pages/careers');
const contactPage = require('./templates/pages/contact');
const legalPage = require('./templates/pages/legal');
const notFoundPage = require('./templates/pages/notFound');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(__dirname, 'data');
const SRC_STATIC = path.join(__dirname, 'static');
const OUT = path.join(ROOT, 'public');

const LEGAL_DOCS = ['privacy-policy', 'terms-of-service', 'cookie-policy', 'responsible-disclosure'];

/** Date stamped onto legal documents and the sitemap. Override for reproducible builds. */
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Loading and validation
// ---------------------------------------------------------------------------

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${path.relative(ROOT, file)} is not valid JSON: ${err.message}`);
  }
}

function loadData() {
  const errors = [];
  const missing = [];
  const services = {};
  const content = {};
  const validSlugs = config.services.map((s) => s.slug);

  config.services.forEach((svc) => {
    const file = path.join(DATA, 'services', `${svc.slug}.json`);
    if (!fs.existsSync(file)) {
      missing.push(path.relative(ROOT, file));
      return;
    }
    const data = readJson(file);
    errors.push(...V.validateService(data, `services/${svc.slug}.json`, validSlugs));
    if (data.category !== svc.category) {
      errors.push(
        `services/${svc.slug}.json: category "${data.category}" does not match the registry value "${svc.category}"`
      );
    }
    if (data.slug !== svc.slug) {
      errors.push(`services/${svc.slug}.json: slug field "${data.slug}" does not match the filename`);
    }
    if (!hasIcon(svc.icon)) {
      errors.push(`config.js: service "${svc.slug}" uses unknown icon "${svc.icon}"`);
    }
    services[svc.slug] = data;
  });

  const contentFiles = [
    ...LEGAL_DOCS.map((k) => ({ key: k, validate: (d, f) => V.validateDocument(d, f, ['title', 'intro']) })),
    { key: 'industries', validate: V.validateIndustries },
    { key: 'case-studies', validate: (d, f) => V.validateCaseStudies(d, f, validSlugs) },
    { key: 'careers', validate: V.validateCareers },
    ...config.articles.map((slug) => ({ key: `article-${slug}`, validate: V.validateArticle })),
  ];

  contentFiles.forEach(({ key, validate }) => {
    const file = path.join(DATA, 'content', `${key}.json`);
    if (!fs.existsSync(file)) {
      missing.push(path.relative(ROOT, file));
      return;
    }
    const data = readJson(file);
    errors.push(...validate(data, `content/${key}.json`));
    content[key] = data;
  });

  if (missing.length) {
    throw new Error(
      `Missing ${missing.length} content file(s):\n  ` + missing.join('\n  ')
    );
  }
  if (errors.length) {
    throw new Error(`Content validation failed with ${errors.length} error(s):\n  ` + errors.join('\n  '));
  }

  return { config, services, content };
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/** Map a site path to its file on disk: '/about/' -> public/about/index.html */
function outputFileFor(pagePath) {
  if (pagePath === '/') return path.join(OUT, 'index.html');
  if (pagePath.endsWith('.html')) return path.join(OUT, pagePath.replace(/^\//, ''));
  return path.join(OUT, pagePath.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

function writePage(ctx, page) {
  const file = outputFileFor(page.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, layout(ctx, page), 'utf8');
  return file;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      count++;
    }
  }
  return count;
}

function rimraf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Non-HTML output
// ---------------------------------------------------------------------------

function writeSitemap(pages) {
  const domain = config.company.domain;
  // Home and the primary conversion pages rank above deep content.
  const priorityFor = (p) => {
    if (p === '/') return '1.0';
    if (['/services/', '/solutions/', '/contact/'].includes(p)) return '0.9';
    if (p.startsWith('/services/')) return '0.8';
    if (['/about/', '/industries/', '/case-studies/'].includes(p)) return '0.7';
    if (p.startsWith('/insights/')) return '0.6';
    return '0.4';
  };

  const urls = pages
    .filter((p) => !p.noindex && !p.path.endsWith('.html'))
    .map(
      (p) =>
        `  <url>\n    <loc>${domain}${p.path}</loc>\n    <lastmod>${(p.article && p.article.modified) || BUILD_DATE}</lastmod>\n` +
        `    <changefreq>${p.path.startsWith('/insights/') ? 'monthly' : 'weekly'}</changefreq>\n` +
        `    <priority>${priorityFor(p.path)}</priority>\n  </url>`
    )
    .join('\n');

  fs.writeFileSync(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );
}

function writeRobots() {
  const domain = config.company.domain;
  fs.writeFileSync(
    path.join(OUT, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${domain}/sitemap.xml`,
      '',
    ].join('\n'),
    'utf8'
  );
}

function writeManifest() {
  fs.writeFileSync(
    path.join(OUT, 'site.webmanifest'),
    JSON.stringify(
      {
        name: config.company.name,
        short_name: config.company.shortName,
        description: 'IT and information security services',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a1628',
        theme_color: '#0a1628',
        icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
}

function writeSecurityTxt() {
  const domain = config.company.domain;
  const expires = new Date(Date.UTC(new Date(BUILD_DATE).getUTCFullYear() + 1, 0, 1)).toISOString();
  const body = [
    `Contact: mailto:${config.company.securityEmail}`,
    `Expires: ${expires}`,
    'Preferred-Languages: en',
    `Canonical: ${domain}/.well-known/security.txt`,
    `Policy: ${domain}/responsible-disclosure/`,
    '',
  ].join('\n');
  fs.mkdirSync(path.join(OUT, '.well-known'), { recursive: true });
  fs.writeFileSync(path.join(OUT, '.well-known', 'security.txt'), body, 'utf8');
  // Served at the root too, since some scanners only check the legacy location.
  fs.writeFileSync(path.join(OUT, 'security.txt'), body, 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function build() {
  const started = Date.now();
  const ctx = loadData();

  rimraf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  const pages = [
    homePage(ctx),
    servicesHubPage(ctx),
    ...config.services.map((svc) => servicePage(ctx, svc)),
    solutionsPage(ctx),
    aboutPage(ctx),
    industriesPage(ctx),
    caseStudiesPage(ctx),
    insightsIndex(ctx),
    ...config.articles.map((slug) => articlePage(ctx, slug)),
    resourcesPage(ctx),
    careersPage(ctx),
    contactPage(ctx),
    ...LEGAL_DOCS.map((key) => legalPage(ctx, key, BUILD_DATE)),
    notFoundPage(ctx),
  ];

  // Duplicate paths would silently overwrite each other.
  const seen = new Set();
  pages.forEach((p) => {
    if (seen.has(p.path)) throw new Error(`Duplicate page path: ${p.path}`);
    seen.add(p.path);
  });

  pages.forEach((p) => writePage(ctx, p));

  const assetCount = copyDir(SRC_STATIC, OUT);
  writeSitemap(pages);
  writeRobots();
  writeManifest();
  writeSecurityTxt();

  const ms = Date.now() - started;
  process.stdout.write(
    `Built ${pages.length} pages and copied ${assetCount} static files to public/ in ${ms}ms\n`
  );
  return pages;
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    process.stderr.write(`\nBuild failed: ${err.message}\n\n`);
    process.exit(1);
  }
}

module.exports = { build, loadData, outputFileFor };
