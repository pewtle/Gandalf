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
`);

// Seed default rota for a 3-bed semi (runs once, skipped if rows already exist)
const rotaEmpty = db.prepare('SELECT COUNT(*) AS n FROM chores_rota').get().n === 0;
if (rotaEmpty) {
  const insert = db.prepare('INSERT INTO chores_rota (type, day_of_week, title) VALUES (?, ?, ?)');
  db.transaction(() => {
    // Main task per day  (0 = Sun … 6 = Sat)
    insert.run('main', 0, 'Hoover upstairs');
    insert.run('main', 1, 'Put laundry on');
    insert.run('main', 2, 'Mop kitchen & hallway');
    insert.run('main', 3, 'Clean bathrooms');
    insert.run('main', 4, 'Hoover downstairs');
    insert.run('main', 5, 'Change bed linen');
    insert.run('main', 6, 'Wipe down kitchen');
    // Small job per day
    insert.run('small', 0, 'Take out bins');
    insert.run('small', 1, 'Wipe kitchen counters');
    insert.run('small', 2, 'Clean mirrors');
    insert.run('small', 3, 'Fold & put away laundry');
    insert.run('small', 4, 'Tidy kitchen surfaces');
    insert.run('small', 5, 'Wipe hob & microwave');
    insert.run('small', 6, 'Tidy living room');
  })();
}

module.exports = db;
