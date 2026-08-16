# Arysec Technologies LLP — Content Authoring Spec

This file is the contract for all generated website content. Every content file must conform to it.

## The company (facts you may use)

- **Name:** Arysec Technologies LLP
- **Business:** IT and information security services — audits, governance, security operations, and IT
- **Headquarters:** Mumbai, Maharashtra, India
- **Reach:** Clients across India and international markets; remote and on-site delivery
- **Team:** 50+ certified security professionals
- **Founder:** Unnati Shinde, Founder & Managing Partner
- **Phone:** +91 90048 57727
- **Email:** info@arysec.in
- **Support:** 24/7 for retainer and managed clients; Mon–Fri 09:00–18:00 IST otherwise

## Honesty constraints — these are hard rules

Do **NOT** invent any of the following. A corporate security buyer verifies these, and a false claim
is a legal and reputational liability for the company:

1. **No named clients.** Never name a real company as a customer. Case studies must be anonymised
   ("a Mumbai-headquartered NBFC", "a mid-market SaaS provider").
2. **No regulatory empanelment or accreditation claims.** Do NOT write that Arysec is a
   CERT-In empanelled auditor, a certification body, an accredited registrar, a licensed assessor,
   a QSA, or similar. Arysec *prepares clients for* and *supports* certification; it does not issue
   certificates. Phrase as "certification support", "readiness", "we prepare you for the audit".
3. **No awards, rankings, ratings, press mentions, or partner/vendor tier badges.**
4. **No fabricated metrics presented as measured results** — no "we reduced incidents by 63%".
   Illustrative outcomes in case studies must be described qualitatively, or clearly framed as
   representative rather than measured.
5. **No specific past employers, universities, or dated career history for named individuals.**
6. **No pricing figures.** Refer to commercial terms qualitatively ("fixed monthly fee",
   "scoped per engagement").
7. **No legal advice framed as definitive.** For regulatory content, describe obligations in
   general terms and recommend the reader confirm their specific position.

If a fact would be useful but you cannot establish it, omit it or write it as a qualitative statement.

## Voice and style

- **Audience:** corporate and enterprise buyers — CISOs, CTOs, CFOs, compliance heads, founders.
- **Tone:** professional, confident, concrete, plain. Emphasise reliability, innovation, and expert
  support. No hype, no scare-mongering, no exclamation marks, no emoji.
- **Person:** "we" for Arysec, "you"/"your" for the reader.
- **Spelling:** **British/Indian English.** Use: organisation, prioritise, recognise, specialise,
  minimise, analyse, defence, programme, centre, licence (noun), practise (verb), whilst → "while".
  Keep proper nouns as-is (e.g. "Trust Services Criteria", "Center for Internet Security").
- **Sentence length:** vary it. Avoid strings of identical-length sentences.
- **Avoid these words entirely:** leverage, synergy, cutting-edge, best-in-class, world-class,
  seamless, robust (overused), game-changing, revolutionise, unlock, empower, holistic, bespoke.
- **Do not start consecutive items with the same word.**
- **Write about outcomes, not adjectives.** "You get a named responder and a committed response
  time" beats "unparalleled incident response excellence".

## Writing quality bar

Each page must be genuinely useful to someone evaluating the service. That means:

- Explain what actually happens during the engagement, not just what it is called.
- Name real frameworks, standards, tooling categories, and techniques where relevant
  (ISO/IEC 27001:2022, SOC 2 Trust Services Criteria, NIST CSF 2.0, MITRE ATT&CK, OWASP Top 10,
  OWASP ASVS, CIS Benchmarks, PCI DSS 4.0, DPDP Act 2023, EU GDPR, SIEM, EDR, SAST/DAST, IAM, CSPM).
- Be specific about deliverables — a reader should know exactly what lands on their desk.
- Answer the objections a buyer actually raises (cost, disruption, overlap with existing staff,
  time to value, what happens after the engagement ends).

## Escaping and formatting rules

- Content is injected into HTML. Write **plain text only** — no HTML tags, no markdown syntax
  (no `**`, no `#`, no backticks, no links). The build escapes text automatically.
- Use the ampersand character `&` normally (it is escaped at build time). Do not write `&amp;`.
- Use straight apostrophes (`'`), not typographic ones.
- Do not use em dashes more than once per paragraph.

## Output location and format

Write exactly one JSON file per assignment to the path you are given. It must be valid JSON
(no comments, no trailing commas) and must match the schema below exactly. Do not add or rename keys.

### Service page schema (`build/data/services/<slug>.json`)

```json
{
  "slug": "string — matches the filename, kebab-case",
  "name": "string — full service name, title case, e.g. 'vCISO as a Service'",
  "shortName": "string — 1-3 words for nav and cards, e.g. 'vCISO'",
  "category": "string — exactly one of: Governance & Advisory | Audit, Testing & Compliance | Cybersecurity Services | IT Services",
  "metaTitle": "string — <=60 chars, does NOT include the company name (build appends it)",
  "metaDescription": "string — 140-158 chars, describes the service and mentions Arysec",
  "cardSummary": "string — 18-28 words, used on the services hub card",
  "heroHeadline": "string — 4-9 words, benefit-led, sentence-style title case",
  "heroSub": "string — 25-45 words, one or two sentences",
  "highlights": [
    { "value": "string — 1-3 words, e.g. 'Fractional' or '24/7'", "label": "string — 2-5 words" }
  ],
  "intro": {
    "heading": "string — 3-7 words",
    "paragraphs": ["string", "string", "string"]
  },
  "capabilities": {
    "heading": "string — 3-6 words, e.g. 'What We Deliver'",
    "items": [ { "title": "string — 2-5 words", "description": "string — 20-35 words" } ]
  },
  "deliverables": {
    "heading": "string — 3-6 words",
    "intro": "string — 15-30 words",
    "items": ["string — 4-12 words each"]
  },
  "process": [ { "title": "string — 1-3 words", "description": "string — 20-35 words" } ],
  "benefits": [ { "title": "string — 2-5 words", "description": "string — 18-30 words" } ],
  "whoItsFor": ["string — 8-18 words each"],
  "faqs": [ { "question": "string", "answer": "string — 45-90 words" } ],
  "related": ["slug", "slug", "slug"]
}
```

**Required counts:** `highlights` exactly 3 · `intro.paragraphs` exactly 3 · `capabilities.items`
exactly 6 · `deliverables.items` exactly 8 · `process` exactly 4 · `benefits` exactly 4 ·
`whoItsFor` exactly 4 · `faqs` exactly 5 · `related` exactly 3.

### Valid service slugs (use only these in `related`)

`vciso`, `dpo`, `internal-audit`, `security-audit-compliance`, `iso-27001`, `vapt`,
`cybersecurity-consulting`, `network-security`, `cloud-security`, `data-protection`,
`incident-response`, `security-awareness-training`, `managed-it`, `software-development`,
`it-infrastructure`

`related` must contain three slugs other than your own, chosen because a buyer of your service
plausibly also needs them.
