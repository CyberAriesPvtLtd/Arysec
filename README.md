# Arysec Technologies LLP — Company Website

Professional, responsive multi-page website for **Arysec Technologies LLP**, an IT and information
security firm headquartered in Mumbai, serving clients across India and international markets.

## Overview

A fast, dependency-free static site built with plain HTML, CSS, and JavaScript. No build step required.

### Pages

| Page | File | Contents |
| --- | --- | --- |
| Home | `index.html` | Hero, animated key stats, flagship governance services, services preview, why Arysec, engagement process |
| About Us | `about.html` | Company story, founder profile, team and certifications, Mumbai HQ and global reach, industries served |
| Services | `services.html` | Full catalogue of 12 services in three groups: Governance & Advisory, Cybersecurity, IT |
| Solutions | `solutions.html` | Deep dives on vCISO / DPO / Internal Audit, compliance frameworks, three engagement models |
| Resources | `resources.html` | Guides, checklists, whitepapers, and an FAQ accordion |
| Contact | `contact.html` | Phone, email, HQ, support hours, and an enquiry form |

### Service Coverage

**Governance & Advisory** — vCISO as a Service, DPO as a Service, Internal Audit & Assurance

**Cybersecurity** — consulting & risk assessment, network security & monitoring, cloud security,
data protection & encryption, incident response & recovery, security audits & compliance

**IT** — managed IT services, software development & integration, IT infrastructure management

**Compliance frameworks covered** — ISO/IEC 27001, SOC 2, DPDP Act 2023, EU GDPR, PCI DSS, NIST CSF

### Features

- Custom SVG logo and favicon (hexagonal shield with circuit-style "A" monogram)
- Smooth, subtle animations: scroll-reveal, animated counters, FAQ accordion, hover micro-interactions
- Fully responsive layout with a mobile navigation menu
- Respects `prefers-reduced-motion` for accessibility
- Semantic HTML, ARIA attributes, and a skip-to-content link
- `tel:` and `mailto:` links throughout so mobile visitors can call or email in one tap

## Project Structure

```
├── index.html          # Home
├── about.html          # About Us
├── services.html       # Services
├── solutions.html      # Solutions
├── resources.html      # Resources
├── contact.html        # Contact
├── css/styles.css      # All styling, animations, and responsive rules
├── js/main.js          # Navigation, scroll reveal, counters, FAQ, form handling
└── assets/
    ├── logo.svg        # Full logo (mark + wordmark)
    └── favicon.svg     # Icon-only mark
```

## Running Locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Company Details Used

- **Phone:** +91 90048 57727
- **Email:** info@arysec.in
- **Headquarters:** Mumbai, Maharashtra, India
- **Founder:** Unnati Shinde, Founder & Managing Partner
- **Team:** 50+ certified security professionals

## Before Launch

- **Confirm the claims in the founder bio and team section** (`about.html`) — the certification list,
  the sector experience, and the team size are presented as fact and should be verified by the company.
- **Wire up the contact form.** It currently shows a client-side confirmation only; connect it to a
  backend or a form service (e.g. Formspree, Web3Forms) so enquiries are actually delivered.
- **Add the full registered office address** and LLP identification number (LLPIN) — the footer and
  contact page currently show city-level detail only.
- **Add real Privacy Policy and Terms of Service pages** — footer links are placeholders.
- Optionally add a founder photograph to replace the initials placeholder in `about.html`.
