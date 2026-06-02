const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'gandalf.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    completed   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    source      TEXT    NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS chores_rota (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT    NOT NULL,
    day_of_week INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    UNIQUE(type, day_of_week)
  );

  CREATE TABLE IF NOT EXISTS chores_log (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    type           TEXT    NOT NULL,
    scheduled_date TEXT    NOT NULL,
    done_at        TEXT,
    UNIQUE(type, scheduled_date)
  );

  CREATE TABLE IF NOT EXISTS appliances (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    emoji            TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'empty',
    started_at       TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60
  );
`);

// Always apply the canonical rota so edits here take effect on next restart.
// Sunday (0) is a rest day — no row means no chores that day.
const _upsertRota = db.prepare('INSERT OR REPLACE INTO chores_rota (type, day_of_week, title) VALUES (?, ?, ?)');
const _clearDay   = db.prepare('DELETE FROM chores_rota WHERE day_of_week = ?');

db.transaction(() => {
  _clearDay.run(0); // Sunday — rest day

  //          type     day  title
  _upsertRota.run('main',  1, 'Put laundry on');
  _upsertRota.run('main',  2, 'Hoover downstairs');
  _upsertRota.run('main',  3, 'Mop kitchen & hallway');
  _upsertRota.run('main',  4, 'Hoover upstairs');
  _upsertRota.run('main',  5, 'Clean bathrooms');
  _upsertRota.run('main',  6, 'Tidy living room');

  _upsertRota.run('small', 1, 'Wipe kitchen counters');
  _upsertRota.run('small', 2, 'Fold & put away laundry');
  _upsertRota.run('small', 3, 'Wipe hob & microwave');
  _upsertRota.run('small', 4, 'Clean mirrors');
  _upsertRota.run('small', 5, 'Change bed linen');
  _upsertRota.run('small', 6, 'Take out bins');
})();

// Seed appliances once
const applianceCount = db.prepare('SELECT COUNT(*) AS n FROM appliances').get().n;
if (applianceCount === 0) {
  const ins = db.prepare('INSERT INTO appliances (name, emoji, duration_minutes) VALUES (?, ?, ?)');
  db.transaction(() => {
    ins.run('Washing machine', '🧺', 60);
    ins.run('Dryer',           '🌀', 60);
    ins.run('Dishwasher',      '🍽️', 60);
  })();
}

module.exports = db;
