'use strict';

const { esc, each } = require('../../lib/html');
const C = require('../components');

module.exports = function notFoundPage(ctx) {
  const company = ctx.config.company;

  const suggestions = [
    { label: 'All Services', href: '/services/', desc: 'Our full catalogue of 15 IT and security services' },
    { label: 'Solutions', href: '/solutions/', desc: 'vCISO, DPO and internal audit delivered as a service' },
    { label: 'Insights', href: '/insights/', desc: 'Articles on standards, threats and security decisions' },
    { label: 'Contact', href: '/contact/', desc: 'Talk to our team about your environment' },
  ];

  const content = `
    <section class="page-hero error-hero">
      <div class="container">
        <p class="error-code" aria-hidden="true">404</p>
        <h1>This Page Could Not Be <span class="text-gradient">Found</span></h1>
        <p class="page-hero-sub">
          The address you followed does not exist, or the page has moved. Nothing is broken on your side.
        </p>
        <div class="hero-actions">
          ${C.btn('/', 'Back to Home', 'btn-primary')}
          ${C.btn('/contact/', 'Contact Us', 'btn-outline')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({ title: 'Try One of These Instead' })}
        <div class="grid-4">
          ${each(
            suggestions,
            (s, i) => `<a class="card card-link ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}" href="${esc(s.href)}">
            <h2>${esc(s.label)}</h2>
            <p>${esc(s.desc)}</p>
          </a>`
          )}
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Looking for Something Specific?',
  text: 'Tell us what you were trying to find and we will point you to it.',
  actions: C.btn('/contact/', 'Get in Touch', 'btn-light') + C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/404.html',
    title: 'Page Not Found',
    description: 'The page you requested could not be found on the Arysec Technologies LLP website.',
    content,
    noindex: true,
  };
};
