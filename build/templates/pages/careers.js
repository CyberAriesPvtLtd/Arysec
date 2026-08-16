'use strict';

const { esc, each, list } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');
const { antiSpamFields } = require('./contact');

module.exports = function careersPage(ctx) {
  const company = ctx.config.company;
  const d = ctx.content.careers;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '/careers/' },
  ];

  const roleOptions = d.openRoles
    .map((r) => `<option value="${esc(r.title)}">${esc(r.title)}</option>`)
    .join('\n                ');

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Careers',
  title: d.heroHeadline,
  sub: d.heroSub,
  actions: C.btn('#roles', 'See Open Roles', 'btn-primary') + C.btn('#apply', 'Apply Now', 'btn-outline'),
})}

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">Working Here</p>
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
          </div>
          <div class="values-grid">
            ${each(
              d.culture,
              (c, i) => `<div class="value-card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}">
              <h3>${esc(c.title)}</h3>
              <p>${esc(c.description)}</p>
            </div>`
            )}
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Benefits', title: 'What We Offer' })}
        <div class="grid-3">
          ${each(
            d.benefits,
            (b, i) => `<div class="card ${i % 3 === 0 ? 'reveal' : `reveal delay-${i % 3}`}">
            <h3>${esc(b.title)}</h3>
            <p>${esc(b.description)}</p>
          </div>`
          )}
        </div>
      </div>
    </section>

    <section class="section" id="roles">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Open Roles',
          title: 'Where We Are Hiring',
          sub: `Do not see an exact match? Send your CV to ${company.careersEmail} anyway — we review every application.`,
        })}
        <div class="role-list">
          ${each(
            d.openRoles,
            (r, i) => `<article class="role-item reveal" id="${esc(r.slug)}">
            <button class="role-summary" aria-expanded="false" aria-controls="role-body-${i}">
              <span class="role-head">
                <span class="role-title">${esc(r.title)}</span>
                <span class="role-meta">
                  <span class="chip">${esc(r.team)}</span>
                  <span class="chip">${esc(r.location)}</span>
                  <span class="chip">${esc(r.type)}</span>
                  <span class="chip">${esc(r.experience)}</span>
                </span>
              </span>
              <span class="faq-icon" aria-hidden="true"></span>
            </button>
            <div class="role-body" id="role-body-${i}">
              <div class="role-body-inner">
                <p>${esc(r.summary)}</p>
                <div class="role-cols">
                  <div>
                    <h3>What you will do</h3>
                    ${list(r.responsibilities, 'service-list')}
                  </div>
                  <div>
                    <h3>What we are looking for</h3>
                    ${list(r.requirements, 'service-list')}
                  </div>
                </div>
                <a href="#apply" class="btn btn-primary role-apply" data-role="${esc(r.title)}">Apply for this role</a>
              </div>
            </div>
          </article>`
          )}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Hiring Process', title: 'How We Hire' })}
        ${C.processSteps(d.process)}
      </div>
    </section>

    <section class="section" id="apply">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">Apply</p>
            <h2>Send Us Your Application</h2>
            <p>
              Attach your CV and tell us which role interests you. We read every application and reply either
              way, usually within a week.
            </p>
            <p>
              You can also email us directly at
              <a href="mailto:${esc(company.careersEmail)}" class="text-link">${esc(company.careersEmail)}</a>.
            </p>
            <div class="note-panel">
              <span class="note-icon">${icon('shield-check')}</span>
              <p>
                We handle applicant data under our <a href="/privacy-policy/">Privacy Policy</a>. CVs are stored
                securely, accessible only to the hiring team, and deleted once the recruitment process concludes
                unless you ask us to keep them on file.
              </p>
            </div>
          </div>
          <form class="contact-form reveal delay-1" id="careersForm" novalidate enctype="multipart/form-data"
                data-endpoint="/api/careers"
                data-success="Thank you — your application has been received. We will be in touch within a week.">
            <div class="form-row">
              <div class="form-field">
                <label for="c-name">Full Name <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="c-name" name="name" placeholder="Your name" required maxlength="100" autocomplete="name">
                <span class="field-error" data-error-for="name"></span>
              </div>
              <div class="form-field">
                <label for="c-email">Email <span class="req" aria-hidden="true">*</span></label>
                <input type="email" id="c-email" name="email" placeholder="you@example.com" required maxlength="254" autocomplete="email">
                <span class="field-error" data-error-for="email"></span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="c-phone">Phone</label>
                <input type="tel" id="c-phone" name="phone" placeholder="+91 00000 00000" maxlength="32" autocomplete="tel">
                <span class="field-error" data-error-for="phone"></span>
              </div>
              <div class="form-field">
                <label for="c-role">Role <span class="req" aria-hidden="true">*</span></label>
                <select id="c-role" name="role" required>
                  <option value="">Select a role</option>
                  ${roleOptions}
                  <option value="General application">General application</option>
                </select>
                <span class="field-error" data-error-for="role"></span>
              </div>
            </div>
            <div class="form-field">
              <label for="c-link">LinkedIn or portfolio URL</label>
              <input type="url" id="c-link" name="link" placeholder="https://" maxlength="300">
              <span class="field-error" data-error-for="link"></span>
            </div>
            <div class="form-field">
              <label for="c-cv">CV / Résumé <span class="hint">(PDF, DOC or DOCX, max 5 MB)</span></label>
              <input type="file" id="c-cv" name="cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
              <span class="field-error" data-error-for="cv"></span>
            </div>
            <div class="form-field">
              <label for="c-message">Anything else we should know? <span class="req" aria-hidden="true">*</span></label>
              <textarea id="c-message" name="message" rows="5" required minlength="10" maxlength="4000"
                        placeholder="Tell us briefly why this role interests you"></textarea>
              <span class="field-error" data-error-for="message"></span>
            </div>
            <div class="form-field form-consent">
              <label class="checkbox-label">
                <input type="checkbox" id="c-consent" name="consent" value="yes" required>
                <span>I consent to Arysec Technologies LLP processing my application data as described in the
                <a href="/privacy-policy/">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error" data-error-for="consent"></span>
            </div>
${antiSpamFields()}
            <button type="submit" class="btn btn-primary btn-block">Submit Application</button>
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Not the Right Time?',
  text: 'Send your CV anyway. We keep good people in mind and roles open up regularly.',
  actions: C.btn(`mailto:${company.careersEmail}`, company.careersEmail, 'btn-light'),
})}`;

  return {
    path: '/careers/',
    title: d.metaTitle,
    description: d.metaDescription,
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      ...d.openRoles.map((r) => ({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: r.title,
        description: r.summary,
        employmentType: 'FULL_TIME',
        hiringOrganization: { '@type': 'Organization', name: company.name, sameAs: company.domain + '/' },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: company.city,
            addressRegion: company.region,
            addressCountry: 'IN',
          },
        },
        experienceRequirements: r.experience,
        directApply: true,
      })),
    ],
  };
};
