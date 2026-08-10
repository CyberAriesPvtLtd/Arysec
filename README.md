# Arysec Technologies LLP — Company Website

Professional, responsive marketing website for **Arysec Technologies LLP**, an IT and IT security services firm.

## Overview

A fast, dependency-free static site built with plain HTML, CSS, and JavaScript. No build step required.

### Sections

- **Home** — hero with value proposition, calls to action, and animated key stats
- **About Us** — company overview and core values (reliability, innovation, expert support, integrity)
- **Services** — all nine service offerings, from cybersecurity consulting to IT infrastructure management
- **Solutions** — engagement models for growing businesses, enterprises, and regulated industries
- **Resources** — guides, checklists, and whitepapers
- **Contact** — contact details and inquiry form

### Features

- Custom SVG logo and favicon (hexagonal shield with circuit-style "A" monogram)
- Smooth, subtle animations: scroll-reveal, animated counters, hover micro-interactions
- Fully responsive layout with a mobile navigation menu
- Respects `prefers-reduced-motion` for accessibility
- Semantic HTML with ARIA attributes

## Project Structure

```
├── index.html          # Single-page site with all sections
├── css/styles.css      # All styling, animations, and responsive rules
├── js/main.js          # Navigation, scroll reveal, counters, form handling
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

## Notes

- The contact form is a client-side demo; wire it to a backend or form service (e.g. Formspree) for production.
- Placeholder contact details (email, phone, address) should be replaced with real company information before launch.
