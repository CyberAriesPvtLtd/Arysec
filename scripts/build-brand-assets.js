#!/usr/bin/env node
'use strict';

/**
 * Regenerate the static brand assets from build/lib/brand.js.
 *
 * The logo geometry lives in one module; this script writes it out as the files
 * the site and third parties consume, so the mark can never drift between the
 * inline header lockup and the downloadable assets.
 *
 *   node scripts/build-brand-assets.js
 *
 * The two PNGs (logo-512.png for schema.org, og-image.png for social cards) are
 * rasterised from the SVGs with headless Chromium when one is available. Set
 * CHROME to point at a binary, or skip them — the committed PNGs stay in place.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const brand = require('../build/lib/brand');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'build', 'static', 'assets');
const ACADEMY_ASSETS = path.join(ROOT, 'build', 'static-academy', 'assets');

const SURFACE_DARK = '#12100e';

// ---------------------------------------------------------------------------
// SVG assets
// ---------------------------------------------------------------------------

const files = {
  'logo.svg': brand.horizontalLockup('dark'),
  'logo-on-light.svg': brand.horizontalLockup('light'),
  'logo-stacked.svg': brand.stackedLockup('dark'),
  'logo-stacked-on-light.svg': brand.stackedLockup('light'),
  'favicon.svg': brand.iconTile(64, 14, SURFACE_DARK),
  'og-image.svg': socialCard(),
};

/** Academy-specific overrides, copied over the shared assets for that site. */
const academyFiles = {
  'og-image.svg': socialCard('academy'),
};

/** 1200x630 social card: lockup, headline, service line and an accent rule. */
function socialCard(site) {
  const academy = site === 'academy';
  const scale = 0.66;
  const wordWidth = brand.WORDMARK.width * scale;
  const copy = academy
    ? {
        label: 'Academy',
        aria: 'Arysec Academy — Cybersecurity Training and Certification',
        line1: 'Train the People.',
        line2: 'Reduce the Risk.',
        services:
          'Security Awareness  ·  Phishing Drills  ·  ISO 27001  ·  DPDP  ·  Secure Coding  ·  IR Exercises',
        footer: 'academy.arysec.in  ·  On-site across India and live online',
      }
    : {
        label: null,
        aria: 'Arysec — IT and Cybersecurity Services',
        line1: 'Secure Technology.',
        line2: 'Confident Business.',
        services: 'IT & Cybersecurity Services  ·  vCISO  ·  DPO  ·  Audit  ·  VAPT  ·  Managed IT',
        footer: 'Mumbai, India  ·  Serving clients across India and worldwide',
      };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${copy.aria}">
  <defs>
    <linearGradient id="ogAccent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand.GRADIENT.from}"/><stop offset="1" stop-color="${brand.GRADIENT.to}"/>
    </linearGradient>
    <radialGradient id="ogGlow" cx="50%" cy="0%" r="75%">
      <stop offset="0" stop-color="${brand.ACCENT}" stop-opacity="0.24"/>
      <stop offset="1" stop-color="${brand.ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="ogGrid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" fill="none" stroke="${brand.ACCENT}" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="${SURFACE_DARK}"/>
  <rect width="1200" height="630" fill="url(#ogGrid)"/>
  <rect width="1200" height="630" fill="url(#ogGlow)"/>

  <svg x="88" y="150" width="132" height="116" viewBox="${brand.MARK.viewBox}">${brand.markSvg('ogMark')}</svg>
  <rect x="248" y="155" width="3" height="106" rx="1.5" fill="${brand.MUTED_LIGHT}" fill-opacity="0.32"/>
  <g transform="translate(284 156) scale(${scale})">${brand.wordmarkSvg({ fill: brand.INK_LIGHT })}</g>
  ${
    copy.label
      ? `<text x="${284 + wordWidth + 22}" y="222" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5" fill="${brand.ACCENT}">${copy.label.toUpperCase()}</text>`
      : ''
  }
  ${brand.straplineText({ x: 286, y: 260, size: 21, tracking: 2.4, fill: brand.MUTED_LIGHT, accent: brand.ACCENT })}

  <text x="88" y="392" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="62" font-weight="800" fill="${brand.INK_LIGHT}">${copy.line1}</text>
  <text x="88" y="466" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="62" font-weight="800" fill="url(#ogAccent)">${copy.line2}</text>

  <text x="88" y="530" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="24" font-weight="500" fill="${brand.MUTED_LIGHT}">${copy.services}</text>
  <text x="88" y="572" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="22" font-weight="500" fill="#968a82">${copy.footer}</text>

  <rect x="0" y="618" width="1200" height="12" fill="url(#ogAccent)"/>
</svg>
`;
}

for (const [name, contents] of Object.entries(files)) {
  fs.writeFileSync(path.join(ASSETS, name), contents, 'utf8');
  console.log(`wrote assets/${name}`);
}
fs.mkdirSync(ACADEMY_ASSETS, { recursive: true });
for (const [name, contents] of Object.entries(academyFiles)) {
  fs.writeFileSync(path.join(ACADEMY_ASSETS, name), contents, 'utf8');
  console.log(`wrote static-academy/assets/${name}`);
}

// ---------------------------------------------------------------------------
// PNG rasters
// ---------------------------------------------------------------------------

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c));
}

/**
 * Chromium's headless viewport can come up a few pixels short of --window-size,
 * which silently clips the bottom of a full-bleed render. Shoot tall and crop
 * back to the exact size instead.
 */
function shoot(chrome, html, out, width, height) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arysec-brand-'));
  const page = path.join(dir, 'page.html');
  const shotFile = path.join(dir, 'shot.png');
  fs.writeFileSync(page, html, 'utf8');
  execFileSync(chrome, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--allow-file-access-from-files', '--force-device-scale-factor=1',
    '--virtual-time-budget=8000',
    `--screenshot=${shotFile}`, `--window-size=${width},${height + 200}`, page,
  ], { stdio: 'ignore' });
  crop(shotFile, out, width, height);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`wrote ${path.relative(ROOT, out).replace(/\\/g, '/')}`);
}

/** Minimal PNG crop: decode, take the top-left w x h, re-encode as RGB. */
function crop(src, dest, w, h) {
  const zlib = require('zlib');
  const data = fs.readFileSync(src);
  let pos = 8;
  const idat = [];
  let sw, sh, colourType;
  while (pos < data.length) {
    const len = data.readUInt32BE(pos);
    const type = data.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      sw = data.readUInt32BE(pos + 8);
      sh = data.readUInt32BE(pos + 12);
      colourType = data[pos + 17];
    }
    if (type === 'IDAT') idat.push(data.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colourType];
  const stride = sw * channels;
  const pixels = Buffer.alloc(sh * stride);
  let i = 0;
  for (let y = 0; y < sh; y++) {
    const filter = raw[i++];
    const line = raw.subarray(i, i + stride);
    i += stride;
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  const outRaw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    outRaw[rowStart] = 0;
    for (let x = 0; x < w; x++) {
      const from = y * stride + x * channels;
      const to = rowStart + 1 + x * 3;
      outRaw[to] = pixels[from];
      outRaw[to + 1] = pixels[from + 1];
      outRaw[to + 2] = pixels[from + 2];
    }
  }
  const chunk = (type, body) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(body.length);
    const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(typed) : crc32(typed));
    return Buffer.concat([head, typed, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(dest, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(outRaw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

/** CRC-32, for Node builds without zlib.crc32. */
let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const chrome = findChrome();
if (!chrome) {
  console.log('\nNo Chromium found — skipped logo-512.png and og-image.png.');
  console.log('Set CHROME=/path/to/chrome and re-run to regenerate them.');
  process.exit(0);
}

const fontUrl = 'file://' + path.join(ASSETS, 'fonts', 'inter-latin.woff2');
const page = (body, background) => `<!doctype html><html><head><style>
@font-face{font-family:'Inter';font-style:normal;font-weight:400 800;font-display:block;src:url('${fontUrl}') format('woff2');}
html,body{margin:0;padding:0;background:${background}}svg{display:block}
</style></head><body>${body}</body></html>`;

shoot(chrome, page(brand.iconTile(512, 112, SURFACE_DARK), SURFACE_DARK),
  path.join(ASSETS, 'logo-512.png'), 512, 512);
shoot(chrome, page(files['og-image.svg'], SURFACE_DARK),
  path.join(ASSETS, 'og-image.png'), 1200, 630);
shoot(chrome, page(academyFiles['og-image.svg'], SURFACE_DARK),
  path.join(ACADEMY_ASSETS, 'og-image.png'), 1200, 630);
