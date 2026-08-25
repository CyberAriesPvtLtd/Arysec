# Arysec Technologies LLP — Website

Corporate website and enquiry backend for **Arysec Technologies LLP**, an IT and information security
firm headquartered in Mumbai, serving clients across India and international markets.

Two sites are generated from one codebase:

- **www.arysec.in — 36 pages** — home, 15 service detail pages, solutions, industries, case studies,
  insights index plus 6 articles, resources, careers, contact, 4 legal documents, and a 404 page
- **academy.arysec.in — 15 pages** — Arysec Academy: home, programmes hub, 9 training programmes,
  certification, corporate delivery, enquiry, and a 404 page
- **Static output** — every page is pre-rendered HTML with no client-side framework
- **Node backend** — handles enquiry, academy, resource-request, careers, and newsletter submissions

---

## Quick start

```bash
npm install
cp .env.example .env      # then edit .env
npm start                 # builds the site and starts the server on :3000
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Generate `public/` from `build/` |
| `npm run serve` | Start the server without rebuilding |
| `npm run dev` | Build and start in development mode (relaxed origin checks, stack traces in logs) |
| `npm run check` | Build, then verify links, anchors, metadata and CSP hygiene on both sites |
| `npm run brand` | Regenerate the logo assets from `build/lib/brand.js` |
| `npm test` | Run the backend test suite |
| `npm run submissions` | Read form submissions from the database (see below) |

---

## Architecture

```
build/                     Site generator — the source of truth
├── config.js              Main site: company details, navigation, service registry, footer
├── config.academy.js      Academy site: domain, navigation, programme registry, footer
├── build.js               Loads data, validates it, renders both sites into public/
├── data/
│   ├── CONTENT-SPEC.md    Authoring rules for all page content
│   ├── company.js         Values, stats, process, engagement models, general FAQs
│   ├── services/*.json    One file per service page (15)
│   ├── content/*.json     Legal docs, industries, case studies, careers, articles
│   └── academy/
│       ├── programmes/*.json  One file per training programme (9)
│       └── content/*.json     Academy home, certification, corporate delivery
├── lib/
│   ├── brand.js           Logo geometry — mark, wordmark and lockups
│   ├── html.js            HTML escaping and render helpers
│   ├── icons.js           Inline SVG icon set
│   └── validate.js        Schema validation for all content data
├── templates/
│   ├── layout.js          Page shell: head, nav, footer, JSON-LD, cookie banner
│   ├── components.js      Reusable blocks (hero, cards, FAQ, CTA, breadcrumbs…)
│   ├── pages/*.js         One module per main-site page type
│   └── academy/*.js       One module per academy page type
├── static/                CSS, JS and assets copied into both sites
│                          (styles.css and main.js are content-hashed on build)
└── static-academy/        Academy-only asset overrides (its own social card)

public/                    Generated output — do not edit by hand
└── academy/               The academy build, served at academy.arysec.in
server/                    Express backend
scripts/                   check-links.js, build-brand-assets.js, export-submissions.js
tests/                     Backend test suite
```

### Two sites, one build

The academy is a separate site, not a section: its own domain, navigation,
sitemap, robots.txt and canonical URLs. It is emitted into `public/academy/` so a
single deployment can serve both hosts, and the server maps the subdomain onto
that directory by `Host` header. `/academy/...` on the main domain is redirected
to the subdomain, so no page is ever reachable at two addresses.

Both sites render through the same `layout.js`, so anything the layout reads —
`company`, `nav`, `footerColumns`, `legalLinks`, `brand`, `organisation`,
`catalogue`, `ogImageAlt` — must exist in both config files.

**Content never reaches HTML unescaped.** Data files are authored as plain text; every value passes
through `esc()` at render time, and `build/lib/validate.js` rejects any content containing HTML tags,
markdown syntax, or HTML entities before a page is generated.

### Editing content

- **Page copy** — edit the relevant JSON under `build/data/`, then `npm run build`.
- **Company facts, navigation, footer links** — `build/config.js`.
- **Shared blocks (values, stats, process, FAQs)** — `build/data/company.js`.
- **Adding a service** — add a JSON file to `build/data/services/`, register it in the `services`
  array in `build/config.js`, and pick an icon from `build/lib/icons.js`. The nav, services hub,
  sitemap, and contact-form dropdown all update automatically.
- **Adding a training programme** — the same, with `build/data/academy/programmes/` and the
  `programmes` array in `build/config.academy.js`.
- **The logo** — geometry lives in `build/lib/brand.js`. Edit it there and run `npm run brand`;
  the static SVGs, the favicon, the app icon and both social cards regenerate from it.

The build fails loudly on malformed content — a missing key, a wrong array length, or an unknown
related-service slug is a build error, not a broken page.

---

## Backend

Five submission endpoints, all `POST`, all rate-limited:

| Endpoint | Purpose |
| --- | --- |
| `/api/contact` | Contact page enquiry form |
| `/api/academy-enquiry` | Academy training enquiry form |
| `/api/resource-request` | Resource download requests |
| `/api/careers` | Job applications (multipart, optional CV upload) |
| `/api/newsletter` | Newsletter subscription |
| `/api/health` | Health check (GET) |

Submissions are written to SQLite **and** emailed. If SMTP is unavailable the submission is still
stored and the failure is logged — an email outage never loses an enquiry.

### Security controls

The backend is written to the standard a security firm should hold itself to:

- **CSP without `unsafe-inline`** — the site ships no inline scripts and no inline style attributes,
  so `script-src` and `style-src` stay strict. `npm run check` fails the build if one is introduced.
- **HSTS, `nosniff`, `frame-ancestors 'none'`, restrictive `Permissions-Policy`**, no `X-Powered-By`.
- **Email header injection** — every value used in a mail header has CR/LF stripped first.
- **SQL injection** — all queries are prepared statements; no SQL is built from request data.
- **Path traversal** — the clean-URL handler resolves the candidate path and confirms it is inside
  the served root before any filesystem read. Each host has its own root, so neither site's files
  are reachable on the other's domain.
- **File uploads** — allow-list of PDF/DOC/DOCX by MIME type, 5 MB cap, extension taken from the
  allow-list rather than user input, random filename, magic-byte verification after write, stored
  outside the served directory.
- **Analytics** — Vercel Web Analytics, served from our own origin (`/_vercel/insights/script.js`) so
  `script-src 'self'` still holds and no third-party CDN is introduced. It is cookieless: a visit is counted
  from a hash of the incoming request, discarded after 24 hours, so it sets no device storage and is not
  gated by the cookie notice. `build/data/content/cookie-policy.json` describes it.
- **Spam** — honeypot field plus a minimum time-to-submit. Blocked submissions receive a normal
  success response so a bot cannot detect the filter.
- **Rate limiting** — per-IP, per-endpoint, with the client IP resolved through a configured
  `TRUST_PROXY` depth rather than a spoofable header.
- **Origin checking** — state-changing requests must come from a configured origin.
- **Privacy in logs** — logs record a salted IP hash and event metadata, never submission content.
- **Error handling** — stack traces and internal messages are never returned to the client.

`npm audit` reports zero vulnerabilities.

### Reading submissions

There is deliberately **no web admin panel** — that would add a login surface and a permanent attack
target to a site that otherwise has none. Submissions are read over SSH:

```bash
npm run submissions                      # 50 most recent
npm run submissions -- --kind=careers    # filter by form
npm run submissions -- --format=csv      # CSV export
npm run submissions -- --newsletter      # subscriber list
```

---

## Deployment

### With the bundled server (recommended — forms need a backend)

```bash
npm ci --omit=dev
npm run build
NODE_ENV=production node server/server.js
```

Put nginx or a load balancer in front for TLS, and set `TRUST_PROXY` to the number of proxies in the
chain. Run under a process manager (systemd, PM2) so it restarts on failure.

### As a static site

`public/` can be served by any static host (Netlify, Vercel, S3 + CloudFront, nginx). Configure:

- clean URLs (`/about/` → `/about/index.html`)
- `404.html` as the not-found page
- the security headers listed above, which the Node server otherwise sets

The forms will not work without the backend — point them at a form service or host the API separately.

---

## Company details used on the site

| | |
| --- | --- |
| Phone | +91 90048 57727 |
| Email | info@arysec.in |
| Careers | careers@arysec.in |
| Security reports | security@arysec.in |
| Headquarters | Mumbai, Maharashtra, India |
| Founder | Unnati Shinde, Founder & Managing Partner |
| Team | 50+ certified security professionals |

Change these in `build/config.js` (`company`) and `server/config.js`, then rebuild.

---

## Before going live

These need a decision or a real value from Arysec — the site is otherwise complete.

1. **Have a lawyer review the four legal documents.** `privacy-policy`, `terms-of-service`,
   `cookie-policy`, and `responsible-disclosure` are written to be substantive and accurate, but they
   are not legal advice and have not been reviewed by counsel.
2. **Add the registered office address and LLPIN.** The site currently shows city-level detail only.
   Indian company disclosure norms generally expect the registered address and LLP identification
   number in the footer or contact page.
3. **Confirm the founder bio and team claims** in `build/templates/pages/about.js` — the sector
   experience, the 50+ team size, and the certification list in `build/data/company.js` are stated as
   fact and should be verified by the company before publication.
4. **Confirm the headline statistics** in `build/data/company.js` (`stats`): 250+ engagements and
   15+ industries are placeholders that should reflect real figures.
5. **Set up the mailboxes** `info@`, `careers@`, and `security@` at arysec.in, and configure SMTP
   in `.env`. The responsible disclosure policy publishes `security@arysec.in` as a commitment.
6. **Set `IP_HASH_SALT`** to a long random value so log correlation survives restarts.
7. **Prepare the six downloadable resources** listed on the Resources page — the request form works,
   but the PDFs themselves need writing. Until then, requests arrive as emails to answer manually.
8. **Point the domain at the server** and set `ALLOWED_ORIGINS` to match.

## Notes on content accuracy

Page content was written to a strict spec (`build/data/CONTENT-SPEC.md`) that prohibits inventing
verifiable claims. Specifically, the site does **not** claim any regulatory empanelment, accreditation,
or certification-body status for Arysec; does **not** name any client; and case studies are anonymised
and carry no fabricated metrics — the build actively rejects a case study containing a percentage
figure. Certification language is consistently "we prepare you for" and "we support", because an
accredited certification body issues the certificate, not Arysec.
