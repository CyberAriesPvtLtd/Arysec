#!/usr/bin/env node
'use strict';

/**
 * Export form submissions from the local database.
 *
 * Deliberately a CLI tool rather than a web admin panel: an authenticated admin UI
 * would add a login surface, session handling, and a permanent attack target to a
 * site that otherwise has none. Reading submissions requires shell access to the box.
 *
 *   node scripts/export-submissions.js                    # 50 most recent, table
 *   node scripts/export-submissions.js --kind=contact     # filter by form (contact, academy, resource, careers)
 *   node scripts/export-submissions.js --format=csv       # CSV to stdout
 *   node scripts/export-submissions.js --newsletter       # newsletter list
 */

const { listSubmissions, listNewsletter, closeDb } = require('../server/lib/db');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
};
const has = (name) => args.includes(`--${name}`);

const KINDS = ['contact', 'academy', 'resource', 'careers'];

/** RFC 4180 quoting, plus a leading apostrophe on anything a spreadsheet would treat
 *  as a formula — an exported CSV opened in Excel must not execute cell content. */
function csvCell(value) {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(rows, columns) {
  const lines = [columns.map(csvCell).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => csvCell(row[c])).join(',')));
  return lines.join('\n');
}

function truncate(value, length) {
  const str = value === null || value === undefined ? '' : String(value).replace(/\s+/g, ' ');
  return str.length > length ? str.slice(0, length - 1) + '…' : str;
}

function main() {
  if (has('help')) {
    process.stdout.write(
      [
        'Usage: node scripts/export-submissions.js [options]',
        '',
        '  --kind=<contact|academy|resource|careers>  filter by form type',
        '  --limit=<n>                        max rows (default 50)',
        '  --format=<table|csv|json>          output format (default table)',
        '  --newsletter                       list newsletter subscribers instead',
        '  --help                             show this message',
        '',
      ].join('\n')
    );
    return;
  }

  const format = flag('format', 'table');

  if (has('newsletter')) {
    const rows = listNewsletter();
    if (format === 'csv') process.stdout.write(toCsv(rows, ['id', 'email', 'created_at']) + '\n');
    else if (format === 'json') process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    else {
      process.stdout.write(`\n${rows.length} newsletter subscriber(s)\n\n`);
      rows.forEach((r) => process.stdout.write(`  ${r.created_at}  ${r.email}\n`));
      process.stdout.write('\n');
    }
    return;
  }

  const kind = flag('kind', null);
  if (kind && !KINDS.includes(kind)) {
    process.stderr.write(`Unknown kind "${kind}". Expected one of: ${KINDS.join(', ')}\n`);
    process.exitCode = 1;
    return;
  }

  const limit = Math.max(1, Math.min(parseInt(flag('limit', '50'), 10) || 50, 1000));
  const rows = listSubmissions(kind, limit);

  if (format === 'csv') {
    process.stdout.write(
      toCsv(rows, [
        'id', 'kind', 'created_at', 'name', 'email', 'phone', 'company',
        'subject', 'message', 'link', 'attachment', 'consent', 'notified',
      ]) + '\n'
    );
    return;
  }

  if (format === 'json') {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return;
  }

  if (!rows.length) {
    process.stdout.write('\nNo submissions found.\n\n');
    return;
  }

  process.stdout.write(`\n${rows.length} submission(s)${kind ? ` of kind "${kind}"` : ''}\n\n`);
  rows.forEach((r) => {
    process.stdout.write(
      `  #${String(r.id).padEnd(5)} ${r.created_at}  ${r.kind.padEnd(9)} ` +
        `${truncate(r.name, 22).padEnd(23)} ${truncate(r.email, 30).padEnd(31)} ` +
        `${r.notified ? 'emailed' : 'PENDING'}\n` +
        `         subject: ${truncate(r.subject, 90)}\n` +
        (r.message ? `         message: ${truncate(r.message, 90)}\n` : '') +
        (r.attachment ? `         file:    ${r.attachment}\n` : '') +
        '\n'
    );
  });
  process.stdout.write('Use --format=csv or --format=json for full content.\n\n');
}

try {
  main();
} finally {
  closeDb();
}
