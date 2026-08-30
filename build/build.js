#!/usr/bin/env node
'use strict';

/**
 * Static site generator for the Arysec Consultancy LLP website.
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
const crypto = require('crypto');

const config = require('./config');
const academyConfig = require('./config.academy');
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
const onboardingPage = require('./templates/pages/onboarding');
const legalPage = require('./templates/pages/legal');
const notFoundPage = require('./templates/pages/notFound');

const academyHome = require('./templates/academy/home');
const academyProgrammesHub = require('./templates/academy/programmesHub');
const academyProgramme = require('./templates/academy/programme');
const academyCertification = require('./templates/academy/certification');
const academyForOrganisations = require('./templates/academy/forOrganisations');
const academyContact = require('./templates/academy/contact');
const academyNotFound = require('./templates/academy/notFound');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(__dirname, 'data');
const SRC_STATIC = path.join(__dirname, 'static');
const OUT = path.join(ROOT, 'public');

/**
 * The academy is a separate site on academy.arysec.in. It is emitted inside the
 * main output so a single deployment can serve both, with the server mapping the
 * subdomain onto this directory by Host header — see server/app.js. Requests for
 * /academy/ on the main domain are redirected to the subdomain, so no page is
 * ever reachable at two addresses.
 */
const ACADEMY_DIR = 'academy';
const ACADEMY_OUT = path.join(OUT, ACADEMY_DIR);
const SRC_STATIC_ACADEMY = path.join(__dirname, 'static-academy');

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

/** Load and validate the academy's programmes and page content. */
function loadAcademyData() {
  const errors = [];
  const missing = [];
  const programmes = {};
  const content = {};
  const validSlugs = academyConfig.programmes.map((p) => p.slug);

  academyConfig.programmes.forEach((entry) => {
    const file = path.join(DATA, 'academy', 'programmes', `${entry.slug}.json`);
    if (!fs.existsSync(file)) {
      missing.push(path.relative(ROOT, file));
      return;
    }
    const data = readJson(file);
    errors.push(...V.validateProgramme(data, `academy/programmes/${entry.slug}.json`, validSlugs));
    if (data.category !== entry.category) {
      errors.push(
        `academy/programmes/${entry.slug}.json: category "${data.category}" does not match the registry value "${entry.category}"`
      );
    }
    if (data.slug !== entry.slug) {
      errors.push(`academy/programmes/${entry.slug}.json: slug field "${data.slug}" does not match the filename`);
    }
    if (!hasIcon(entry.icon)) {
      errors.push(`config.academy.js: programme "${entry.slug}" uses unknown icon "${entry.icon}"`);
    }
    programmes[entry.slug] = data;
  });

  const contentFiles = [
    { key: 'home', validate: V.validateAcademyHome },
    { key: 'certification', validate: (d, f) => V.validateAcademyPage(d, f, ['process', 'included', 'honesty']) },
    {
      key: 'for-organisations',
      validate: (d, f) => V.validateAcademyPage(d, f, ['formats', 'tailoring', 'reporting', 'commercials']),
    },
  ];

  contentFiles.forEach(({ key, validate }) => {
    const file = path.join(DATA, 'academy', 'content', `${key}.json`);
    if (!fs.existsSync(file)) {
      missing.push(path.relative(ROOT, file));
      return;
    }
    const data = readJson(file);
    errors.push(...validate(data, `academy/content/${key}.json`));
    content[key] = data;
  });

  if (missing.length) {
    throw new Error(`Missing ${missing.length} academy content file(s):\n  ` + missing.join('\n  '));
  }
  if (errors.length) {
    throw new Error(
      `Academy content validation failed with ${errors.length} error(s):\n  ` + errors.join('\n  ')
    );
  }

  return { config: academyConfig, programmes, content };
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/**
 * Content-hash the stylesheet and script so a rebuild is visible immediately.
 *
 * These filenames used to be fixed, which meant a browser that had loaded the
 * site kept serving the previous CSS from its own cache for hours — a redesign
 * would land as new markup styled by the old stylesheet. Hashing the name makes
 * every change a new URL, so the always-revalidated HTML points at it at once
 * and the files themselves can be cached indefinitely.
 */
const FINGERPRINTED = [
  { dir: 'css', file: 'styles.css', key: 'css' },
  { dir: 'js', file: 'main.js', key: 'js' },
];

function fingerprintAssets() {
  const assets = {};
  for (const entry of FINGERPRINTED) {
    const source = path.join(SRC_STATIC, entry.dir, entry.file);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0, 8);
    const ext = path.extname(entry.file);
    const name = `${path.basename(entry.file, ext)}.${hash}${ext}`;
    assets[entry.key] = { name, href: `/${entry.dir}/${name}`, dir: entry.dir, from: entry.file };
  }
  return assets;
}

/** Rename the copied assets in an output root to their fingerprinted names. */
function applyFingerprints(root, assets) {
  for (const key of Object.keys(assets)) {
    const a = assets[key];
    const from = path.join(root, a.dir, a.from);
    if (fs.existsSync(from)) fs.renameSync(from, path.join(root, a.dir, a.name));
  }
}

/** Map a site path to its file on disk: '/about/' -> <root>/about/index.html */
function outputFileFor(root, pagePath) {
  if (pagePath === '/') return path.join(root, 'index.html');
  if (pagePath.endsWith('.html')) return path.join(root, pagePath.replace(/^\//, ''));
  return path.join(root, pagePath.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

function writePage(root, ctx, page) {
  const file = outputFileFor(root, page.path);
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

function writeSitemap(root, siteConfig, pages, priorityFor) {
  const domain = siteConfig.company.domain;

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
    path.join(root, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );
}

/** Home and the primary conversion pages rank above deep content. */
function mainPriority(p) {
  if (p === '/') return '1.0';
  if (['/services/', '/solutions/', '/contact/'].includes(p)) return '0.9';
  if (p.startsWith('/services/')) return '0.8';
  if (['/about/', '/industries/', '/case-studies/'].includes(p)) return '0.7';
  if (p.startsWith('/insights/')) return '0.6';
  return '0.4';
}

function academyPriority(p) {
  if (p === '/') return '1.0';
  if (['/programmes/', '/contact/'].includes(p)) return '0.9';
  if (p.startsWith('/programmes/')) return '0.8';
  return '0.7';
}

function writeRobots(root, siteConfig, extraDisallow) {
  const domain = siteConfig.company.domain;
  fs.writeFileSync(
    path.join(root, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      ...(extraDisallow || []).map((d) => `Disallow: ${d}`),
      '',
      `Sitemap: ${domain}/sitemap.xml`,
      '',
    ].join('\n'),
    'utf8'
  );
}

function writeManifest(root, siteConfig) {
  fs.writeFileSync(
    path.join(root, 'site.webmanifest'),
    JSON.stringify(
      {
        name: siteConfig.company.name,
        short_name: siteConfig.company.shortName,
        description: siteConfig.organisation.description,
        start_url: '/',
        display: 'standalone',
        background_color: '#12100e',
        theme_color: '#b7410e',
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
  const academyCtx = loadAcademyData();

  // Hashes are needed while rendering, so compute them from the source files
  // before any page is written, then rename the copies in each output root.
  const assets = fingerprintAssets();
  ctx.assets = assets;
  academyCtx.assets = assets;

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
    onboardingPage(ctx),
    ...LEGAL_DOCS.map((key) => legalPage(ctx, key, BUILD_DATE)),
    notFoundPage(ctx),
  ];

  const academyPages = [
    academyHome(academyCtx),
    academyProgrammesHub(academyCtx),
    ...academyConfig.programmes.map((entry) => academyProgramme(academyCtx, entry)),
    academyCertification(academyCtx),
    academyForOrganisations(academyCtx),
    academyContact(academyCtx),
    academyNotFound(academyCtx),
  ];

  assertUniquePaths(pages, 'main');
  assertUniquePaths(academyPages, 'academy');

  pages.forEach((p) => writePage(OUT, ctx, p));

  const assetCount = copyDir(SRC_STATIC, OUT);
  applyFingerprints(OUT, assets);
  writeSitemap(OUT, config, pages, mainPriority);
  // The academy lives under /academy/ so one deployment can serve both hosts.
  // Crawlers reaching it on the main domain are turned away here; visitors are
  // redirected to the subdomain by the server.
  writeRobots(OUT, config, ['/' + ACADEMY_DIR + '/']);
  writeManifest(OUT, config);
  writeSecurityTxt();

  // Academy output. Its pages use root-relative links because they are served
  // from the root of academy.arysec.in, so it needs its own copy of the static
  // assets rather than reaching up into the parent site's.
  fs.mkdirSync(ACADEMY_OUT, { recursive: true });
  academyPages.forEach((p) => writePage(ACADEMY_OUT, academyCtx, p));
  const academyAssets =
    copyDir(SRC_STATIC, ACADEMY_OUT) + copyDir(SRC_STATIC_ACADEMY, ACADEMY_OUT);
  applyFingerprints(ACADEMY_OUT, assets);
  writeSitemap(ACADEMY_OUT, academyConfig, academyPages, academyPriority);
  writeRobots(ACADEMY_OUT, academyConfig);
  writeManifest(ACADEMY_OUT, academyConfig);

  const ms = Date.now() - started;
  process.stdout.write(
    `Built ${pages.length} pages and copied ${assetCount} static files to public/\n` +
      `Built ${academyPages.length} academy pages and copied ${academyAssets} static files to public/${ACADEMY_DIR}/\n` +
      `Done in ${ms}ms\n`
  );
  return { pages, academyPages };
}

/** Duplicate paths would silently overwrite each other. */
function assertUniquePaths(pages, label) {
  const seen = new Set();
  pages.forEach((p) => {
    if (seen.has(p.path)) throw new Error(`Duplicate ${label} page path: ${p.path}`);
    seen.add(p.path);
  });
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
