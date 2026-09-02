'use strict';

/**
 * Configuration for academy.arysec.in — the training and certification arm.
 *
 * Same shape as build/config.js. The generator renders both sites through the
 * shared layout, so anything the layout reads must exist in both files.
 *
 * The academy is a second site rather than a section of the main one: it has its
 * own domain, navigation and sitemap, and its pages canonicalise to
 * https://academy.arysec.in. The generator writes it to public/academy/, which
 * the server maps onto the subdomain by Host header — see server/app.js and the
 * academy block in DEPLOYMENT.md.
 */

const main = require('./config');

const company = {
  /**
   * Arysec Academy is its own registered company, not a trading name or
   * division of Arysec Consultancy LLP — confirmed by the site owner. No
   * field on this object may imply otherwise (no legalName pointing at the
   * other entity, no parentOrganization in JSON-LD). Where a fact below is
   * inherited from build/config.js, it is inherited because it was not
   * flagged as different, not because the two companies are legally one —
   * check FOUNDER, ADDRESS and PHONE against Academy's actual registration
   * before this goes further; see the comments on each field.
   */
  name: 'Arysec Academy',
  shortName: 'Arysec Academy',
  tagline: 'Security training that changes what people actually do.',
  domain: 'https://academy.arysec.in',
  /** ASSUMPTION: same phone line as Arysec Consultancy LLP. Confirm or replace. */
  phoneDisplay: main.company.phoneDisplay,
  phoneHref: main.company.phoneHref,
  /**
   * Enquiries go to the general mailbox until a dedicated training address
   * exists — and that fallback currently delivers Academy's leads into
   * Arysec Consultancy LLP's inbox, which is wrong for a separate company.
   * Set MAIL_ACADEMY_TO in the deployment environment to Academy's own
   * mailbox before this matters in production.
   */
  email: main.company.email,
  securityEmail: main.company.securityEmail,
  /** ASSUMPTION: same city/region/country/address as Arysec Consultancy LLP. Confirm or replace. */
  city: main.company.city,
  region: main.company.region,
  country: main.company.country,
  addressLine: main.company.addressLine,
  /** ASSUMPTION: same founder/director as Arysec Consultancy LLP. Confirm or replace. */
  founder: main.company.founder,
  founderRole: 'Managing Director',
  supportHours: 'Mon–Fri, 09:00–18:00 IST. Cohort support runs for the length of the programme.',
  established: main.company.established,
  /**
   * arysec.in, linked as an affiliate site from the header and footer — not
   * a parent company. Never label it as one in copy or structured data.
   */
  affiliateSite: main.company.domain,
  affiliateName: 'Arysec Consultancy LLP',
  /**
   * Academy does not yet have its own Privacy/Terms/Cookie policy, so this
   * points at the affiliate's copy as an interim measure. That document
   * names Arysec Consultancy LLP as the data controller — inaccurate for
   * data Academy collects as a separate entity. Needs its own policy, once
   * its registered name and address are confirmed; do not treat this link
   * as a long-term fix.
   */
  cookiePolicyHref: main.company.domain + '/cookie-policy/',
};

/** Sub-label shown after the wordmark in the header and footer lockup. */
const brand = { sublabel: 'Academy' };

/** Alt text for the shared social card. */
const ogImageAlt = 'Arysec Academy — Cybersecurity Training & Certification';

/** Organisation-level JSON-LD, emitted on every academy page. */
const organisation = {
  type: 'EducationalOrganization',
  description:
    'Cybersecurity training and certification for organisations: security awareness, phishing ' +
    'simulation drills, secure coding, ISO/IEC 27001 and DPDP Act programmes, and incident ' +
    'response exercises, delivered in-person and online across India.',
  knowsAbout: [
    'Security awareness training',
    'Phishing simulation',
    'Secure coding',
    'ISO/IEC 27001',
    'Digital Personal Data Protection Act',
    'Incident response exercises',
  ],
};

/** Programme categories, in display order. Drives the hub and the nav panel. */
const programmeCategories = [
  {
    id: 'workforce',
    name: 'Workforce Awareness',
    blurb: 'Behaviour change for everyone on the payroll, measured rather than assumed.',
  },
  {
    id: 'certification',
    name: 'Certification Tracks',
    blurb: 'Structured courses ending in an assessment and a certificate your auditor accepts.',
  },
  {
    id: 'technical',
    name: 'Technical Skills',
    blurb: 'Hands-on training for the engineers who build and defend your systems.',
  },
  {
    id: 'leadership',
    name: 'Leadership & Response',
    blurb: 'Exercises and briefings for the people who make the call under pressure.',
  },
];

/**
 * Programme registry. `slug` matches build/data/academy/programmes/<slug>.json
 * and the emitted programmes/<slug>/ page. `icon` keys into build/lib/icons.js.
 */
const programmes = [
  { slug: 'security-awareness', icon: 'users', category: 'Workforce Awareness', featured: true },
  { slug: 'phishing-drills', icon: 'shield-search', category: 'Workforce Awareness', featured: true },
  { slug: 'iso-27001-lead-implementer', icon: 'badge-check', category: 'Certification Tracks', featured: true },
  { slug: 'iso-27001-internal-auditor', icon: 'clipboard-check', category: 'Certification Tracks' },
  { slug: 'dpdp-privacy-essentials', icon: 'user-lock', category: 'Certification Tracks', featured: true },
  { slug: 'secure-coding', icon: 'code', category: 'Technical Skills', featured: true },
  { slug: 'cloud-security-essentials', icon: 'cloud', category: 'Technical Skills' },
  { slug: 'incident-response-tabletop', icon: 'siren', category: 'Leadership & Response', featured: true },
  { slug: 'board-and-leadership', icon: 'briefcase', category: 'Leadership & Response' },
];

/** Which registry the grouped nav panel reads, and where those pages live. */
const catalogue = {
  basePath: '/programmes/',
  dataKey: 'programmes',
  panelId: 'mega-programmes',
  links: [
    { href: '/programmes/', label: 'View all programmes' },
    { href: '/for-organisations/', label: 'How we deliver' },
  ],
};

/** Primary navigation. `mega: 'programmes'` renders the grouped programmes panel. */
const nav = [
  { label: 'Home', href: '/' },
  { label: 'Programmes', href: '/programmes/', mega: 'programmes' },
  { label: 'Certification', href: '/certification/' },
  { label: 'For Organisations', href: '/for-organisations/' },
  { label: 'Contact', href: '/contact/' },
];

/** The primary call to action in the header. */
const navCta = { href: '/contact/', label: 'Discuss Training' };

const footerColumns = [
  {
    heading: 'Programmes',
    links: [
      { label: 'Security Awareness', href: '/programmes/security-awareness/' },
      { label: 'Phishing Drills', href: '/programmes/phishing-drills/' },
      { label: 'Secure Coding', href: '/programmes/secure-coding/' },
      { label: 'ISO 27001 Lead Implementer', href: '/programmes/iso-27001-lead-implementer/' },
      { label: 'All Programmes', href: '/programmes/' },
    ],
  },
  {
    heading: 'Academy',
    links: [
      { label: 'Certification', href: '/certification/' },
      { label: 'For Organisations', href: '/for-organisations/' },
      { label: 'Incident Response Drills', href: '/programmes/incident-response-tabletop/' },
      { label: 'DPDP & Privacy', href: '/programmes/dpdp-privacy-essentials/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
  {
    // Arysec Consultancy LLP is a separate company, not our own — labelled
    // per link so this reads as a cross-link to an affiliate, not a section
    // of our own site.
    heading: 'Affiliate',
    links: [
      { label: 'Arysec Consultancy — Security Consulting', href: main.company.domain + '/services/' },
      { label: 'Arysec Consultancy — About', href: main.company.domain + '/about/' },
      { label: 'Arysec Consultancy — Careers', href: main.company.domain + '/careers/' },
      { label: 'arysec.in', href: main.company.domain + '/' },
    ],
  },
];

/**
 * Legal documents live on the main site: one entity, one set of policies.
 * These are absolute so the subdomain footer reaches them.
 */
const legalLinks = main.legalLinks.map((l) => ({ label: l.label, href: main.company.domain + l.href }));

/** Standards the certification tracks are written against. */
const frameworks = [
  { name: 'ISO/IEC 27001:2022', desc: 'Lead implementer and internal auditor tracks mapped to the current Annex A.' },
  { name: 'DPDP Act, 2023', desc: 'Data fiduciary duties, consent, breach intimation and data principal rights.' },
  { name: 'NIST CSF 2.0', desc: 'Used as the reference model in leadership briefings and maturity sessions.' },
  { name: 'OWASP Top 10', desc: 'The backbone of the secure coding track, with language-specific labs.' },
  { name: 'MITRE ATT&CK', desc: 'Drives the SOC and incident response exercises and their scenario design.' },
  { name: 'CIS Benchmarks', desc: 'Hardening baselines used across the cloud security labs.' },
];

module.exports = {
  company,
  brand,
  catalogue,
  ogImageAlt,
  organisation,
  programmeCategories,
  programmes,
  nav,
  navCta,
  footerColumns,
  legalLinks,
  frameworks,
  /** Aliases so the shared layout can render either site's grouped nav panel. */
  serviceCategories: programmeCategories,
  services: programmes,
};
