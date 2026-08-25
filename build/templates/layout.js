'use strict';

const { esc, escJson, each, join } = require('../lib/html');
const { icon } = require('../lib/icons');

const CHEVRON =
  '<svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const BRAND_MARK = (idSuffix) => `
        <svg class="brand-mark" viewBox="5 8 110 97" width="42" height="37" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="brandGrad${idSuffix}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f8430c"/><stop offset="1" stop-color="#fb9218"/>
            </linearGradient>
          </defs>
          <path d="M69.03 24.57 L104.98 86.62 Q111 97 99 97 L21 97 Q9 97 15.02 86.62 L50.97 24.57 Q60 9 69.03 24.57 Z" fill="none" stroke="url(#brandGrad${idSuffix})" stroke-width="15" stroke-linejoin="round"/>
          <path d="M87.96 86.5 L59.92 38.59 Q57.9 35.13 55.94 38.62 L40.14 66.84 L20.86 77.46 L24.14 84.54 L47.86 75.16 L58.1 56.87 L75.45 86.5 Z" fill="url(#brandGrad${idSuffix})"/>
        </svg>`;

/** Wordmark and strapline, matching the logo lockup. */
const BRAND_TEXT = `
        <span class="brand-text">
          <span class="brand-name">ARYSEC</span>
          <span class="brand-tagline">Assess<span>.</span> Assure<span>.</span> Advance<span>.</span></span>
        </span>`;

/** True when `href` is the current page or an ancestor section of it. */
function isActive(href, path) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href);
}

function renderMegaServices(ctx) {
  const { serviceCategories, services } = ctx.config;
  const cols = serviceCategories.map((cat) => {
    const items = services.filter((s) => s.category === cat.name);
    return `
          <div class="mega-col">
            <h4 class="mega-heading">${esc(cat.name)}</h4>
            ${each(items, (s) => {
              const data = ctx.services[s.slug];
              return `<a class="mega-link" href="/services/${esc(s.slug)}/">
              <span class="mega-link-icon">${icon(s.icon)}</span>
              <span class="mega-link-text">
                <span class="mega-link-title">${esc(data.name)}</span>
                <span class="mega-link-desc">${esc(data.shortName)}</span>
              </span>
            </a>`;
            })}
          </div>`;
  });

  return `
      <div class="mega-panel" id="mega-services" hidden>
        <div class="container mega-inner">
          <div class="mega-cols">${join(cols)}
          </div>
          <div class="mega-footer">
            <a class="text-link" href="/services/">View all services <span aria-hidden="true">&rarr;</span></a>
            <a class="text-link" href="/solutions/">Packaged solutions <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
      </div>`;
}

function renderNav(ctx, path) {
  return each(ctx.config.nav, (item, i) => {
    const active = isActive(item.href, path) ? ' active' : '';
    const current = path === item.href ? ' aria-current="page"' : '';

    if (item.mega) {
      return `<li class="nav-item has-panel has-mega">
        <button class="nav-link nav-trigger${active}" aria-expanded="false" aria-controls="mega-services" data-href="${esc(item.href)}">${esc(item.label)}${CHEVRON}</button>
        ${renderMegaServices(ctx)}
      </li>`;
    }

    if (item.children) {
      const panelId = `dropdown-${i}`;
      return `<li class="nav-item has-panel has-dropdown">
        <button class="nav-link nav-trigger${active}" aria-expanded="false" aria-controls="${panelId}" data-href="${esc(item.href)}">${esc(item.label)}${CHEVRON}</button>
        <div class="dropdown-panel" id="${panelId}" hidden>
          ${each(item.children, (c) => `<a class="dropdown-link" href="${esc(c.href)}">
            <span class="dropdown-link-title">${esc(c.label)}</span>
            <span class="dropdown-link-desc">${esc(c.desc)}</span>
          </a>`)}
        </div>
      </li>`;
    }

    return `<li class="nav-item"><a class="nav-link${active}" href="${esc(item.href)}"${current}>${esc(item.label)}</a></li>`;
  });
}

function renderHeader(ctx, path) {
  const c = ctx.config.company;
  return `
  <header class="site-header" id="siteHeader">
    <div class="container nav-wrap">
      <a href="/" class="brand" aria-label="${esc(c.name)} — Home">${BRAND_MARK('Nav')}${BRAND_TEXT}
      </a>

      <nav class="main-nav" id="mainNav" aria-label="Primary">
        <ul class="nav-list">
${renderNav(ctx, path)}
        </ul>
        <a href="/contact/" class="btn btn-primary btn-nav">Get a Consultation</a>
      </nav>

      <button class="nav-toggle" id="navToggle" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mainNav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

function renderFooter(ctx) {
  const c = ctx.config.company;
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="brand" aria-label="${esc(c.name)} — Home">${BRAND_MARK('Foot')}${BRAND_TEXT}
          </a>
          <p class="footer-blurb">${esc(c.tagline)} Headquartered in ${esc(c.city)}, delivering across ${esc(c.country)} and worldwide.</p>
          <div class="footer-contact">
            <a href="${esc(c.phoneHref)}">${icon('phone')}<span>${esc(c.phoneDisplay)}</span></a>
            <a href="mailto:${esc(c.email)}">${icon('mail')}<span>${esc(c.email)}</span></a>
            <span class="footer-contact-static">${icon('pin')}<span>${esc(c.addressLine)}</span></span>
          </div>
        </div>
        ${each(ctx.config.footerColumns, (col) => `<div class="footer-col">
          <h4>${esc(col.heading)}</h4>
          ${each(col.links, (l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)}
        </div>`)}
      </div>
      <div class="footer-bottom">
        <p>&copy; <span id="year">${ctx.config.company.established}</span> ${esc(c.name)}. All rights reserved.</p>
        <p class="footer-legal">${ctx.config.legalLinks
          .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
          .join(' <span aria-hidden="true">&middot;</span> ')}</p>
      </div>
    </div>
  </footer>`;
}

function renderCookieBanner(ctx) {
  return `
  <div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="Cookie preferences" aria-live="polite" hidden>
    <div class="cookie-inner">
      <p>
        We use strictly necessary cookies to run this site, and optional analytics cookies to understand
        how it is used. We do not use advertising or cross-site tracking cookies.
        <a href="/cookie-policy/">Read our Cookie Policy</a>.
      </p>
      <div class="cookie-actions">
        <button type="button" class="btn btn-outline btn-sm" data-cookie-choice="necessary">Necessary only</button>
        <button type="button" class="btn btn-primary btn-sm" data-cookie-choice="all">Accept analytics</button>
      </div>
    </div>
  </div>`;
}

/** Organisation-level JSON-LD, emitted on every page. */
function organisationJsonLd(ctx) {
  const c = ctx.config.company;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: c.name,
    alternateName: c.shortName,
    url: c.domain + '/',
    logo: c.domain + '/assets/logo-512.png',
    image: c.domain + '/assets/og-image.png',
    email: c.email,
    telephone: c.phoneDisplay,
    description:
      'IT and information security firm providing vCISO, DPO as a Service, internal audit, VAPT, ISO 27001 support, managed IT and cloud security.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: c.city,
      addressRegion: c.region,
      addressCountry: 'IN',
    },
    founder: { '@type': 'Person', name: c.founder, jobTitle: c.founderRole },
    areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
    knowsAbout: [
      'Information security',
      'ISO/IEC 27001',
      'Penetration testing',
      'Data protection',
      'Internal audit',
      'Managed IT services',
    ],
  };
}

/**
 * Render a complete page.
 *
 * @param {object} ctx    Build context: { config, services, content }
 * @param {object} page   { title, description, path, content, bodyClass?, jsonLd?, ogType?, noindex? }
 */
function layout(ctx, page) {
  const c = ctx.config.company;
  const canonical = c.domain + page.path;
  // Interior pages take the short brand suffix so the whole title survives the
  // ~60-character SERP cut; the home page carries the full legal name.
  const title = page.title.includes(c.shortName) ? page.title : `${page.title} | ${c.shortName}`;
  const jsonLdBlocks = [organisationJsonLd(ctx)].concat(page.jsonLd || []);
  const ogImage = `${c.domain}/assets/og-image.png`;

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${esc(canonical)}">
  ${
    page.noindex
      ? '<meta name="robots" content="noindex, follow">'
      : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'
  }

  <meta property="og:type" content="${esc(page.ogType || 'website')}">
  <meta property="og:site_name" content="${esc(c.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.name)} — IT &amp; Cybersecurity Services, Mumbai">
  <meta property="og:locale" content="en_IN">
${
  page.article
    ? `  <meta property="article:published_time" content="${esc(page.article.published)}">
  <meta property="article:modified_time" content="${esc(page.article.modified)}">
  <meta property="article:section" content="${esc(page.article.section)}">`
    : ''
}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <meta name="theme-color" content="#12100e">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="manifest" href="/site.webmanifest">

  <link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/styles.css">

${jsonLdBlocks
  .map((block) => `  <script type="application/ld+json">${escJson(block)}</script>`)
  .join('\n')}
</head>
<body${page.bodyClass ? ` class="${esc(page.bodyClass)}"` : ''}>
  <a href="#main" class="skip-link">Skip to main content</a>
${renderHeader(ctx, page.path)}

  <main id="main">
${page.content}
  </main>
${renderFooter(ctx)}
${renderCookieBanner(ctx)}

  <script src="/js/main.js" defer></script>
</body>
</html>
`;
}

module.exports = { layout, isActive };
