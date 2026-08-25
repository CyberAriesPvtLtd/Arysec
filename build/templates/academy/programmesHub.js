'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/** Programme index, grouped by track. */
module.exports = function programmesHub(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Programmes', href: '/programmes/' },
  ];

  const groups = ctx.config.programmeCategories.map((cat, gi) => {
    const items = ctx.config.programmes.filter((p) => p.category === cat.name);
    return `
    <section class="section${gi % 2 ? ' section-alt' : ''}" id="${esc(cat.id)}">
      <div class="container">
        ${C.sectionHead({ eyebrow: cat.name, title: cat.blurb, align: 'left' })}
        <div class="services-grid">
          ${each(items, (p, i) => {
            const d = ctx.programmes[p.slug];
            return `<article class="service-card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i % 3, 3)}`}">
            <a class="service-card-link" href="/programmes/${esc(p.slug)}/">
              <span class="service-icon">${icon(p.icon)}</span>
              <h3>${esc(d.name)}</h3>
              <p>${esc(d.cardSummary)}</p>
              <span class="chip-row">
                <span class="chip">${esc(d.duration)}</span>
                <span class="chip">${esc(d.level)}</span>
              </span>
            </a>
          </article>`;
          })}
        </div>
      </div>
    </section>`;
  });

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Programmes',
  title: 'Cybersecurity Training,',
  titleAccent: 'By Audience',
  sub: 'Nine programmes across four tracks. Each one is taught by practitioners, tailored to your environment, and measured against something other than attendance.',
  actions: C.btn('/contact/', 'Discuss a Programme', 'btn-primary') + C.btn('/certification/', 'How Certification Works', 'btn-outline'),
})}

    <section class="section-sm">
      <div class="container">
        <nav class="jump-nav reveal" aria-label="Programme tracks">
          ${each(
            ctx.config.programmeCategories,
            (cat) => `<a class="jump-link" href="#${esc(cat.id)}">${esc(cat.name)}</a>`
          )}
        </nav>
      </div>
    </section>
${groups.join('\n')}

${C.ctaBanner({
  title: 'Not Sure Which Track You Need?',
  text: 'Describe the team and what prompted the question. We will recommend the smallest programme that addresses it — or tell you if training is not the answer.',
  actions:
    C.btn('/contact/', 'Ask Us', 'btn-light') +
    C.btn('/for-organisations/', 'How Delivery Works', 'btn-outline'),
})}`;

  return {
    path: '/programmes/',
    title: 'Cybersecurity Training Programmes',
    description:
      'Every Arysec Academy programme: security awareness, phishing drills, ISO 27001 implementer ' +
      'and auditor, DPDP privacy, secure coding, cloud security and incident response.',
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Arysec Academy programmes',
        itemListElement: ctx.config.programmes.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: ctx.programmes[p.slug].name,
          url: `${company.domain}/programmes/${p.slug}/`,
        })),
      },
    ],
  };
};
