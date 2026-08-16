'use strict';

const { esc, each, list } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

module.exports = function industriesPage(ctx) {
  const company = ctx.config.company;
  const d = ctx.content.industries;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Industries', href: '/industries/' },
  ];

  const blocks = d.industries.map(
    (ind, i) => `
        <article class="industry-block${i % 2 === 1 ? ' reverse' : ''}" id="${esc(ind.slug)}">
          <div class="reveal">
            <h2>${esc(ind.name)}</h2>
            <p class="industry-summary">${esc(ind.summary)}</p>
            <h3 class="industry-subhead">What we see in this sector</h3>
            ${list(ind.challenges, 'service-list')}
            <div class="chip-row">
              ${each(ind.regulations, (r) => `<span class="chip">${esc(r)}</span>`)}
            </div>
          </div>
          <div class="feature-visual reveal delay-1">
            <h3>How we help</h3>
            <div class="benefit-stack">
              ${each(
                ind.howWeHelp,
                (h) => `<div class="benefit-item">
                <span class="benefit-marker" aria-hidden="true">${icon('check-square')}</span>
                <div><h4>${esc(h.title)}</h4><p>${esc(h.description)}</p></div>
              </div>`
              )}
            </div>
          </div>
        </article>`
  );

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Industries',
  title: d.heroHeadline,
  sub: d.heroSub,
  actions: C.btn('/contact/', 'Discuss Your Sector', 'btn-primary') + C.btn('/services/', 'Browse Services', 'btn-outline'),
})}

    <section class="section-sm">
      <div class="container">
        <nav class="jump-nav reveal" aria-label="Industries">
          ${each(d.industries, (ind) => `<a class="jump-link" href="#${esc(ind.slug)}">${esc(ind.name)}</a>`)}
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
${C.join(blocks)}
      </div>
    </section>

${C.ctaBanner({
  title: 'Every Sector Has Its Own Threat Model',
  text: 'Tell us what you do and who regulates you. We will bring the sector context to the first conversation.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/industries/',
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail)],
  };
};
