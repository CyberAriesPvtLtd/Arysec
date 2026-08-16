'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');
const co = require('../../data/company');

module.exports = function aboutPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about/' },
  ];
  const industries = ctx.content.industries.industries;

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'About Us',
  title: 'Trusted Partners in a',
  titleAccent: 'Connected World',
  sub: `${company.name} is an IT and information security firm headquartered in ${company.city}, working with organisations across India and international markets to govern risk, meet regulation, and keep technology running.`,
})}

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">Our Story</p>
            <h2>Built to Make Security Practical</h2>
            <p>
              Too many organisations are told what is wrong with their security and left to work out what to do
              about it. Arysec was formed to close that gap — pairing rigorous assessment with the engineering
              and leadership capacity to actually fix what we find.
            </p>
            <p>
              We operate as an extension of our clients' teams. That means owning outcomes rather than issuing
              reports: standing up a compliance function, sitting in the board pack, taking the call at 2am when
              something goes wrong.
            </p>
            <p>
              Today we deliver governance, security, and IT services from ${esc(company.city)} to clients across
              India and international markets — in regulated sectors where the standard of evidence is high and
              the tolerance for disruption is low.
            </p>
          </div>
          <div class="values-grid">
            ${each(
              co.values,
              (v, i) => `<div class="value-card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}">
              <span class="value-icon">${icon(v.icon)}</span>
              <h3>${esc(v.title)}</h3>
              <p>${esc(v.description)}</p>
            </div>`
            )}
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Leadership', title: 'Meet Our Founder' })}
        <div class="founder-block reveal">
          <div class="founder-portrait" aria-hidden="true"><span class="founder-initials">US</span></div>
          <div>
            <p class="founder-role">${esc(company.founderRole)}</p>
            <h3>${esc(company.founder)}</h3>
            <p>
              ${esc(company.founder)} founded ${esc(company.name)} to make senior security leadership accessible
              to the organisations that need it most. She has built her career at the intersection of information
              security, internal audit, and data protection — leading security programmes, standing up compliance
              functions from the ground up, and advising executive teams and boards on cyber risk.
            </p>
            <p>
              Her experience spans regulated and high-growth environments across financial services, technology,
              healthcare, and manufacturing, covering ISO 27001 implementation and audit, privacy programmes under
              the DPDP Act and GDPR, and incident readiness for businesses operating at national and international
              scale.
            </p>
            <p>
              Under her leadership, Arysec has grown into a practice of more than 50 certified professionals,
              delivering governance, security, and IT services from ${esc(company.city)} to clients across India
              and global markets.
            </p>
            <blockquote class="founder-quote">
              Security earns its place when it lets the business move faster, not slower. Our job is to give
              leaders a clear, honest picture of their risk — and then do the work to reduce it.
            </blockquote>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Our Team',
          title: '50+ Certified Security Professionals',
          sub: 'Every engagement is staffed by practitioners holding advanced, internationally recognised certifications — not generalists learning on your environment.',
        })}
        <div class="grid-3">
          ${each(
            co.teamGroups,
            (g, i) => `<div class="card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <h3>${esc(g.title)}</h3>
            <p>${esc(g.description)}</p>
          </div>`
          )}
        </div>
        <h3 class="subhead reveal">Certifications Held Across Our Team</h3>
        <div class="chip-row reveal">
          ${each(co.certifications, (c) => `<span class="chip">${esc(c)}</span>`)}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'What Sets Us Apart',
          title: 'How We Are Different',
        })}
        <div class="grid-4">
          ${each(
            co.differentiators,
            (d, i) => `<div class="card card-icon ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}">
            <span class="card-icon-mark">${icon(d.icon)}</span>
            <h3>${esc(d.title)}</h3>
            <p>${esc(d.description)}</p>
          </div>`
          )}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Our Reach',
          title: 'Mumbai Headquarters, Global Delivery',
          sub: 'We serve clients wherever they operate, with delivery teams working across Indian and international time zones.',
        })}
        <div class="grid-3">
          ${each(
            co.reach,
            (r, i) => `<div class="card card-icon ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <span class="card-icon-mark">${icon(r.icon)}</span>
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.description)}</p>
          </div>`
          )}
        </div>
        <h3 class="subhead reveal">Industries We Serve</h3>
        <div class="industry-grid">
          ${each(
            industries,
            (ind, i) =>
              `<a class="industry-item ${i % 4 === 0 ? 'reveal' : `reveal delay-${i % 4}`}" href="/industries/#${esc(ind.slug)}">${esc(ind.name)}</a>`
          )}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'Our Approach', title: 'How We Engage' })}
        ${C.processSteps(co.process)}
      </div>
    </section>

${C.ctaBanner({
  title: "Let's Talk About Your Environment",
  text: 'Tell us what you are trying to protect and where you are today. We will tell you honestly what it takes.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn('/careers/', 'Join Our Team', 'btn-outline'),
})}`;

  return {
    path: '/about/',
    title: 'About Us',
    description:
      'Arysec Technologies LLP is led by founder Unnati Shinde and a team of 50+ certified cybersecurity professionals, headquartered in Mumbai and serving clients across India and globally.',
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About ' + company.name,
        url: company.domain + '/about/',
        mainEntity: {
          '@type': 'Organization',
          name: company.name,
          founder: { '@type': 'Person', name: company.founder, jobTitle: company.founderRole },
        },
      },
    ],
  };
};
