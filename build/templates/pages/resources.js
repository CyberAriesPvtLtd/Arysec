'use strict';

const { esc, each } = require('../../lib/html');
const C = require('../components');
const co = require('../../data/company');
const { antiSpamFields } = require('./contact');

module.exports = function resourcesPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Resources', href: '/resources/' },
  ];

  const resourceOptions = co.resources
    .map((r) => `<option value="${esc(r.title)}">${esc(r.title)}</option>`)
    .join('\n                ');

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Resources',
  title: 'Insights &',
  titleAccent: 'Knowledge',
  sub: 'Practical guidance from our consultants and auditors to help you make informed technology, security, and compliance decisions.',
  actions: C.btn('#request', 'Request a Resource', 'btn-primary') + C.btn('/insights/', 'Read Our Articles', 'btn-outline'),
})}

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Guides & Downloads',
          title: 'Written by Our Practitioners',
          sub: 'Request any of the following and we will send it across. No sales sequence attached.',
        })}
        <div class="resources-grid">
          ${each(
            co.resources,
            (r, i) => `<article class="resource-card ${i % 3 === 0 ? 'reveal' : `reveal delay-${i % 3}`}">
            <span class="resource-type">${esc(r.type)}</span>
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.description)}</p>
            <button type="button" class="text-link resource-request-btn" data-resource="${esc(r.title)}">
              Request a copy <span aria-hidden="true">&rarr;</span>
            </button>
          </article>`
          )}
        </div>
      </div>
    </section>

    <section class="section section-alt" id="request">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">Request</p>
            <h2>Ask Us to Send It Over</h2>
            <p>
              Tell us which resource you want and where to send it. We will email it directly — there is no
              drip campaign behind this form, and we do not pass your details to anyone else.
            </p>
            <p>
              If you would rather just talk to someone about the underlying problem, the
              <a href="/contact/" class="text-link">contact page</a> is the faster route.
            </p>
          </div>
          <form class="contact-form reveal delay-1" id="resourceForm" novalidate
                data-endpoint="/api/resource-request"
                data-success="Thank you — we will email your copy shortly.">
            <div class="form-field">
              <label for="resource">Resource <span class="req" aria-hidden="true">*</span></label>
              <select id="resource" name="resource" required>
                <option value="">Select a resource</option>
                ${resourceOptions}
              </select>
              <span class="field-error" data-error-for="resource"></span>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="r-name">Full Name <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="r-name" name="name" placeholder="Your name" required maxlength="100" autocomplete="name">
                <span class="field-error" data-error-for="name"></span>
              </div>
              <div class="form-field">
                <label for="r-email">Work Email <span class="req" aria-hidden="true">*</span></label>
                <input type="email" id="r-email" name="email" placeholder="you@company.com" required maxlength="254" autocomplete="email">
                <span class="field-error" data-error-for="email"></span>
              </div>
            </div>
            <div class="form-field">
              <label for="r-company">Company</label>
              <input type="text" id="r-company" name="company" placeholder="Company name" maxlength="120" autocomplete="organization">
              <span class="field-error" data-error-for="company"></span>
            </div>
            <div class="form-field form-consent">
              <label class="checkbox-label">
                <input type="checkbox" id="r-consent" name="consent" value="yes" required>
                <span>I consent to Arysec Consultancy LLP using these details to send the requested resource,
                as described in the <a href="/privacy-policy/">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error" data-error-for="consent"></span>
            </div>
${antiSpamFields()}
            <button type="submit" class="btn btn-primary btn-block">Send Me the Resource</button>
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="container-narrow">
        ${C.sectionHead({ eyebrow: 'FAQ', title: 'Frequently Asked Questions' })}
        ${C.faqList(co.generalFaqs, 'gen')}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container-narrow">
        <div class="newsletter-panel reveal">
          <div>
            <h2>Occasional Updates, Not Spam</h2>
            <p>
              A short email when we publish something substantial or when a regulatory change affects
              organisations like yours. Typically once a month. Unsubscribe in one click.
            </p>
          </div>
          <form id="newsletterForm" class="newsletter-form" novalidate
                data-endpoint="/api/newsletter"
                data-success="You are subscribed. Thank you.">
            <div class="form-field">
              <label for="n-email">Email address <span class="req" aria-hidden="true">*</span></label>
              <div class="newsletter-row">
                <input type="email" id="n-email" name="email" placeholder="you@company.com" required maxlength="254" autocomplete="email">
                <button type="submit" class="btn btn-primary">Subscribe</button>
              </div>
              <span class="field-error" data-error-for="email"></span>
            </div>
${antiSpamFields()}
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: "Have a Question We Haven't Answered?",
  text: 'Our consultants are happy to talk through your situation, whether or not it leads to an engagement.',
  actions: C.btn('/contact/', 'Get in Touch', 'btn-light') + C.btn(`mailto:${company.email}`, company.email, 'btn-outline'),
})}`;

  return {
    path: '/resources/',
    title: 'Resources, Guides & FAQs',
    description:
      'Guides, checklists, whitepapers and frequently asked questions on cybersecurity, vCISO, DPO services, ISO 27001 and the DPDP Act from Arysec Consultancy LLP.',
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail), C.faqJsonLd(co.generalFaqs)],
  };
};
