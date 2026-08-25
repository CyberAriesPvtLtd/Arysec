'use strict';

/**
 * Brand geometry — the single source of truth for the Arysec logo.
 *
 * Both the inline header/footer lockup (build/templates/layout.js) and the static
 * SVG assets under build/static/assets/ are generated from the paths here, so the
 * mark can never drift between the page and the downloadable files.
 *
 * Coordinate systems:
 *   MARK      viewBox "5 8 110 97"  — the triangular "A"
 *   WORDMARK  viewBox "0 0 544 100" — ARYSEC, cap height 100, baseline at y=100
 *
 * Regenerate the static assets with: npm run brand
 */

/** Gradient stops of the mark, from the supplied artwork. */
const GRADIENT = { from: '#f8430c', to: '#fb9218' };

/** Flat accent used for the bar on the "E" and for the strapline full stops. */
const ACCENT = '#ff6a18';

const INK_DARK = '#16130f';
const INK_LIGHT = '#f7f2ee';
const MUTED_DARK = '#3a322c';
const MUTED_LIGHT = '#c3b8b0';

// ---------------------------------------------------------------------------
// Mark — rounded triangle with a nested "A"
// ---------------------------------------------------------------------------

const MARK = {
  viewBox: '5 8 110 97',
  /** Aspect ratio of the drawn content, for sizing a lockup. */
  ratio: 110 / 97,
  /** Outer ring, stroked so the corners stay round inside and out. */
  ring: 'M69.03 24.57 L104.98 86.62 Q111 97 99 97 L21 97 Q9 97 15.02 86.62 L50.97 24.57 Q60 9 69.03 24.57 Z',
  ringWidth: 15,
  /** Inner "A" whose left leg sweeps out toward the bottom-left corner. */
  inner:
    'M87.96 86.5 L59.92 38.59 Q57.9 35.13 55.94 38.62 L40.14 66.84 L20.86 77.46 ' +
    'L24.14 84.54 L47.86 75.16 L58.1 56.87 L75.45 86.5 Z',
};

/**
 * The mark as SVG markup.
 * @param {string} gradientId  Unique id — several marks can share one document.
 */
function markSvg(gradientId) {
  return (
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${GRADIENT.from}"/><stop offset="1" stop-color="${GRADIENT.to}"/>` +
    `</linearGradient></defs>` +
    `<path d="${MARK.ring}" fill="none" stroke="url(#${gradientId})" stroke-width="${MARK.ringWidth}" stroke-linejoin="round"/>` +
    `<path d="${MARK.inner}" fill="url(#${gradientId})"/>`
  );
}

// ---------------------------------------------------------------------------
// Wordmark — squarish techno construction with 45-degree cut terminals
// ---------------------------------------------------------------------------

const poly = (points) => 'M' + points.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';

/** Per-letter outlines. `accent` marks the orange bar on the "E". */
const GLYPHS = {
  A: {
    width: 94,
    paths: [
      {
        evenodd: true,
        d:
          poly([[0, 100], [38, 0], [56, 0], [94, 100], [73, 100], [64.6, 78], [29.4, 78], [21, 100]]) +
          poly([[47, 31.6], [57.8, 60], [36.2, 60]]),
      },
    ],
  },
  R: {
    width: 78,
    paths: [
      {
        evenodd: true,
        d:
          poly([[0, 0], [62, 0], [78, 16], [78, 40], [64, 56], [78, 100], [56, 100], [44, 56], [20, 56], [20, 100], [0, 100]]) +
          poly([[20, 20], [58, 20], [58, 36], [20, 36]]),
      },
    ],
  },
  Y: {
    width: 78,
    paths: [{ d: poly([[0, 0], [22, 0], [39, 36], [56, 0], [78, 0], [50, 58], [50, 100], [28, 100], [28, 58]]) }],
  },
  S: {
    width: 76,
    paths: [
      { d: poly([[14, 0], [76, 0], [76, 20], [20, 20], [20, 48], [76, 48], [76, 86], [62, 100], [0, 100], [0, 80], [56, 80], [56, 68], [0, 68], [0, 14]]) },
    ],
  },
  E: {
    width: 72,
    paths: [
      { accent: true, d: poly([[0, 0], [58, 0], [72, 14], [72, 20], [0, 20]]) },
      { d: poly([[0, 20], [20, 20], [20, 40], [56, 40], [56, 58], [20, 58], [20, 80], [72, 80], [72, 86], [58, 100], [0, 100]]) },
    ],
  },
  C: {
    width: 76,
    paths: [{ d: poly([[14, 0], [62, 0], [76, 14], [76, 20], [20, 20], [20, 80], [76, 80], [76, 86], [62, 100], [14, 100], [0, 86], [0, 14]]) }],
  },
};

const TRACKING = 14;

/** Total advance width of ARYSEC at cap height 100. */
const WORDMARK_WIDTH = [...'ARYSEC'].reduce((w, ch) => w + GLYPHS[ch].width + TRACKING, 0) - TRACKING;

const WORDMARK = { viewBox: `0 0 ${WORDMARK_WIDTH} 100`, width: WORDMARK_WIDTH, height: 100 };

/**
 * ARYSEC as SVG paths.
 *
 * @param {object}  [options]
 * @param {string}  [options.fill]    Colour of the letterforms. Defaults to
 *                                    `currentColor` so an inline lockup inherits.
 * @param {string}  [options.accent]  Colour of the bar on the "E".
 * @param {string}  [options.className] Class applied to the accent bar, so an
 *                                    inline lockup can theme it from the stylesheet.
 */
function wordmarkSvg({ fill = 'currentColor', accent = ACCENT, accentClass = '' } = {}) {
  let x = 0;
  const out = [];
  for (const ch of 'ARYSEC') {
    const glyph = GLYPHS[ch];
    for (const p of glyph.paths) {
      const attrs = [`d="${p.d}"`];
      if (x) attrs.unshift(`transform="translate(${x} 0)"`);
      if (p.accent && accentClass) attrs.push(`class="${accentClass}"`);
      attrs.push(`fill="${p.accent ? accent : fill}"`);
      if (p.evenodd) attrs.push('fill-rule="evenodd"');
      out.push(`<path ${attrs.join(' ')}/>`);
    }
    x += glyph.width + TRACKING;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// Lockups — the mark, a rule, the wordmark and the strapline
// ---------------------------------------------------------------------------

const STRAPLINE = ['Assess', 'Assure', 'Advance'];

const FONT_STACK = "'Inter', 'Segoe UI', Arial, sans-serif";

/** Strapline as an SVG <text>, with the full stops picked out in the accent. */
function straplineText({ x, y, size, tracking, fill, accent }) {
  const words = STRAPLINE.map(
    (w, i) => `${i ? ' ' : ''}${w}<tspan fill="${accent}">.</tspan>`
  ).join('');
  return (
    `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="500" ` +
    `letter-spacing="${tracking}" fill="${fill}">${words}</text>`
  );
}

/**
 * Horizontal lockup: mark · rule · wordmark over strapline.
 * @param {'dark'|'light'} surface  The background the lockup will sit on.
 */
function horizontalLockup(surface) {
  const onDark = surface === 'dark';
  const ink = onDark ? INK_LIGHT : INK_DARK;
  const muted = onDark ? MUTED_LIGHT : MUTED_DARK;
  const id = `arysecLockup${onDark ? 'D' : 'L'}`;

  // Wordmark drawn at cap height 62, so the mark (97 tall) reads as the anchor.
  const scale = 62 / 100;
  const wordWidth = WORDMARK_WIDTH * scale;
  const wordX = 172;
  const width = Math.round(wordX + wordWidth + 8);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 150" width="${width}" height="150" role="img" aria-label="Arysec — Assess. Assure. Advance.">
  <svg x="8" y="25" width="110" height="97" viewBox="${MARK.viewBox}">${markSvg(id)}</svg>
  <rect x="142" y="30" width="2.5" height="90" rx="1.25" fill="${muted}" fill-opacity="${onDark ? 0.35 : 0.4}"/>
  <g transform="translate(${wordX} 28) scale(${scale})">${wordmarkSvg({ fill: ink })}</g>
  ${straplineText({ x: wordX + 2, y: 126, size: 19, tracking: 2.2, fill: muted, accent: ACCENT })}
</svg>
`;
}

/**
 * Vertical lockup: mark above the wordmark and strapline, centred.
 * @param {'dark'|'light'} surface
 */
function stackedLockup(surface) {
  const onDark = surface === 'dark';
  const ink = onDark ? INK_LIGHT : INK_DARK;
  const muted = onDark ? MUTED_LIGHT : MUTED_DARK;
  const id = `arysecStack${onDark ? 'D' : 'L'}`;

  const scale = 74 / 100;
  const wordWidth = WORDMARK_WIDTH * scale;
  const width = Math.round(wordWidth + 80);
  const centre = width / 2;
  const markWidth = 200;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 344" width="${width}" height="344" role="img" aria-label="Arysec — Assess. Assure. Advance.">
  <svg x="${centre - markWidth / 2}" y="24" width="${markWidth}" height="${Math.round(markWidth / MARK.ratio)}" viewBox="${MARK.viewBox}">${markSvg(id)}</svg>
  <g transform="translate(${centre - wordWidth / 2} 224) scale(${scale})">${wordmarkSvg({ fill: ink })}</g>
  <g text-anchor="middle">
    ${straplineText({ x: centre, y: 330, size: 23, tracking: 2.6, fill: muted, accent: ACCENT })}
  </g>
</svg>
`;
}

/** Square app-icon / favicon tile. */
function iconTile(size, radius, background) {
  const inset = Math.round(size * 0.18);
  const markWidth = size - inset * 2;
  const markHeight = Math.round(markWidth / MARK.ratio);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>
  <svg x="${inset}" y="${Math.round((size - markHeight) / 2)}" width="${markWidth}" height="${markHeight}" viewBox="${MARK.viewBox}">${markSvg('arysecTile' + size)}</svg>
</svg>
`;
}

module.exports = {
  GRADIENT,
  ACCENT,
  INK_DARK,
  INK_LIGHT,
  MUTED_DARK,
  MUTED_LIGHT,
  MARK,
  WORDMARK,
  STRAPLINE,
  markSvg,
  wordmarkSvg,
  straplineText,
  horizontalLockup,
  stackedLockup,
  iconTile,
};
