'use strict';

const { esc } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');
const { antiSpamFields } = require('../pages/contact');

/** Academy enquiry page. Posts to /api/academy-enquiry. */
module.exports = function academyContactPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: '/contact/' },
  ];

  const programmeOptions = ctx.config.programmes
    .map((p) => `<option value="${esc(ctx.programmes[p.slug].name)}">${esc(ctx.programmes[p.slug].name)}</option>`)
    .join('\n                  ');

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Contact',
  title: 'Scope a',
  titleAccent: 'Programme',
  sub: 'Tell us who needs training, roughly how many people, and what prompted the question. We respond to every enquiry within one business day.',
})}

    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info reveal">
            <div class="contact-item">
              <span class="contact-icon">${icon('mail')}</span>
              <div><h2>Email</h2><p><a href="mailto:${esc(company.email)}">${esc(company.email)}</a></p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('phone')}</span>
              <div><h2>Phone</h2><p><a href="${esc(company.phoneHref)}">${esc(company.phoneDisplay)}</a></p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('clock')}</span>
              <div><h2>Hours</h2><p>${esc(company.supportHours)}</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('pin')}</span>
              <div><h2>Delivered From</h2><p>${esc(company.name)}<br>${esc(company.addressLine)}</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('globe')}</span>
              <div><h2>Coverage</h2><p>On-site across India, live online worldwide, self-paced modules for anyone a scheduled session misses.</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('briefcase')}</span>
              <div><h2>Consulting</h2><p>Need the control fixed rather than the training delivered? Our affiliate, Arysec Consultancy, offers <a href="${esc(
                company.affiliateSite
              )}/services/">security consulting</a>.</p></div>
            </div>
          </div>

          <form class="contact-form reveal delay-1" id="academyForm" novalidate
                data-endpoint="/api/academy-enquiry" data-success="Thank you — your enquiry has been received. We will come back to you within one business day.">
            <h2 class="form-title">Training Enquiry</h2>
            <div class="form-row">
              <div class="form-field">
                <label for="name">Full Name <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="name" name="name" placeholder="Your name" required maxlength="100" autocomplete="name">
                <span class="field-error" data-error-for="name"></span>
              </div>
              <div class="form-field">
                <label for="email">Work Email <span class="req" aria-hidden="true">*</span></label>
                <input type="email" id="email" name="email" placeholder="you@company.com" required maxlength="254" autocomplete="email">
                <span class="field-error" data-error-for="email"></span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="company">Organisation</label>
                <input type="text" id="company" name="company" placeholder="Organisation name" maxlength="120" autocomplete="organization">
                <span class="field-error" data-error-for="company"></span>
              </div>
              <div class="form-field">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" name="phone" placeholder="+91 00000 00000" maxlength="32" autocomplete="tel">
                <span class="field-error" data-error-for="phone"></span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="programme">Programme of Interest</label>
                <select id="programme" name="programme">
                  <option value="">Select a programme</option>
                  ${programmeOptions}
                  <option value="Not sure yet / recommend something">Not sure yet / recommend something</option>
                </select>
              </div>
              <div class="form-field">
                <label for="delegates">Approximate Delegates <span class="hint">(optional)</span></label>
                <input type="text" id="delegates" name="delegates" placeholder="e.g. 25" maxlength="40">
                <span class="field-error" data-error-for="delegates"></span>
              </div>
            </div>
            <div class="form-field">
              <label for="message">What Prompted the Enquiry? <span class="req" aria-hidden="true">*</span></label>
              <textarea id="message" name="message" rows="6" required minlength="10" maxlength="4000"
                        placeholder="Audience, timescale, and what triggered this — an audit, a near-miss, a customer questionnaire"></textarea>
              <span class="field-error" data-error-for="message"></span>
            </div>
            <div class="form-field form-consent">
              <label class="checkbox-label">
                <input type="checkbox" id="consent" name="consent" value="yes" required>
                <span>I consent to ${esc(company.name)} storing and using these details to respond to my
                enquiry, as described in the <a href="${esc(
                  company.cookiePolicyHref.replace('/cookie-policy/', '/privacy-policy/')
                )}">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error" data-error-for="consent"></span>
            </div>
${antiSpamFields()}
            <button type="submit" class="btn btn-primary btn-block">Send Enquiry</button>
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Not Sure Training Is the Answer?',
  text: 'If the problem is a missing control rather than a knowledge gap, we will say so — and the Arysec consulting practice can pick it up instead.',
  actions: C.btn(`${company.affiliateSite}/contact/`, 'Arysec Consultancy (Consulting)', 'btn-light'),
})}`;

  return {
    path: '/contact/',
    title: 'Contact the Academy',
    description:
      'Enquire about corporate cybersecurity training from Arysec Academy. Tell us the audience, the numbers and ' +
      'the timescale, and we will scope a cohort or an annual programme.',
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        url: company.domain + '/contact/',
        mainEntity: {
          '@type': 'Organization',
          name: company.name,
          contactPoint: [
            {
              '@type': 'ContactPoint',
              telephone: company.phoneDisplay,
              email: company.email,
              contactType: 'sales',
              areaServed: 'IN',
              availableLanguage: ['en', 'hi', 'mr'],
            },
          ],
        },
      },
    ],
  };
};
