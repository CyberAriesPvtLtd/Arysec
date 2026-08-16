'use strict';

const { esc, each, list } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/**
 * Render one service detail page from build/data/services/<slug>.json.
 *
 * @param {object} ctx   build context
 * @param {object} svc   registry entry from config.services
 * @returns {{path, title, description, content, jsonLd, ogType}}
 */
module.exports = function servicePage(ctx, svc) {
  const d = ctx.services[svc.slug];
  const company = ctx.config.company;
  const path = `/services/${svc.slug}/`;

  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services/' },
    { label: d.shortName, href: path },
  ];

  const content = `
${C.pageHero({
  trail,
  eyebrow: d.category,
  title: d.heroHeadline,
  sub: d.heroSub,
  actions:
    C.btn('/contact/', 'Request a Consultation', 'btn-primary') +
    C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
  highlights: d.highlights,
})}

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <span class="service-icon service-icon-lg">${icon(svc.icon)}</span>
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
            <a href="/contact/" class="text-link">Talk to our team about ${esc(d.shortName)} <span aria-hidden="true">&rarr;</span></a>
          </div>
          <aside class="split-aside">
            ${C.checklistPanel(d.deliverables.heading, d.deliverables.intro, d.deliverables.items)}
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Capabilities', title: d.capabilities.heading })}
        ${C.capabilityGrid(d.capabilities.items)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'How It Works',
          title: 'Our Engagement Process',
          sub: `How a ${d.shortName} engagement runs from first conversation to steady state.`,
        })}
        ${C.processSteps(d.process)}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="split-grid split-grid-even">
          <div>
            ${C.sectionHead({ eyebrow: 'Benefits', title: 'What You Get Out of It', align: 'left' })}
            <div class="benefit-stack">${each(
              d.benefits,
              (b, i) => `<div class="benefit-item ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}">
                <span class="benefit-marker" aria-hidden="true">${icon('check-square')}</span>
                <div><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>
              </div>`
            )}</div>
          </div>
          <div class="who-panel reveal delay-1">
            <h3>Who This Is For</h3>
            ${list(d.whoItsFor, 'service-list')}
            <a href="/contact/" class="btn btn-primary btn-block">Check if this fits your business</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        ${C.sectionHead({ eyebrow: 'FAQ', title: `${d.shortName} — Common Questions` })}
        ${C.faqList(d.faqs, 'svc')}
      </div>
    </section>

${C.relatedServices(ctx, d.related)}

${C.ctaBanner({
  title: `Ready to Discuss ${d.shortName}?`,
  text: 'Tell us where you are today. We will tell you honestly what the engagement would involve.',
  actions:
    C.btn('/contact/', 'Book a Free Consultation', 'btn-light') +
    C.btn(`mailto:${company.email}`, company.email, 'btn-outline'),
})}`;

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: d.name,
    serviceType: d.category,
    description: d.metaDescription,
    url: company.domain + path,
    provider: { '@type': 'Organization', name: company.name, url: company.domain + '/' },
    areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
  };

  return {
    path,
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    ogType: 'website',
    jsonLd: [
      serviceJsonLd,
      C.breadcrumbJsonLd(company.domain, trail),
      C.faqJsonLd(d.faqs),
    ],
  };
};
