'use strict';

/**
 * Inline SVG icon set. Every icon is a 24x24 viewBox drawn with `currentColor`
 * so it inherits the surrounding text colour, and is marked aria-hidden because
 * icons here are always paired with a visible text label.
 */

const PATHS = {
  'shield-check':
    '<path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M9 11.5l2 2 4-4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

  'shield-search':
    '<path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<circle cx="11.3" cy="10.6" r="2.7" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M13.4 12.8L15.6 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  'user-lock':
    '<rect x="4" y="9" width="16" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 9V6.5a4 4 0 018 0V9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="14.5" r="1.6" fill="currentColor"/>',

  'clipboard-check':
    '<path d="M9 3h6l1 3h4v15H4V6h4l1-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M8 13l2.5 2.5L16 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

  certificate:
    '<rect x="4" y="3" width="16" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 7.5h8M8 11h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M9 16v5l3-1.8 3 1.8v-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',

  'badge-check':
    '<path d="M12 2.5l2.4 1.8 3-.2.6 2.9 2.4 1.8-1.3 2.7 1.3 2.7-2.4 1.8-.6 2.9-3-.2L12 20.5l-2.4-1.8-3 .2-.6-2.9L3.6 14.2 4.9 11.5 3.6 8.8l2.4-1.8.6-2.9 3 .2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M9 11.6l2.1 2.1L15.2 9.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

  bug:
    '<rect x="8" y="8" width="8" height="11" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M9.5 8V6.8a2.5 2.5 0 015 0V8" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 11.5H4.5M16 11.5H19.5M8 15.5H4.5M16 15.5H19.5M9 8.5L6.5 6M15 8.5L17.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  network:
    '<circle cx="5" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="19" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="19" cy="19" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M7 11l10-5M7 13l10 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  cloud:
    '<path d="M7 18a4.5 4.5 0 01-.6-8.96A6 6 0 0118 8.5 4 4 0 0117.5 18H7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M10 14.5h4M12 12.8v-1.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  'database-lock':
    '<ellipse cx="12" cy="5.5" rx="7" ry="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M5 5.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M5 11.5v6c0 1.5 2.4 2.6 5.6 2.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<rect x="13" y="16" width="7" height="5.4" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M14.8 16v-1.4a1.7 1.7 0 013.4 0V16" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  siren:
    '<path d="M12 3v3.5M12 3l-2 2M12 3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M5 20a7 7 0 0114 0z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M3 20h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M12 10.5a4 4 0 00-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  users:
    '<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="16.5" cy="5.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M16 9.5c1.8.4 3.4 2 3.9 4.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M7 9l2.5 2.5L7 14M12.5 13.5H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

  code:
    '<path d="M8 6l-5 6 5 6M16 6l5 6-5 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M13.5 4l-3 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  server:
    '<rect x="3" y="4" width="18" height="5.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<rect x="3" y="14.5" width="18" height="5.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="6.5" cy="6.75" r="0.9" fill="currentColor"/>' +
    '<circle cx="6.5" cy="17.25" r="0.9" fill="currentColor"/>' +
    '<path d="M12 9.5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  mail:
    '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',

  phone:
    '<path d="M6 3h4l1.5 5-2.5 2a13 13 0 005 5l2-2.5 5 1.5v4a2 2 0 01-2 2A17 17 0 014 5a2 2 0 012-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',

  pin:
    '<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',

  clock:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',

  globe:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M3 12h18M12 3c2.5 2.6 2.5 15 0 18M12 3c-2.5 2.6-2.5 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/>',

  lightbulb:
    '<path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M10 20h4M11 22h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',

  'check-square':
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M7.5 12l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',

  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M3 12h18" stroke="currentColor" stroke-width="1.6"/>',

  book:
    '<path d="M4 4.5A1.5 1.5 0 015.5 3H19v15H5.5A1.5 1.5 0 004 19.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M4 19.5A1.5 1.5 0 015.5 18H19v3H5.5A1.5 1.5 0 014 19.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',

  scale:
    '<path d="M12 4v16M7 20h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M5 7h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M5 7l-2.5 5.5h5zM19 7l-2.5 5.5h5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',

  target:
    '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="1.4" fill="currentColor"/>',

  handshake:
    '<path d="M3 11l3-3 4 1 2-1 2 1 4-1 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M6.5 11.5l3.5 3.5 1.5-1.5 2 2 1.5-1.5 2 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
};

/**
 * Render an icon. Returns an empty string for an unknown key rather than throwing,
 * but the build validates icon keys up front so that never reaches production.
 */
function icon(name, className) {
  const path = PATHS[name];
  if (!path) return '';
  const cls = className ? ` class="${className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
}

function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(PATHS, name);
}

module.exports = { icon, hasIcon, ICON_NAMES: Object.keys(PATHS) };
