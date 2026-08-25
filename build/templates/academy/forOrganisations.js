'use strict';

const { esc } = require('../../lib/html');
const C = require('../components');

/** Corporate delivery, tailoring, reporting and commercial detail. */
module.exports = function forOrganisationsPage(ctx) {
  const company = ctx.config.company;
  const d = ctx.content['for-organisations'];
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'For Organisations', href: '/for-organisations/' },
  ];

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'For Organisations',
  title: d.heroHeadline,
  sub: d.heroSub,
  actions:
    C.btn('/contact/', 'Scope a Programme', 'btn-primary') +
    C.btn('/programmes/', 'Browse Programmes', 'btn-outline'),
  highlights: d.highlights,
})}

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
            <a href="/certification/" class="text-link">How certification and assessment work <span aria-hidden="true">&rarr;</span></a>
          </div>
          <aside class="split-aside">
            ${C.checklistPanel(d.tailoring.heading, d.tailoring.intro, d.tailoring.items)}
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Formats',
          title: d.formats.heading,
          sub: 'Most annual programmes mix two or three of these rather than committing to one.',
        })}
        ${C.capabilityGrid(d.formats.items)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Reporting',
          title: d.reporting.heading,
          sub: 'Everything below is produced as a matter of course, not quoted as an add-on.',
        })}
        ${C.capabilityGrid(d.reporting.items)}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="split-grid split-grid-even">
          <div class="reveal">
            ${C.sectionHead({ eyebrow: 'Commercials', title: d.commercials.heading, align: 'left' })}
            <p>${esc(d.commercials.intro)}</p>
            <div class="feature-actions">
              ${C.btn('/contact/', 'Request a Quote', 'btn-primary')}
            </div>
          </div>
          <div class="who-panel reveal delay-1">
            <h3>How Engagements Are Bought</h3>
            <ul class="service-list">
              ${d.commercials.items.map((i) => `<li>${esc(i)}</li>`).join('\n              ')}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        ${C.sectionHead({ eyebrow: 'FAQ', title: 'Corporate Delivery — Common Questions' })}
        ${C.faqList(d.faqs, 'org')}
      </div>
    </section>

${C.ctaBanner({
  title: 'Start With One Cohort',
  text: 'Most annual programmes begin as a single session that proved useful. Tell us who needs training and we will scope the smallest thing worth doing.',
  actions:
    C.btn('/contact/', 'Talk to the Academy', 'btn-light') +
    C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/for-organisations/',
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail), C.faqJsonLd(d.faqs)],
  };
};
