'use strict';

const { esc, each } = require('../../lib/html');
const { icon } = require('../../lib/icons');
const C = require('../components');

/** Academy landing page. */
module.exports = function academyHome(ctx) {
  const company = ctx.config.company;
  const d = ctx.content.home;
  const featured = ctx.config.programmes.filter((p) => p.featured).slice(0, 6);

  const content = `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="grid-overlay"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>
      <div class="container hero-content">
        <p class="hero-eyebrow reveal">${esc(d.hero.eyebrow)}</p>
        <h1 class="reveal delay-1">${esc(d.hero.headline)}<br><span class="text-gradient">${esc(
          d.hero.headlineAccent
        )}</span></h1>
        <p class="hero-sub reveal delay-2">${esc(d.hero.sub)}</p>
        <div class="hero-actions reveal delay-3">
          ${C.btn('/programmes/', 'Browse Programmes', 'btn-primary')}
          ${C.btn('/contact/', 'Discuss a Programme', 'btn-outline')}
        </div>
        <div class="hero-stats reveal delay-4">
          ${each(
            d.stats,
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
        <p class="framework-label reveal">Programmes are written against the standards your auditors and customers ask about</p>
        <ul class="framework-list reveal delay-1">
          ${each(ctx.config.frameworks, (f) => `<li>${esc(f.name)}</li>`)}
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <p class="section-eyebrow">${esc(d.intro.eyebrow)}</p>
            <h2>${esc(d.intro.heading)}</h2>
            ${d.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
            <a href="/for-organisations/" class="text-link">How corporate delivery works <span aria-hidden="true">&rarr;</span></a>
          </div>
          <div class="benefit-stack reveal delay-1">
            ${each(
              d.intro.points,
              (p) => `<div class="benefit-item">
              <span class="benefit-marker" aria-hidden="true">${icon('check-square')}</span>
              <div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></div>
            </div>`
            )}
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({
          eyebrow: d.audience.eyebrow,
          title: d.audience.heading,
          sub: d.audience.sub,
        })}
        <div class="grid-4">
          ${each(
            ctx.config.programmeCategories,
            (cat, i) => `<article class="card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i, 3)}`}">
            <h3>${esc(cat.name)}</h3>
            <p>${esc(cat.blurb)}</p>
          </article>`
          )}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({
          eyebrow: 'Programmes',
          title: 'Where Most Organisations Start',
          sub: 'The six programmes that come up most often, across awareness, certification, technical skills and response.',
        })}
        <div class="services-grid">
          ${each(featured, (p, i) => {
            const data = ctx.programmes[p.slug];
            return `<article class="service-card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i % 3, 3)}`}">
            <a class="service-card-link" href="/programmes/${esc(p.slug)}/">
              <span class="service-icon">${icon(p.icon)}</span>
              <h3>${esc(data.name)}</h3>
              <p>${esc(data.cardSummary)}</p>
              <span class="chip-row">
                <span class="chip">${esc(data.duration)}</span>
                <span class="chip">${esc(data.format.split(',')[0])}</span>
              </span>
            </a>
          </article>`;
          })}
        </div>
        <div class="section-cta">${C.btn('/programmes/', 'All Programmes', 'btn-outline')}</div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="split-grid">
          <div class="split-main reveal">
            <span class="feature-tag">${esc(d.phishing.eyebrow)}</span>
            <h2>${esc(d.phishing.heading)}</h2>
            ${d.phishing.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n            ')}
            <div class="feature-actions">
              ${C.btn('/programmes/phishing-drills/', 'How Drills Work', 'btn-primary')}
            </div>
          </div>
          <aside class="split-aside">
            ${C.checklistPanel(
              'What a Campaign Measures',
              'Every wave produces the same set of numbers, so the trend across a year means something.',
              d.phishing.items
            )}
          </aside>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${C.sectionHead({ eyebrow: d.delivery.eyebrow, title: d.delivery.heading, sub: d.delivery.sub })}
        ${C.processSteps(d.delivery.steps)}
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: d.why.eyebrow, title: d.why.heading, sub: d.why.sub })}
        <div class="grid-3">
          ${each(
            d.why.items,
            (item, i) => `<article class="card ${i === 0 ? 'reveal' : `reveal delay-${Math.min(i % 3, 3)}`}">
            <span class="card-icon-mark">${icon(item.icon)}</span>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
          </article>`
          )}
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: d.cta.title,
  text: d.cta.text,
  actions:
    C.btn('/contact/', 'Talk to the Academy', 'btn-light') +
    C.btn(company.phoneHref, company.phoneDisplay, 'btn-outline'),
})}`;

  return {
    path: '/',
    title: 'Arysec Academy — Cybersecurity Training & Certification',
    description:
      'Corporate cybersecurity training: security awareness, phishing drills, secure coding, ' +
      'ISO 27001 and DPDP certification, and incident response exercises.',
    content,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: company.name,
        url: company.domain + '/',
        publisher: { '@type': 'Organization', name: company.name, url: company.domain + '/' },
      },
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
