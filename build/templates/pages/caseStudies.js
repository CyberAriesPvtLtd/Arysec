'use strict';

const { esc, each, list } = require('../../lib/html');
const C = require('../components');

module.exports = function caseStudiesPage(ctx) {
  const company = ctx.config.company;
  const d = ctx.content['case-studies'];
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Case Studies', href: '/case-studies/' },
  ];

  const blocks = d.caseStudies.map(
    (cs, i) => `
        <article class="case-block reveal" id="${esc(cs.slug)}">
          <div class="case-block-head">
            <span class="case-sector">${esc(cs.sector)}</span>
            <h2>${esc(cs.title)}</h2>
            <p class="case-profile">${esc(cs.profile)}</p>
          </div>
          <div class="case-block-body">
            <div class="case-col">
              <h3>The challenge</h3>
              <p>${esc(cs.challenge)}</p>
            </div>
            <div class="case-col">
              <h3>Our approach</h3>
              ${list(cs.approach, 'service-list')}
            </div>
            <div class="case-col">
              <h3>The outcome</h3>
              <p>${esc(cs.outcome)}</p>
            </div>
          </div>
          <div class="case-block-foot">
            <span class="case-services-label">Services involved:</span>
            ${each(
              cs.services,
              (slug) => {
                const svcData = ctx.services[slug];
                return svcData
                  ? `<a class="chip chip-link" href="/services/${esc(slug)}/">${esc(svcData.name)}</a>`
                  : '';
              },
              ' '
            )}
          </div>
        </article>`
  );

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Case Studies',
  title: d.heroHeadline,
  sub: d.heroSub,
  actions: C.btn('/contact/', 'Discuss Your Situation', 'btn-primary'),
})}

    <section class="section">
      <div class="container">
        <p class="disclaimer-note reveal">${esc(d.disclaimer)}</p>
${C.join(blocks)}
      </div>
    </section>

${C.ctaBanner({
  title: 'Your Situation Is Probably Not Unique',
  text: 'Whatever you are facing, we have almost certainly worked through something close to it. Tell us about it.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn('/services/', 'Browse Services', 'btn-outline'),
})}`;

  return {
    path: '/case-studies/',
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail)],
  };
};
