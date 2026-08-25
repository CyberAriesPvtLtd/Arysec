'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/** Certification and assessment page. */
module.exports = function certificationPage(ctx) {
  const company = ctx.config.company;
  const d = ctx.content.certification;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Certification', href: '/certification/' },
  ];

  const tracks = ctx.config.programmes.filter((p) => p.category === 'Certification Tracks');

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Certification',
  title: d.heroHeadline,
  sub: d.heroSub,
  actions:
    C.btn('/programmes/#certification', 'Certification Tracks', 'btn-primary') +
    C.btn('/contact/', 'Ask About Assessment', 'btn-outline'),
  highlights: d.highlights,
})}

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
          </div>
          <aside class="split-aside">
            ${C.checklistPanel(d.included.heading, d.included.intro, d.included.items)}
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'The Process',
          title: 'From Course to Certificate',
          sub: 'Four steps, with published timings so nobody is waiting on an unknown.',
        })}
        ${C.processSteps(d.process)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Tracks',
          title: 'Programmes That End in an Assessment',
          sub: 'Workforce awareness and leadership sessions produce attendance records. These three are assessed.',
        })}
        <div class="services-grid">
          ${each(tracks, (p, i) => {
            const data = ctx.programmes[p.slug];
            return `<article class="service-card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a class="service-card-link" href="/programmes/${esc(p.slug)}/">
              <span class="service-icon">${icon(p.icon)}</span>
              <h3>${esc(data.name)}</h3>
              <p>${esc(data.cardSummary)}</p>
              <span class="chip-row"><span class="chip">${esc(data.duration)}</span></span>
            </a>
          </article>`;
          })}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container-narrow">
        <div class="takeaways reveal">
          <h2>${esc(d.honesty.heading)}</h2>
          ${d.honesty.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        ${C.sectionHead({ eyebrow: 'FAQ', title: 'Certification — Common Questions' })}
        ${C.faqList(d.faqs, 'cert')}
      </div>
    </section>

${C.ctaBanner({
  title: 'Need Assessed Evidence of Competence?',
  text: 'Tell us who needs certifying and what the driver is — an audit, a customer questionnaire, or a genuine skills gap. The answer is different for each.',
  actions:
    C.btn('/contact/', 'Talk to the Academy', 'btn-light') +
    C.btn('/programmes/', 'Browse Programmes', 'btn-outline'),
})}`;

  return {
    path: '/certification/',
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail), C.faqJsonLd(d.faqs)],
  };
};
