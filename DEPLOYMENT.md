# Deployment Guide

Practical steps to get the Arysec Consultancy LLP website into production. Assumes Ubuntu/Debian
with a domain pointing at the server.

---

## 1. Prerequisites

- Node.js 18 or newer (20 LTS recommended)
- A reverse proxy for TLS — nginx below, but Caddy or a cloud load balancer work equally well
- SMTP credentials for sending notification email
- DNS `A`/`AAAA` records for `arysec.in`, `www.arysec.in` and `academy.arysec.in`

---

## 2. Install

```bash
sudo adduser --system --group --home /srv/arysec arysec
sudo -u arysec git clone <repository-url> /srv/arysec/site
cd /srv/arysec/site

sudo -u arysec npm ci --omit=dev
sudo -u arysec cp .env.example .env
sudo -u arysec chmod 600 .env
```

Edit `.env`. The values that matter most:

```ini
NODE_ENV=production
PORT=3000
TRUST_PROXY=1                                       # 1 behind a single nginx
ALLOWED_ORIGINS=https://www.arysec.in,https://arysec.in,https://academy.arysec.in

ACADEMY_HOSTS=academy.arysec.in                     # served from public/academy/
ACADEMY_ORIGIN=https://academy.arysec.in
SITE_HOSTS=www.arysec.in,arysec.in                  # these redirect /academy/ away

SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_TO=info@arysec.in
MAIL_CAREERS_TO=careers@arysec.in
MAIL_ACADEMY_TO=                                    # falls back to MAIL_TO

IP_HASH_SALT=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

`TRUST_PROXY` must match the real number of proxies in front of the app. Set it too high and a client
can spoof `X-Forwarded-For` to evade rate limiting; too low and every request looks like it came from
the proxy, so one visitor's flood blocks everyone.

Build and smoke-test:

```bash
sudo -u arysec npm run build
sudo -u arysec npm run check      # link, anchor, metadata and CSP verification
sudo -u arysec npm test
```

---

## 3. Run under systemd

`/etc/systemd/system/arysec.service`:

```ini
[Unit]
Description=Arysec Consultancy website
After=network.target

[Service]
Type=simple
User=arysec
Group=arysec
WorkingDirectory=/srv/arysec/site
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

# Hardening — the process only needs to write its own data and upload directories.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
ReadWritePaths=/srv/arysec/site/server/data /srv/arysec/site/server/uploads

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now arysec
sudo systemctl status arysec
journalctl -u arysec -f          # logs are line-delimited JSON
```

---

## 4. nginx and TLS

`/etc/nginx/sites-available/arysec`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name arysec.in www.arysec.in;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://www.arysec.in$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name arysec.in;
    ssl_certificate     /etc/letsencrypt/live/arysec.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arysec.in/privkey.pem;
    return 301 https://www.arysec.in$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.arysec.in;

    ssl_certificate     /etc/letsencrypt/live/arysec.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arysec.in/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Uploads are capped at 5 MB by the app; stop larger bodies at the edge.
    client_max_body_size 6m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

The application sets its own security headers (CSP, HSTS, `nosniff`, `frame-ancestors`), so nginx
does not need to add them. If you add them anyway, do not duplicate the CSP — two policies intersect
and will likely break the site.

The academy subdomain proxies to the same application. The app picks the site by
`Host`, so nothing changes here except the certificate and the name:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name academy.arysec.in;

    ssl_certificate     /etc/letsencrypt/live/arysec.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arysec.in/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;   # the app routes on this
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

`proxy_set_header Host $host` matters: the application reads the Host header to
decide which site to serve. Rewriting it to a fixed value would serve the main
site on the subdomain.

Add `academy.arysec.in` to the port 80 block's `server_name` as well, so ACME
challenges reach the same webroot.

```bash
sudo ln -s /etc/nginx/sites-available/arysec /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d arysec.in -d www.arysec.in -d academy.arysec.in
```

---

## 5. Verify

```bash
curl -sI https://www.arysec.in/ | head -20            # 200 + security headers
curl -s  https://www.arysec.in/api/health             # {"ok":true,...}
curl -sI https://www.arysec.in/about | grep -i location # 301 to /about/
curl -s  https://www.arysec.in/does-not-exist -o /dev/null -w '%{http_code}\n'   # 404
curl -s  https://www.arysec.in/sitemap.xml | head -5
curl -s  https://www.arysec.in/.well-known/security.txt

# Academy subdomain
curl -sI https://academy.arysec.in/ | head -20                       # 200
curl -s  https://academy.arysec.in/ | grep -o 'canonical[^>]*'       # academy.arysec.in
curl -sI https://www.arysec.in/academy/ | grep -i location           # 301 to the subdomain
curl -s  https://academy.arysec.in/robots.txt                        # its own sitemap line
curl -s  https://academy.arysec.in/programmes/ -o /dev/null -w '%{http_code}\n'   # 200
curl -s  https://www.arysec.in/programmes/  -o /dev/null -w '%{http_code}\n'      # 404
```

Then submit the contact form once and confirm the email arrives and the row is stored:

```bash
sudo -u arysec npm run submissions
```

Worth running against the live site: [Mozilla Observatory](https://observatory.mozilla.org/),
[SSL Labs](https://www.ssllabs.com/ssltest/), and Lighthouse.

---

## 5a. Vercel

`vercel.json` carries the same routing for the Vercel deployment, where there is
no nginx in front:

- `academy.arysec.in/*` is rewritten to `/academy/*`, so the subdomain serves the
  academy build from its own root.
- `/academy/*` on `www.arysec.in` and `arysec.in` is redirected to
  `https://academy.arysec.in/*`.

The redirect is scoped to those two hosts on purpose. Preview deployments serve
`/academy/...` in place, because the subdomain does not resolve there and
bouncing to it would make the academy impossible to review.

The sources are written as `/academy/(.*)` with a `$1` destination rather than
`/academy/:path*`. The named form does not match a path ending in a slash, so it
silently missed every real page URL on this site — every canonical URL here ends
in a trailing slash. Verify after any change to these rules:

```bash
curl -sI https://www.arysec.in/academy/programmes/ | grep -i location   # 308 to the subdomain
```

Two things have to be done in the Vercel dashboard once, because they are not
expressible in `vercel.json`:

1. Add `academy.arysec.in` as a domain on the project.
2. Point the DNS record for it at Vercel as the dashboard instructs.

Until the domain is attached, the rewrite has no host to match and the academy is
only reachable through the redirect from the main domain.

---

## 5b. Asset caching

`css/styles.css` and `js/main.js` are content-hashed at build time — the output
is `styles.<hash>.css` and `main.<hash>.js`, referenced from the always-revalidated
HTML. A rebuild therefore takes effect the moment the HTML is refetched, and the
assets themselves are served `immutable` for a year.

This matters: with fixed names, a visitor who had loaded the site kept serving
the previous stylesheet from their own browser cache for hours after a deploy,
so a redesign arrived as new markup styled by the old CSS. Do not reintroduce
fixed names for these two files.

```bash
curl -s https://www.arysec.in/ | grep -o 'href="/css/[^"]*"'    # a hashed name
curl -sI https://www.arysec.in/css/styles.<hash>.css | grep -i cache-control
```

---

## 6. Updating content

```bash
cd /srv/arysec/site
sudo -u arysec git pull
sudo -u arysec npm ci --omit=dev
sudo -u arysec npm run check       # build + verify; fails loudly on bad content
sudo systemctl restart arysec
```

The server reads `public/` from disk on each request, so a content-only change needs no restart —
but restarting is harmless and keeps the process and the build in step.

---

## 7. Backups

Two things carry data that cannot be regenerated:

- `server/data/submissions.db` — enquiries, applications, newsletter subscribers
- `server/uploads/` — submitted CVs

Both contain personal data. Encrypt backups, restrict access, and set a retention period consistent
with the published privacy policy.

```bash
# /etc/cron.daily/arysec-backup
#!/bin/sh
set -e
DEST=/var/backups/arysec
mkdir -p "$DEST"
sqlite3 /srv/arysec/site/server/data/submissions.db ".backup '$DEST/submissions-$(date +%F).db'"
tar czf "$DEST/uploads-$(date +%F).tar.gz" -C /srv/arysec/site/server uploads
find "$DEST" -type f -mtime +30 -delete
```

Use `.backup` rather than copying the file — the database runs in WAL mode and a plain copy can
capture a torn state.

---

## 8. Static-only alternative

To host `public/` on a CDN without the Node backend, note that **the forms will stop working** unless
you point them elsewhere. Change `data-endpoint` on each form in `build/templates/pages/` to a form
service, rebuild, then configure the host for:

- clean URLs (`/about/` → `/about/index.html`)
- `404.html` as the not-found document
- the security headers the Node server would otherwise set (see `server/middleware/security.js`)

Netlify `_headers` equivalent:

```
/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; manifest-src 'self'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

Fonts are self-hosted (`/assets/fonts/`), so the policy contains no third-party origin at all.
