'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');
const co = require('../../data/company');

module.exports = function homePage(ctx) {
  const company = ctx.config.company;
  const featured = ctx.config.services.filter((s) => s.featured).slice(0, 6);
  const industries = ctx.content.industries.industries;
  const cases = ctx.content['case-studies'].caseStudies.slice(0, 3);
  const latest = ctx.config.articles.slice(0, 3).map((slug) => ctx.content[`article-${slug}`]);

  const content = `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="grid-overlay"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>
      <div class="container hero-content">
        <p class="hero-eyebrow reveal">Mumbai HQ &middot; Serving India &amp; Global Clients</p>
        <h1 class="reveal delay-1">Secure Technology.<br><span class="text-gradient">Confident Business.</span></h1>
        <p class="hero-sub reveal delay-2">
          ${esc(company.name)} is an IT and information security firm built around a team of ${esc(company.teamSize)}
          certified professionals. From virtual CISO leadership and data protection officer services to penetration
          testing, managed IT, and internal audit, we help organisations govern risk, meet regulation, and operate
          without interruption.
        </p>
        <div class="hero-actions reveal delay-3">
          ${C.btn('/services/', 'Explore Our Services', 'btn-primary')}
          ${C.btn('/contact/', 'Talk to an Expert', 'btn-outline')}
        </div>
        <div class="hero-stats reveal delay-4">
          ${each(
            co.stats,
            (s) => `<div class="stat">
            <span class="stat-number" data-count="${s.count}">0</span><span class="stat-suffix">${esc(s.suffix)}</span>
            <span class="stat-label">${esc(s.label)}</span>
          </div>`
          )}
        </div>
      </div>
    </section>

    <section class="framework-band">
      <div class="container">
        <p class="framework-label reveal">We take clients through the frameworks their customers and regulators expect</p>
        <ul class="framework-list reveal delay-1">
          ${each(ctx.config.frameworks, (f) => `<li>${esc(f.name)}</li>`)}
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Governance & Advisory',
          title: 'Senior Security Leadership, On Demand',
          sub: 'Access the expertise of a full security, privacy, and audit function without the cost and lead time of building one in-house.',
        })}
        <div class="grid-3">
          ${each(['vciso', 'dpo', 'internal-audit'], (slug, i) => {
            const svc = ctx.config.services.find((s) => s.slug === slug);
            const d = ctx.services[slug];
            return `<article class="feature-tile ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a href="/services/${esc(slug)}/">
              <span class="service-icon">${icon(svc.icon)}</span>
              <h3>${esc(d.name)}</h3>
              <p>${esc(d.cardSummary)}</p>
              <span class="text-link">Learn more <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`;
          })}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Services',
          title: 'Comprehensive IT & Security Capability',
          sub: 'A single, accountable partner across your entire technology and security estate.',
        })}
        <div class="services-grid">
          ${each(featured, (svc, i) => C.serviceCard(svc, ctx.services[svc.slug], i))}
        </div>
        <div class="section-cta reveal">${C.btn('/services/', 'View All 15 Services', 'btn-outline')}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">Why Arysec</p>
            <h2>Expertise You Can Hold to Account</h2>
            <p>
              Arysec was founded on a simple conviction: security should enable the business, not obstruct it.
              Our team holds advanced industry certifications across security architecture, audit, privacy,
              and incident response.
            </p>
            <p>
              We work from our Mumbai headquarters with clients across India and international markets,
              combining recognised frameworks with hands-on engineering to deliver outcomes that stand up to
              scrutiny — from the boardroom to the audit floor.
            </p>
            <a href="/about/" class="text-link">More about our team <span aria-hidden="true">&rarr;</span></a>
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
        ${C.sectionHead({
          eyebrow: 'What Sets Us Apart',
          title: 'Why Clients Stay With Us',
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
          eyebrow: 'Industries',
          title: 'Sector Experience That Shortens the Learning Curve',
          sub: 'We already know the threats, regulators, and operational constraints of the sectors we serve.',
        })}
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
        ${C.sectionHead({
          eyebrow: 'Our Approach',
          title: 'How We Engage',
          sub: 'A structured method that moves from understanding your environment to sustaining it long term.',
        })}
        ${C.processSteps(co.process)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Case Studies',
          title: 'Work We Have Delivered',
          sub: ctx.content['case-studies'].disclaimer,
        })}
        <div class="grid-3">
          ${each(
            cases,
            (cs, i) => `<article class="case-card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a href="/case-studies/#${esc(cs.slug)}">
              <span class="case-sector">${esc(cs.sector)}</span>
              <h3>${esc(cs.title)}</h3>
              <p>${esc(cs.challenge)}</p>
              <span class="text-link">Read the case study <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`
          )}
        </div>
        <div class="section-cta reveal">${C.btn('/case-studies/', 'All Case Studies', 'btn-outline')}</div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Insights',
          title: 'From Our Practitioners',
          sub: 'Practical writing on the standards, threats, and decisions our clients are working through.',
        })}
        <div class="grid-3">
          ${each(
            latest,
            (a, i) => `<article class="article-card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a href="/insights/${esc(a.slug)}/">
              <span class="article-meta"><span class="resource-type">${esc(a.category)}</span><span class="article-time">${esc(a.readingTime)}</span></span>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.excerpt)}</p>
              <span class="text-link">Read article <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`
          )}
        </div>
        <div class="section-cta reveal">${C.btn('/insights/', 'All Insights', 'btn-outline')}</div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Ready to Strengthen Your Security Posture?',
  text: 'Speak with our team for a no-obligation consultation and a clear view of where you stand today.',
  actions:
    C.btn('/contact/', 'Book a Free Consultation', 'btn-light') +
    C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}

    <section class="section-sm">
      <div class="container">${C.contactStrip(company)}</div>
    </section>`;

  return {
    path: '/',
    title: `Arysec Consultancy LLP | IT & Cybersecurity Services, Mumbai`,
    description:
      'Arysec Consultancy LLP is a premier IT & cybersecurity consultancy in Mumbai. We provide expert vCISO, DPO as a Service, VAPT, and ISO 27001 compliance services.',
    content,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: company.name,
        alternateName: [company.shortName, 'CyberAries', 'CyberAries Pvt Ltd', 'Cyber Aries'],
        url: company.domain + '/',
        potentialAction: {
          '@type': 'SearchAction',
          target: company.domain + '/services/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
};
