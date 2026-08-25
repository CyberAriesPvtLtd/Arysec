'use strict';

const { esc, each } = require('../../lib/html');
const C = require('../components');

module.exports = function servicesHubPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services/' },
  ];

  const groups = ctx.config.serviceCategories.map((cat) => {
    const items = ctx.config.services.filter((s) => s.category === cat.name);
    return `
      <section class="section${cat.id === 'audit' || cat.id === 'it' ? ' section-alt' : ''}" id="${esc(cat.id)}">
        <div class="container">
          ${C.sectionHead({ eyebrow: cat.name, title: cat.blurb })}
          <div class="services-grid">
            ${each(items, (svc, i) => C.serviceCard(svc, ctx.services[svc.slug], i))}
          </div>
        </div>
      </section>`;
  });

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Services',
  title: 'Comprehensive IT &',
  titleAccent: 'Security Services',
  sub: `Fifteen services across governance, audit, security operations, and everyday IT — delivered by certified practitioners from our ${company.city} headquarters to clients across India and worldwide.`,
  actions: C.btn('/contact/', 'Request a Consultation', 'btn-primary') + C.btn('/solutions/', 'See Packaged Solutions', 'btn-outline'),
})}

    <section class="section-sm">
      <div class="container">
        <nav class="jump-nav reveal" aria-label="Service categories">
          ${each(
            ctx.config.serviceCategories,
            (cat) => `<a class="jump-link" href="#${esc(cat.id)}">${esc(cat.name)}</a>`
          )}
        </nav>
      </div>
    </section>

${C.join(groups)}

${C.ctaBanner({
  title: 'Not Sure Where to Start?',
  text: 'A short discovery call is usually enough for us to tell you which of these matter most for your business right now.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/services/',
    title: 'IT & Cybersecurity Services',
    description:
      'All 15 Arysec services: vCISO, DPO as a Service, internal audit, VAPT, ISO 27001, cloud and network security, incident response, managed IT and development.',
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Arysec Consultancy LLP services',
        itemListElement: ctx.config.services.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: ctx.services[s.slug].name,
          url: company.domain + '/services/' + s.slug + '/',
        })),
      },
    ],
  };
};
