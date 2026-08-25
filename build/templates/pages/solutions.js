'use strict';

const { esc, each, list } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');
const co = require('../../data/company');

module.exports = function solutionsPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Solutions', href: '/solutions/' },
  ];

  const flagship = ['vciso', 'dpo', 'internal-audit'];

  const featureBlocks = flagship.map((slug, i) => {
    const svc = ctx.config.services.find((s) => s.slug === slug);
    const d = ctx.services[slug];
    return `
        <div class="feature-block${i % 2 === 1 ? ' reverse' : ''}" id="${esc(slug)}">
          <div class="reveal">
            <span class="feature-tag">Flagship Solution</span>
            <h2>${esc(d.name)}</h2>
            <p>${esc(d.intro.paragraphs[0])}</p>
            <p>${esc(d.intro.paragraphs[1])}</p>
            <div class="feature-actions">
              <a href="/services/${esc(slug)}/" class="btn btn-primary">Full ${esc(d.shortName)} details</a>
              <a href="/contact/" class="text-link">Discuss an engagement <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
          <div class="feature-visual reveal delay-1">
            <span class="service-icon">${icon(svc.icon)}</span>
            <h3>${esc(d.deliverables.heading)}</h3>
            ${list(d.deliverables.items, 'service-list')}
          </div>
        </div>`;
  });

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Solutions',
  title: 'Security Functions,',
  titleAccent: 'Delivered as a Service',
  sub: 'Building an in-house security, privacy, and audit function takes years and a headcount most organisations cannot justify. Our packaged solutions give you that capability now, staffed by certified practitioners and accountable for the outcome.',
  actions: C.btn('/contact/', 'Request a Consultation', 'btn-primary') + C.btn('/services/', 'Browse All Services', 'btn-outline'),
})}

    <section class="section">
      <div class="container">
${C.join(featureBlocks)}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Compliance',
          title: 'Frameworks We Take You Through',
          sub: 'From first gap analysis to certification and the surveillance audits that follow. Certification and attestation are issued by an accredited certification body or licensed assessor; we prepare you for it and support you through it.',
        })}
        <div class="grid-3">
          ${each(
            ctx.config.frameworks,
            (f, i) => `<div class="card ${i % 3 === 0 ? 'reveal' : `reveal delay-${i % 3}`}">
            <h3>${esc(f.name)}</h3>
            <p>${esc(f.desc)}</p>
          </div>`
          )}
        </div>
        <div class="section-cta reveal">
          ${C.btn('/services/iso-27001/', 'ISO 27001 in Detail', 'btn-outline')}
          ${C.btn('/services/security-audit-compliance/', 'Audit & Compliance in Detail', 'btn-outline')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Engagement Models',
          title: 'Built Around Your Business',
          sub: 'Three ways to work with us, matched to your stage, size, and regulatory exposure.',
        })}
        <div class="solutions-grid">
          ${each(
            co.engagementModels,
            (m, i) => `<article class="solution-card${m.featured ? ' featured' : ''} ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <div class="solution-tag">${esc(m.tag)}</div>
            <h3>${esc(m.title)}</h3>
            <p>${esc(m.description)}</p>
            ${list(m.items, '')}
          </article>`
          )}
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Which Solution Fits Your Business?',
  text: 'Tell us your obligations and constraints. We will recommend the shortest path to where you need to be.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/solutions/',
    title: 'Security & Compliance Solutions',
    description:
      'Packaged solutions from Arysec Consultancy LLP — vCISO as a Service, DPO as a Service, internal audit, plus ISO 27001, SOC 2, GDPR, DPDP Act, PCI DSS and NIST CSF readiness.',
    content,
    jsonLd: [C.breadcrumbJsonLd(company.domain, trail)],
  };
};
