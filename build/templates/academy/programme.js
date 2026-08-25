'use strict';

const { esc, each, list } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/** Cards linking to sibling programmes, mirroring relatedServices for this site. */
function relatedProgrammes(ctx, slugs) {
  const items = (slugs || []).filter((slug) => ctx.programmes[slug]);
  if (!items.length) return '';
  return `
    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Related', title: 'Often Run Alongside This' })}
        <div class="services-grid">
          ${each(items, (slug, i) => {
            const entry = ctx.config.programmes.find((p) => p.slug === slug);
            const data = ctx.programmes[slug];
            return `<article class="service-card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a class="service-card-link" href="/programmes/${esc(slug)}/">
              <span class="service-icon">${icon(entry.icon)}</span>
              <h3>${esc(data.name)}</h3>
              <p>${esc(data.cardSummary)}</p>
              <span class="text-link">Programme detail <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`;
          })}
        </div>
      </div>
    </section>`;
}

/**
 * Render one programme page from build/data/academy/programmes/<slug>.json.
 *
 * @param {object} ctx   build context
 * @param {object} entry registry entry from config.programmes
 */
module.exports = function programmePage(ctx, entry) {
  const d = ctx.programmes[entry.slug];
  const company = ctx.config.company;
  const path = `/programmes/${entry.slug}/`;

  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Programmes', href: '/programmes/' },
    { label: d.shortName, href: path },
  ];

  const content = `
${C.pageHero({
  trail,
  eyebrow: d.category,
  title: d.heroHeadline,
  sub: d.heroSub,
  actions:
    C.btn('/contact/', 'Enquire About This Programme', 'btn-primary') +
    C.btn('/for-organisations/', 'How Delivery Works', 'btn-outline'),
  highlights: d.highlights,
})}

    <section class="section-sm">
      <div class="container">
        <div class="chip-row">
          <span class="chip">Format: ${esc(d.format)}</span>
          <span class="chip">Duration: ${esc(d.duration)}</span>
          <span class="chip">Audience: ${esc(d.level)}</span>
        </div>
      </div>
    </section>

    <section class="section section-tight-top">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <span class="service-icon service-icon-lg">${icon(entry.icon)}</span>
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
            <a href="/contact/" class="text-link">Talk to us about ${esc(d.shortName)} <span aria-hidden="true">&rarr;</span></a>
          </div>
          <aside class="split-aside">
            ${C.checklistPanel(d.outcomes.heading, d.outcomes.intro, d.outcomes.items)}
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Content', title: d.modules.heading })}
        ${C.capabilityGrid(d.modules.items)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'How It Runs',
          title: 'From Scoping to Delivery',
          sub: `How a ${d.shortName} engagement runs, start to finish.`,
        })}
        ${C.processSteps(d.delivery)}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="split-grid split-grid-even">
          <div>
            ${C.sectionHead({ eyebrow: 'Benefits', title: 'What Changes Afterwards', align: 'left' })}
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
            <a href="/contact/" class="btn btn-primary btn-block">Check if this fits your team</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        ${C.sectionHead({ eyebrow: 'FAQ', title: `${esc(d.shortName)} — Common Questions` })}
        ${C.faqList(d.faqs, 'prog')}
      </div>
    </section>

${relatedProgrammes(ctx, d.related)}

${C.ctaBanner({
  title: `Ready to Schedule ${d.shortName}?`,
  text: 'Tell us the audience, the timescale and what prompted the question. We will come back with a scoped cohort or an honest reason not to run one.',
  actions:
    C.btn('/contact/', 'Enquire Now', 'btn-light') +
    C.btn(`mailto:${company.email}`, company.email, 'btn-outline'),
})}`;

  return {
    path,
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: d.name,
        description: d.metaDescription,
        url: company.domain + path,
        provider: { '@type': 'Organization', name: company.name, url: company.domain + '/' },
        educationalLevel: d.level,
        teaches: d.modules.items.map((m) => m.title),
        hasCourseInstance: [
          {
            '@type': 'CourseInstance',
            courseMode: ['onsite', 'online'],
            courseWorkload: d.duration,
            location: { '@type': 'Place', address: company.addressLine },
          },
        ],
      },
      C.faqJsonLd(d.faqs),
    ],
  };
};
