'use strict';

/** Hand-authored company content shared across the home and about pages. */

const values = [
  {
    icon: 'shield-check',
    title: 'Reliability',
    description: 'Measurable SLAs, consistent delivery, and infrastructure you can depend on every day.',
  },
  {
    icon: 'lightbulb',
    title: 'Innovation',
    description: 'Modern architecture and forward-looking defence that keep you ahead of emerging threats.',
  },
  {
    icon: 'users',
    title: 'Expert Support',
    description: 'Certified professionals available around the clock, ready when you need us most.',
  },
  {
    icon: 'scale',
    title: 'Integrity',
    description: 'Transparent engagement, honest guidance, and accountability at every step.',
  },
];

const stats = [
  { count: 50, suffix: '+', label: 'Certified Experts' },
  { count: 250, suffix: '+', label: 'Engagements Delivered' },
  { count: 24, suffix: '/7', label: 'Monitoring & Support' },
  { count: 15, suffix: '+', label: 'Industries Served' },
];

const process = [
  {
    title: 'Assess',
    description:
      'We map your environment, obligations, and risk exposure to establish a factual baseline, and interview the people who run the controls.',
  },
  {
    title: 'Design',
    description:
      'We define the controls, architecture, and a prioritised roadmap matched to your budget, timeline, and risk appetite.',
  },
  {
    title: 'Implement',
    description:
      'Our engineers deploy and configure alongside your teams, sequencing the work so day-to-day operations keep running.',
  },
  {
    title: 'Sustain',
    description:
      'Continuous monitoring, reporting, and scheduled review keep controls effective as your business and the threat landscape change.',
  },
];

const differentiators = [
  {
    icon: 'target',
    title: 'We own the outcome',
    description:
      'Most firms hand you a findings report and leave. We stay through remediation, certification, and the surveillance audits that follow.',
  },
  {
    icon: 'handshake',
    title: 'One accountable partner',
    description:
      'Governance, security operations, and everyday IT under a single engagement, so nothing falls between two vendors.',
  },
  {
    icon: 'briefcase',
    title: 'Board-ready reporting',
    description:
      'Findings translated into risk language your directors, auditors, and insurers can act on, not raw scanner output.',
  },
  {
    icon: 'globe',
    title: 'India and international',
    description:
      'Mumbai delivery centre working across time zones, fluent in both Indian regulation and the frameworks global clients demand.',
  },
];

const teamGroups = [
  {
    title: 'Security Engineering',
    description:
      'Architects and engineers who design, deploy, and harden network, cloud, and endpoint defences across hybrid estates.',
  },
  {
    title: 'Governance, Risk & Compliance',
    description:
      'Auditors, privacy specialists, and risk practitioners who build control frameworks and carry them through to certification.',
  },
  {
    title: 'Detection & Response',
    description:
      'Analysts and responders running continuous monitoring, threat hunting, and forensic investigation around the clock.',
  },
];

const certifications = [
  'CISSP',
  'CISM',
  'CISA',
  'CRISC',
  'CEH',
  'OSCP',
  'CCSP',
  'ISO 27001 Lead Auditor',
  'ISO 27001 Lead Implementer',
  'CIPP/E',
  'CDPSE',
  'AWS Certified Security',
  'Microsoft Azure Security Engineer',
];

const reach = [
  {
    icon: 'pin',
    title: 'Headquarters',
    description: 'Mumbai, Maharashtra — our operating base, delivery centre, and round-the-clock monitoring function.',
  },
  {
    icon: 'network',
    title: 'Across India',
    description:
      'On-site and remote engagements nationwide, with consultants available for audit, response, and implementation work at client premises.',
  },
  {
    icon: 'globe',
    title: 'International',
    description:
      'Remote-first delivery for global clients, aligned to GDPR, SOC 2, and the regulatory expectations of the markets they serve.',
  },
];

const engagementModels = [
  {
    tag: 'For Growing Businesses',
    title: 'Secure Foundations',
    description:
      'Establish the essentials — protected networks, managed endpoints, reliable backups, and a security baseline that scales as you grow.',
    items: ['Managed IT & service desk', 'Network security setup', 'Backup & disaster recovery', 'Baseline policy framework'],
    featured: false,
  },
  {
    tag: 'For Enterprises',
    title: 'Enterprise Resilience',
    description:
      'Defence in depth for complex environments — continuous monitoring, incident readiness, cloud security, and vCISO leadership at scale.',
    items: ['24/7 monitoring & threat hunting', 'vCISO leadership', 'Cloud & hybrid security', 'Incident response retainer'],
    featured: true,
  },
  {
    tag: 'For Regulated Industries',
    title: 'Compliance Assurance',
    description:
      'Meet regulatory obligations with confidence — an appointed DPO, independent internal audit, and documented controls that survive scrutiny.',
    items: ['DPO as a Service', 'Internal audit programme', 'ISO 27001 / SOC 2 certification support', 'Risk & control frameworks'],
    featured: false,
  },
];

const resources = [
  {
    type: 'Guide',
    title: "The Executive's Guide to Cyber Risk",
    description: 'A plain-language framework for understanding, prioritising, and communicating security risk at board level.',
  },
  {
    type: 'Checklist',
    title: 'Cloud Security Readiness Checklist',
    description: 'Twenty essential checkpoints to validate before, during, and after a move to the cloud.',
  },
  {
    type: 'Whitepaper',
    title: 'Building an Incident Response Plan',
    description: 'How prepared organisations detect, contain, and recover from security incidents with minimal disruption.',
  },
  {
    type: 'Briefing',
    title: 'DPDP Act: What Your Business Must Do',
    description:
      "A practical breakdown of data fiduciary obligations under India's Digital Personal Data Protection Act, and where most organisations fall short.",
  },
  {
    type: 'Toolkit',
    title: 'ISO 27001 Certification Roadmap',
    description: 'The full path from gap analysis to certificate, with realistic timelines, effort estimates, and common pitfalls.',
  },
  {
    type: 'Guide',
    title: 'Do You Need a vCISO?',
    description: 'How to tell whether fractional security leadership is the right answer, and what to expect from the engagement.',
  },
];

const generalFaqs = [
  {
    question: 'How do engagements usually start?',
    answer:
      'With a short discovery call, at no cost. We ask about your environment, your obligations, and what is prompting the conversation. If it looks like a fit, we scope a baseline assessment and give you a written proposal with fixed deliverables before any work begins.',
  },
  {
    question: 'Do you work with organisations that already have an IT team?',
    answer:
      'Most of our clients do. We are usually brought in for capability the in-house team does not have — independent audit, privacy expertise, penetration testing, or 24/7 monitoring — or to add senior leadership without a full-time hire. We work alongside your team rather than replacing it.',
  },
  {
    question: 'What happens in the first two weeks of an engagement?',
    answer:
      'Discovery. We map your environment, obligations, and existing controls, and interview the people who operate them. You receive a written baseline assessment with prioritised findings and a proposed roadmap. Nothing is implemented until you have seen and agreed that plan.',
  },
  {
    question: 'Do you work with clients outside India?',
    answer:
      'Yes. We are headquartered in Mumbai and deliver to clients across India and international markets. Our teams work across time zones, and our compliance practice covers international frameworks including GDPR, SOC 2, PCI DSS, and NIST CSF alongside Indian regulation.',
  },
  {
    question: 'How do you handle confidentiality?',
    answer:
      'Every engagement runs under a signed non-disclosure agreement before scoping begins. Client identities are confidential and we do not publish them. Findings, evidence, and reports are handled under defined access controls and retained only as long as the engagement and any regulatory obligation require.',
  },
  {
    question: 'How quickly can you respond to a live security incident?',
    answer:
      'Retainer clients have a committed response time and a 24/7 escalation path with a named responder. If you are not a retainer client and are dealing with an active incident, call us directly — we will tell you immediately whether we can mobilise, and what to do in the meantime to preserve evidence and limit spread.',
  },
];

module.exports = {
  values,
  stats,
  process,
  differentiators,
  teamGroups,
  certifications,
  reach,
  engagementModels,
  resources,
  generalFaqs,
};
