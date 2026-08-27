/**
 * Vercel Routing Middleware — maps academy.arysec.in onto public/academy/.
 *
 * vercel.json's `rewrites` are evaluated AFTER static-file resolution, so a rewrite
 * is skipped whenever a matching file already exists at the un-rewritten path. Main
 * and academy share one flat public/ output directory (see build/build.js), so every
 * top-level path both sites use — /, /contact/, /robots.txt, /sitemap.xml,
 * /site.webmanifest, /404.html, /assets/og-image.* — collided, and the main site's
 * file won under the old rewrite-only setup: academy.arysec.in silently served
 * Arysec Consultancy LLP's homepage and contact page instead of the Academy's.
 *
 * Middleware runs before that static resolution, so it is the only place this
 * host-to-directory mapping can live reliably. See DEPLOYMENT.md's Vercel section.
 */

import { rewrite, next } from '@vercel/functions';

const ACADEMY_HOSTS = new Set(['academy.arysec.in']);

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  if (!ACADEMY_HOSTS.has(host)) return next();

  const url = new URL(request.url);

  // /api/* is routed to the Express function by vercel.json's own rewrite —
  // leave it alone so it isn't prefixed into a path nothing serves.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return next();

  // Vercel's own analytics script origin. Prefixing it would 404 the insights script.
  if (url.pathname.startsWith('/_vercel/')) return next();

  // Already under /academy/ — don't double-prefix (shouldn't normally occur for this
  // host, but avoids a broken path if it ever does).
  if (url.pathname === '/academy' || url.pathname.startsWith('/academy/')) return next();

  url.pathname = '/academy' + url.pathname;
  return rewrite(url);
}
