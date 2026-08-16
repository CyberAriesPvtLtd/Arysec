'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/** Shared markup for the honeypot + timing anti-spam fields every form carries. */
function antiSpamFields() {
  return `
              <div class="hp-field" aria-hidden="true">
                <label for="website">Website (leave this field empty)</label>
                <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
              </div>
              <input type="hidden" name="formLoadedAt" value="">`;
}

module.exports = function contactPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: '/contact/' },
  ];

  const serviceOptions = ctx.config.services
    .map((s) => `<option value="${esc(ctx.services[s.slug].name)}">${esc(ctx.services[s.slug].name)}</option>`)
    .join('\n                  ');

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Contact',
  title: "Let's",
  titleAccent: 'Talk',
  sub: 'Tell us about your environment and what you are trying to achieve. We respond to every enquiry within one business day.',
})}

    <section class="section-sm">
      <div class="container">${C.contactStrip(company)}</div>
    </section>

    <section class="section section-tight-top">
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
              <span class="contact-icon">${icon('pin')}</span>
              <div><h2>Head Office</h2><p>${esc(company.name)}<br>${esc(company.addressLine)}</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('clock')}</span>
              <div><h2>Support Hours</h2><p>24/7 for retainer &amp; managed clients<br>Mon–Fri, 09:00–18:00 IST otherwise</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('globe')}</span>
              <div><h2>Coverage</h2><p>Clients across India and international markets, delivered remotely and on site.</p></div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">${icon('shield-check')}</span>
              <div><h2>Security Reports</h2><p>Found a vulnerability in our systems? See our <a href="/responsible-disclosure/">responsible disclosure policy</a>.</p></div>
            </div>
          </div>

          <form class="contact-form reveal delay-1" id="contactForm" novalidate
                data-endpoint="/api/contact" data-success="Thank you — your enquiry has been received. Our team will respond within one business day.">
            <h2 class="form-title">Send an Enquiry</h2>
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
                <label for="company">Company</label>
                <input type="text" id="company" name="company" placeholder="Company name" maxlength="120" autocomplete="organization">
                <span class="field-error" data-error-for="company"></span>
              </div>
              <div class="form-field">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" name="phone" placeholder="+91 00000 00000" maxlength="32" autocomplete="tel">
                <span class="field-error" data-error-for="phone"></span>
              </div>
            </div>
            <div class="form-field">
              <label for="service">Service of Interest</label>
              <select id="service" name="service">
                  <option value="">Select a service</option>
                  ${serviceOptions}
                  <option value="Other / Not sure yet">Other / Not sure yet</option>
              </select>
            </div>
            <div class="form-field">
              <label for="message">How Can We Help? <span class="req" aria-hidden="true">*</span></label>
              <textarea id="message" name="message" rows="6" required minlength="10" maxlength="4000"
                        placeholder="Briefly describe your needs, environment, or compliance obligations"></textarea>
              <span class="field-error" data-error-for="message"></span>
            </div>
            <div class="form-field form-consent">
              <label class="checkbox-label">
                <input type="checkbox" id="consent" name="consent" value="yes" required>
                <span>I consent to Arysec Technologies LLP storing and using these details to respond to my
                enquiry, as described in the <a href="/privacy-policy/">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span>
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
  title: 'Dealing With a Live Incident?',
  text: 'If you are responding to an active security incident right now, call us directly rather than using the form.',
  actions: C.btn(company.phoneHref, `Call ${company.phoneDisplay}`, 'btn-light'),
})}`;

  return {
    path: '/contact/',
    title: 'Contact Us',
    description:
      'Contact Arysec Technologies LLP — call +91 90048 57727, email info@arysec.in, or send an enquiry. Headquartered in Mumbai, serving clients across India and globally.',
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

module.exports.antiSpamFields = antiSpamFields;
