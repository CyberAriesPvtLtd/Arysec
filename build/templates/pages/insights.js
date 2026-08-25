'use strict';

const { esc, each } = require('../../lib/html');
const C = require('../components');

/** Insights index page. */
function insightsIndex(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights/' },
  ];
  const articles = ctx.config.articles.map((slug) => ctx.content[`article-${slug}`]);

  const content = `
${C.pageHero({
  trail,
  eyebrow: 'Insights',
  title: 'Writing From Our',
  titleAccent: 'Practitioners',
  sub: 'Practical, specific writing on the standards, threats, and decisions our clients are working through. No gated forms, no sales sequences.',
})}

    <section class="section">
      <div class="container">
        <div class="grid-3">
          ${each(
            articles,
            (a, i) => `<article class="article-card ${i % 3 === 0 ? 'reveal' : `reveal delay-${i % 3}`}">
            <a href="/insights/${esc(a.slug)}/">
              <span class="article-meta">
                <span class="resource-type">${esc(a.category)}</span>
                <span class="article-time">${esc(a.readingTime)}</span>
              </span>
              <h2>${esc(a.title)}</h2>
              <p>${esc(a.excerpt)}</p>
              <span class="text-link">Read article <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`
          )}
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Have a Question These Do Not Answer?',
  text: 'Our consultants are happy to talk through your situation, whether or not it leads to an engagement.',
  actions: C.btn('/contact/', 'Get in Touch', 'btn-light') + C.btn(`mailto:${company.email}`, company.email, 'btn-outline'),
})}`;

  return {
    path: '/insights/',
    title: 'Cybersecurity & Compliance Insights',
    description:
      'Articles from the Arysec Consultancy LLP team on ISO 27001, the DPDP Act, penetration testing, ransomware response, cloud misconfiguration, and security leadership.',
    content,
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Arysec Insights',
        url: company.domain + '/insights/',
        publisher: { '@type': 'Organization', name: company.name },
      },
    ],
  };
}

/** A single article page. */
function articlePage(ctx, slug) {
  const company = ctx.config.company;
  const a = ctx.content[`article-${slug}`];
  const path = `/insights/${slug}/`;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights/' },
    { label: a.title, href: path },
  ];

  const others = ctx.config.articles
    .filter((s) => s !== slug)
    .slice(0, 3)
    .map((s) => ctx.content[`article-${s}`]);

  const content = `
    <section class="page-hero page-hero-article">
      <div class="container-narrow">
        ${C.breadcrumbs(trail)}
        <span class="article-meta">
          <span class="resource-type">${esc(a.category)}</span>
          <span class="article-time">${esc(a.readingTime)}</span>
        </span>
        <h1>${esc(a.title)}</h1>
        <p class="page-hero-sub">${esc(a.excerpt)}</p>
      </div>
    </section>

    <section class="section">
      <div class="container-narrow">
        <div class="takeaways reveal">
          <h2>Key takeaways</h2>
          <ul class="service-list">${a.keyTakeaways.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        ${C.docToc(a.sections)}
        ${C.documentSections(a.sections)}
        <div class="article-foot reveal">
          <p>
            Written by the ${esc(company.name)} team. If this raised a question about your own environment,
            <a href="/contact/">get in touch</a> — we are happy to talk it through.
          </p>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        ${C.sectionHead({ eyebrow: 'More Insights', title: 'Related Reading' })}
        <div class="grid-3">
          ${each(
            others,
            (o, i) => `<article class="article-card ${i === 0 ? 'reveal' : `reveal delay-${i}`}">
            <a href="/insights/${esc(o.slug)}/">
              <span class="article-meta">
                <span class="resource-type">${esc(o.category)}</span>
                <span class="article-time">${esc(o.readingTime)}</span>
              </span>
              <h3>${esc(o.title)}</h3>
              <p>${esc(o.excerpt)}</p>
              <span class="text-link">Read article <span aria-hidden="true">&rarr;</span></span>
            </a>
          </article>`
          )}
        </div>
      </div>
    </section>

${C.ctaBanner({
  title: 'Need Help Applying This?',
  text: 'Our consultants work through exactly these problems with clients every week.',
  actions: C.btn('/contact/', 'Book a Free Consultation', 'btn-light') + C.btn('/services/', 'Browse Services', 'btn-outline'),
})}`;

  const dates = ctx.config.articleDates[slug] || {};

  return {
    path,
    title: a.metaTitle,
    description: a.metaDescription,
    content,
    ogType: 'article',
    article: {
      published: dates.published,
      modified: dates.modified || dates.published,
      section: a.category,
    },
    jsonLd: [
      C.breadcrumbJsonLd(company.domain, trail),
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description: a.metaDescription,
        articleSection: a.category,
        url: company.domain + path,
        datePublished: dates.published,
        dateModified: dates.modified || dates.published,
        image: company.domain + '/assets/og-image.png',
        author: { '@type': 'Organization', name: company.name, url: company.domain + '/' },
        publisher: {
          '@type': 'Organization',
          name: company.name,
          logo: { '@type': 'ImageObject', url: company.domain + '/assets/logo-512.png' },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': company.domain + path },
      },
    ],
  };
}

module.exports = { insightsIndex, articlePage };
