'use strict';

const { esc, each, join, list, paragraphs, reveal } = require('../lib/html');
const { icon } = require('../lib/icons');

/** Breadcrumb trail. `trail` is [{label, href}], last item rendered as plain text. */
function breadcrumbs(trail) {
  if (!trail || !trail.length) return '';
  const items = trail.map((t, i) => {
    const isLast = i === trail.length - 1;
    return isLast
      ? `<span aria-current="page">${esc(t.label)}</span>`
      : `<a href="${esc(t.href)}">${esc(t.label)}</a>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.join(
    ' <span class="breadcrumb-sep" aria-hidden="true">/</span> '
  )}</nav>`;
}

/** JSON-LD for a breadcrumb trail. */
function breadcrumbJsonLd(domain, trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.label,
      item: domain + t.href,
    })),
  };
}

/** Interior-page hero banner. */
function pageHero(opts) {
  const accent = opts.titleAccent
    ? ` <span class="text-gradient">${esc(opts.titleAccent)}</span>`
    : '';
  return `
    <section class="page-hero">
      <div class="container">
        ${opts.trail ? breadcrumbs(opts.trail) : ''}
        ${opts.eyebrow ? `<p class="hero-eyebrow">${esc(opts.eyebrow)}</p>` : ''}
        <h1>${esc(opts.title)}${accent}</h1>
        ${opts.sub ? `<p class="page-hero-sub">${esc(opts.sub)}</p>` : ''}
        ${opts.actions ? `<div class="hero-actions">${opts.actions}</div>` : ''}
        ${opts.highlights ? highlightRow(opts.highlights) : ''}
      </div>
    </section>`;
}

/** Three small value/label pills used under service hero banners. */
function highlightRow(items) {
  return `<div class="highlight-row">${each(
    items,
    (h) => `<div class="highlight">
      <span class="highlight-value">${esc(h.value)}</span>
      <span class="highlight-label">${esc(h.label)}</span>
    </div>`
  )}</div>`;
}

/** Centred (or left-aligned) section heading block. */
function sectionHead(opts) {
  return `<div class="section-head${opts.align === 'left' ? ' left' : ''} reveal">
      ${opts.eyebrow ? `<p class="section-eyebrow">${esc(opts.eyebrow)}</p>` : ''}
      <h2>${esc(opts.title)}</h2>
      ${opts.sub ? `<p class="section-sub">${esc(opts.sub)}</p>` : ''}
    </div>`;
}

/** Primary call-to-action band. */
function ctaBanner(opts) {
  return `
    <section class="cta-banner">
      <div class="container reveal">
        <h2>${esc(opts.title)}</h2>
        ${opts.text ? `<p>${esc(opts.text)}</p>` : ''}
        <div class="cta-actions">${opts.actions}</div>
      </div>
    </section>`;
}

function btn(href, label, variant) {
  return `<a href="${esc(href)}" class="btn ${variant || 'btn-primary'}">${esc(label)}</a>`;
}

/** Accessible accordion FAQ list. Also returns matching FAQPage JSON-LD via faqJsonLd(). */
function faqList(faqs, idPrefix) {
  const prefix = idPrefix || 'faq';
  return `<div class="faq-list">${each(
    faqs,
    (f, i) => `<div class="faq-item reveal">
      <h3 class="faq-heading">
        <button class="faq-question" id="${prefix}-q-${i}" aria-expanded="false" aria-controls="${prefix}-a-${i}">
          <span>${esc(f.question)}</span>
          <span class="faq-icon" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="faq-answer" id="${prefix}-a-${i}" role="region" aria-labelledby="${prefix}-q-${i}">
        <p>${esc(f.answer)}</p>
      </div>
    </div>`
  )}</div>`;
}

function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** Card linking to a service page. */
function serviceCard(svc, data, index) {
  return `<article class="service-card ${reveal(index, 3)}">
      <a class="service-card-link" href="/services/${esc(svc.slug)}/">
        <span class="service-icon">${icon(svc.icon)}</span>
        <h3>${esc(data.name)}</h3>
        <p>${esc(data.cardSummary)}</p>
        <span class="text-link">Learn more <span aria-hidden="true">&rarr;</span></span>
      </a>
    </article>`;
}

/** Numbered process steps. */
function processSteps(steps) {
  return `<div class="process-grid">${each(
    steps,
    (s, i) => `<div class="process-step ${reveal(i, 4)}">
      <div class="process-num">${String(i + 1).padStart(2, '0')}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.description)}</p>
    </div>`
  )}</div>`;
}

/** Grid of icon-less titled cards. */
function benefitGrid(items, columns) {
  const cols = columns || 4;
  return `<div class="grid-${cols}">${each(
    items,
    (b, i) => `<div class="card ${reveal(i, cols)}">
      <h3>${esc(b.title)}</h3>
      <p>${esc(b.description)}</p>
    </div>`
  )}</div>`;
}

/** Two-column "capability" cards with a tick marker. */
function capabilityGrid(items) {
  return `<div class="capability-grid">${each(
    items,
    (item, i) => `<div class="capability ${reveal(i, 3)}">
      <span class="capability-marker" aria-hidden="true">${icon('check-square')}</span>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
      </div>
    </div>`
  )}</div>`;
}

/** Checked list panel — used for deliverables. */
function checklistPanel(heading, intro, items) {
  return `<div class="checklist-panel reveal">
      ${heading ? `<h3>${esc(heading)}</h3>` : ''}
      ${intro ? `<p class="checklist-intro">${esc(intro)}</p>` : ''}
      ${list(items, 'service-list')}
    </div>`;
}

/**
 * Contact strip: phone / email / office.
 * Headings are h2 because this block sits directly under the page h1 on the
 * contact page — an h3 there would skip a heading level.
 */
function contactStrip(company) {
  return `<div class="contact-strip">
      <div class="contact-strip-item reveal">
        <span class="contact-icon">${icon('phone')}</span>
        <h2>Call Us</h2>
        <a href="${esc(company.phoneHref)}">${esc(company.phoneDisplay)}</a>
      </div>
      <div class="contact-strip-item reveal delay-1">
        <span class="contact-icon">${icon('mail')}</span>
        <h2>Email Us</h2>
        <a href="mailto:${esc(company.email)}">${esc(company.email)}</a>
      </div>
      <div class="contact-strip-item reveal delay-2">
        <span class="contact-icon">${icon('pin')}</span>
        <h2>Headquarters</h2>
        <p>${esc(company.city)}, ${esc(company.region)}</p>
      </div>
    </div>`;
}

/** "Related services" row shown at the foot of each service page. */
function relatedServices(ctx, slugs) {
  const cards = slugs
    .map((slug) => {
      const svc = ctx.config.services.find((s) => s.slug === slug);
      if (!svc) return null;
      return { svc, data: ctx.services[slug] };
    })
    .filter(Boolean);

  if (!cards.length) return '';

  return `
    <section class="section section-alt">
      <div class="container">
        ${sectionHead({ eyebrow: 'Related', title: 'Services That Work Alongside This One' })}
        <div class="services-grid">${each(cards, (c, i) => serviceCard(c.svc, c.data, i))}</div>
      </div>
    </section>`;
}

/** Long-form document body: [{heading, paragraphs, list?}]. */
function documentSections(sections) {
  return `<div class="doc-body">${each(
    sections,
    (s, i) => `<section class="doc-section reveal" id="section-${i + 1}">
      <h2>${esc(s.heading)}</h2>
      ${paragraphs(s.paragraphs)}
      ${s.list && s.list.length ? list(s.list, 'doc-list') : ''}
    </section>`
  )}</div>`;
}

/** In-page table of contents for long documents. */
function docToc(sections) {
  return `<nav class="doc-toc reveal" aria-label="On this page">
      <h2 class="doc-toc-title">On this page</h2>
      <ol>${each(
        sections,
        (s, i) => `<li><a href="#section-${i + 1}">${esc(s.heading)}</a></li>`,
        ''
      )}</ol>
    </nav>`;
}

module.exports = {
  breadcrumbs,
  breadcrumbJsonLd,
  pageHero,
  highlightRow,
  sectionHead,
  ctaBanner,
  btn,
  faqList,
  faqJsonLd,
  serviceCard,
  processSteps,
  benefitGrid,
  capabilityGrid,
  checklistPanel,
  contactStrip,
  relatedServices,
  documentSections,
  docToc,
  join,
  each,
};
