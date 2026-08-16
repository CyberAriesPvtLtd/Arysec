'use strict';

/**
 * HTML escaping and small rendering helpers.
 *
 * Every value that originates from build/data/ is authored as plain text and MUST pass
 * through esc() before it reaches the output. The templates never interpolate raw data.
 */

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for interpolation into HTML element content or a double-quoted attribute. */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Escape a string for embedding inside a <script> JSON block (blocks </script> breakout). */
function escJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** Join template fragments, dropping null/undefined/false so conditionals read cleanly. */
function join(parts, separator) {
  return parts.filter((p) => p !== null && p !== undefined && p !== false && p !== '').join(
    separator === undefined ? '\n' : separator
  );
}

/** Map an array to HTML fragments and join them. */
function each(items, fn, separator) {
  if (!Array.isArray(items)) return '';
  return join(items.map(fn), separator);
}

/** Render a <ul> of escaped strings with the given class. */
function list(items, className) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<ul class="${esc(className)}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

/** Render paragraphs from an array of plain-text strings. */
function paragraphs(items, className) {
  if (!Array.isArray(items) || !items.length) return '';
  const cls = className ? ` class="${esc(className)}"` : '';
  return items.map((p) => `<p${cls}>${esc(p)}</p>`).join('\n');
}

/**
 * Reveal-animation helper. Returns the class string for a scroll-reveal element,
 * cycling the stagger delay across a row of `columns` items.
 */
function reveal(index, columns) {
  if (index === undefined) return 'reveal';
  const step = (index % (columns || 3));
  return step === 0 ? 'reveal' : `reveal delay-${step}`;
}

/** Trim and collapse whitespace — used for meta descriptions and titles. */
function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

module.exports = { esc, escJson, join, each, list, paragraphs, reveal, oneLine };
