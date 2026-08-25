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
  name: 'Arysec Academy',
  shortName: 'Arysec Academy',
  /** The trading entity behind the academy, used in legal lines and JSON-LD. */
  legalName: main.company.name,
  tagline: 'Security training that changes what people actually do.',
  domain: 'https://academy.arysec.in',
  phoneDisplay: main.company.phoneDisplay,
  phoneHref: main.company.phoneHref,
  /**
   * Enquiries go to the general mailbox until a dedicated training address
   * exists. Point this at training@arysec.in and set MAIL_ACADEMY_TO to match
   * when the mailbox is live.
   */
  email: main.company.email,
  securityEmail: main.company.securityEmail,
  city: main.company.city,
  region: main.company.region,
  country: main.company.country,
  addressLine: main.company.addressLine,
  founder: main.company.founder,
  founderRole: main.company.founderRole,
  supportHours: 'Mon–Fri, 09:00–18:00 IST. Cohort support runs for the length of the programme.',
  established: main.company.established,
  /** Site of the parent business, linked from the academy header and footer. */
  parentSite: main.company.domain,
  /** One entity, one cookie policy — the banner links to the main site's copy. */
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
    heading: 'Arysec',
    links: [
      { label: 'Consulting & Services', href: main.company.domain + '/services/' },
      { label: 'About Arysec', href: main.company.domain + '/about/' },
      { label: 'Insights', href: main.company.domain + '/insights/' },
      { label: 'Careers', href: main.company.domain + '/careers/' },
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
