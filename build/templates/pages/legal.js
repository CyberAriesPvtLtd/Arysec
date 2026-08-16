'use strict';

const { esc } = require('../../lib/html');
const C = require('../components');

/**
 * Generic long-form document page — privacy policy, terms, cookie policy,
 * responsible disclosure. Renders a table of contents plus numbered sections.
 *
 * @param {object} ctx
 * @param {string} key   content file key, e.g. 'privacy-policy'
 * @param {string} updated  ISO date string stamped into the page
 */
module.exports = function legalPage(ctx, key, updated) {
  const company = ctx.config.company;
  const d = ctx.content[key];
  const path = `/${key}/`;
  const trail = [
    { label: 'Home', href: '/' },
    { label: d.title, href: path },
  ];

  const content = `
    <section class="page-hero page-hero-doc">
      <div class="container-narrow">
        ${C.breadcrumbs(trail)}
        <h1>${esc(d.title)}</h1>
        <p class="page-hero-sub">${esc(d.intro)}</p>
        <p class="doc-updated">Last updated: <time datetime="${esc(updated)}">${esc(
    new Date(updated + 'T00:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  )}</time></p>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        ${C.docToc(d.sections)}
        ${C.documentSections(d.sections)}
        <div class="article-foot reveal">
          <p>
            Questions about this document? Contact us at
            <a href="mailto:${esc(company.email)}">${esc(company.email)}</a> or
            <a href="${esc(company.phoneHref)}">${esc(company.phoneDisplay)}</a>.
          </p>
        </div>
      </div>
    </section>`;

  return {
    path,
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail)],
  };
};
