'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { config } = require('../config');

let db = null;

/**
 * Open (and migrate) the submissions database.
 *
 * Every write goes through a prepared statement — no SQL is ever built by
 * concatenating request data.
 */
function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  db = new Database(config.dbFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      kind         TEXT    NOT NULL,
      name         TEXT,
      email        TEXT,
      phone        TEXT,
      company      TEXT,
      subject      TEXT,
      message      TEXT,
      link         TEXT,
      attachment   TEXT,
      consent      INTEGER NOT NULL DEFAULT 0,
      ip_hash      TEXT,
      user_agent   TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      notified     INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_kind    ON submissions(kind);
    CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at);

    CREATE TABLE IF NOT EXISTS newsletter (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT    NOT NULL UNIQUE,
      ip_hash     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      unsubscribed_at TEXT
    );
  `);

  return db;
}

const insertSubmission = (payload) =>
  getDb()
    .prepare(
      `INSERT INTO submissions
        (kind, name, email, phone, company, subject, message, link, attachment, consent, ip_hash, user_agent)
       VALUES
        (@kind, @name, @email, @phone, @company, @subject, @message, @link, @attachment, @consent, @ipHash, @userAgent)`
    )
    .run({
      kind: payload.kind,
      name: payload.name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      company: payload.company || null,
      subject: payload.subject || null,
      message: payload.message || null,
      link: payload.link || null,
      attachment: payload.attachment || null,
      consent: payload.consent ? 1 : 0,
      ipHash: payload.ipHash || null,
      userAgent: payload.userAgent || null,
    });

const markNotified = (id) =>
  getDb().prepare('UPDATE submissions SET notified = 1 WHERE id = ?').run(id);

/** Idempotent newsletter subscribe. Re-subscribing clears an earlier unsubscribe. */
const subscribeNewsletter = (email, ipHash) =>
  getDb()
    .prepare(
      `INSERT INTO newsletter (email, ip_hash) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET unsubscribed_at = NULL`
    )
    .run(email, ipHash || null);

const listSubmissions = (kind, limit) => {
  const sql = kind
    ? 'SELECT * FROM submissions WHERE kind = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM submissions ORDER BY created_at DESC LIMIT ?';
  const stmt = getDb().prepare(sql);
  return kind ? stmt.all(kind, limit) : stmt.all(limit);
};

const listNewsletter = () =>
  getDb().prepare('SELECT * FROM newsletter WHERE unsubscribed_at IS NULL ORDER BY created_at DESC').all();

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  closeDb,
  insertSubmission,
  markNotified,
  subscribeNewsletter,
  listSubmissions,
  listNewsletter,
};
