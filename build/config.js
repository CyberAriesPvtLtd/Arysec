'use strict';

/**
 * Single source of truth for company details, navigation, and page registry.
 * Everything the generator emits derives from this file plus build/data/.
 */

const company = {
  name: 'Arysec Technologies LLP',
  shortName: 'Arysec',
  tagline: 'Reliable IT. Resilient security. Expert support.',
  domain: 'https://www.arysec.in',
  phoneDisplay: '+91 90048 57727',
  phoneHref: 'tel:+919004857727',
  email: 'info@arysec.in',
  careersEmail: 'careers@arysec.in',
  securityEmail: 'security@arysec.in',
  city: 'Mumbai',
  region: 'Maharashtra',
  country: 'India',
  addressLine: 'Mumbai, Maharashtra, India',
  founder: 'Unnati Shinde',
  founderRole: 'Founder & Managing Partner',
  teamSize: '50+',
  supportHours: '24/7 for retainer & managed clients; Mon–Fri, 09:00–18:00 IST otherwise',
  established: 2026,
};

/** Service categories, in display order. Drives the services hub and the nav mega-menu. */
const serviceCategories = [
  {
    id: 'governance',
    name: 'Governance & Advisory',
    blurb: 'Senior security, privacy, and audit leadership delivered as a service.',
  },
  {
    id: 'audit',
    name: 'Audit, Testing & Compliance',
    blurb: 'Independent testing and certification support against the standards your clients expect.',
  },
  {
    id: 'security',
    name: 'Cybersecurity Services',
    blurb: 'Practical defence across your network, cloud, data, and people.',
  },
  {
    id: 'it',
    name: 'IT Services',
    blurb: 'The everyday technology your business runs on, managed and secured.',
  },
];

/**
 * Service registry. `slug` matches build/data/services/<slug>.json and the emitted
 * services/<slug>.html. `icon` keys into build/lib/icons.js.
 */
const services = [
  { slug: 'vciso', icon: 'shield-check', category: 'Governance & Advisory', featured: true },
  { slug: 'dpo', icon: 'user-lock', category: 'Governance & Advisory', featured: true },
  { slug: 'internal-audit', icon: 'clipboard-check', category: 'Governance & Advisory', featured: true },
  { slug: 'security-audit-compliance', icon: 'certificate', category: 'Audit, Testing & Compliance' },
  { slug: 'iso-27001', icon: 'badge-check', category: 'Audit, Testing & Compliance' },
  { slug: 'vapt', icon: 'bug', category: 'Audit, Testing & Compliance', featured: true },
  { slug: 'cybersecurity-consulting', icon: 'shield-search', category: 'Cybersecurity Services' },
  { slug: 'network-security', icon: 'network', category: 'Cybersecurity Services' },
  { slug: 'cloud-security', icon: 'cloud', category: 'Cybersecurity Services' },
  { slug: 'data-protection', icon: 'database-lock', category: 'Cybersecurity Services' },
  { slug: 'incident-response', icon: 'siren', category: 'Cybersecurity Services', featured: true },
  { slug: 'security-awareness-training', icon: 'users', category: 'Cybersecurity Services' },
  { slug: 'managed-it', icon: 'monitor', category: 'IT Services', featured: true },
  { slug: 'software-development', icon: 'code', category: 'IT Services' },
  { slug: 'it-infrastructure', icon: 'server', category: 'IT Services' },
];

/** Insight articles, newest first. Slugs match build/data/content/article-<slug>.json. */
const articles = [
  'cloud-misconfiguration-risk',
  'first-hour-of-a-ransomware-incident',
  'dpdp-act-in-practice',
  'what-happens-during-a-penetration-test',
  'iso-27001-2022-transition',
  'do-you-need-a-vciso',
];

/** Primary navigation. `mega: 'services'` renders the grouped services panel. */
const nav = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services/', mega: 'services' },
  { label: 'Solutions', href: '/solutions/' },
  { label: 'Industries', href: '/industries/' },
  {
    label: 'Company',
    href: '/about/',
    children: [
      { label: 'About Us', href: '/about/', desc: 'Who we are and how we work' },
      { label: 'Case Studies', href: '/case-studies/', desc: 'Anonymised engagement examples' },
      { label: 'Insights', href: '/insights/', desc: 'Articles from our practitioners' },
      { label: 'Resources', href: '/resources/', desc: 'Guides, checklists and FAQs' },
      { label: 'Careers', href: '/careers/', desc: 'Open roles and how we hire' },
    ],
  },
  { label: 'Contact', href: '/contact/' },
];

/** Footer link columns. */
const footerColumns = [
  {
    heading: 'Services',
    links: [
      { label: 'vCISO as a Service', href: '/services/vciso/' },
      { label: 'DPO as a Service', href: '/services/dpo/' },
      { label: 'Internal Audit', href: '/services/internal-audit/' },
      { label: 'VAPT', href: '/services/vapt/' },
      { label: 'ISO 27001', href: '/services/iso-27001/' },
      { label: 'All Services', href: '/services/' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about/' },
      { label: 'Solutions', href: '/solutions/' },
      { label: 'Industries', href: '/industries/' },
      { label: 'Case Studies', href: '/case-studies/' },
      { label: 'Careers', href: '/careers/' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Insights', href: '/insights/' },
      { label: 'Guides & Checklists', href: '/resources/' },
      { label: 'FAQs', href: '/resources/#faq' },
      { label: 'Responsible Disclosure', href: '/responsible-disclosure/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Terms of Service', href: '/terms-of-service/' },
  { label: 'Cookie Policy', href: '/cookie-policy/' },
  { label: 'Responsible Disclosure', href: '/responsible-disclosure/' },
];

/** Compliance frameworks shown on the solutions page and elsewhere. */
const frameworks = [
  { name: 'ISO/IEC 27001:2022', desc: 'End-to-end ISMS implementation, internal audit, and certification support.' },
  { name: 'SOC 2', desc: 'Type I and Type II readiness across the Trust Services Criteria.' },
  { name: 'DPDP Act, 2023', desc: 'Data fiduciary obligations, consent architecture, and data principal rights.' },
  { name: 'EU GDPR', desc: 'Lawful basis, RoPA, DPIAs, transfer mechanisms, and DPO representation.' },
  { name: 'PCI DSS 4.0', desc: 'Cardholder data environment scoping and control implementation.' },
  { name: 'NIST CSF 2.0', desc: 'Maturity assessment and roadmap development against the framework functions.' },
];

module.exports = {
  company,
  serviceCategories,
  services,
  articles,
  nav,
  footerColumns,
  legalLinks,
  frameworks,
};
