'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

const PHOTO_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif)$/i;

app.use(cors());
app.use(express.json());

// Serve photos from the photos/ directory at the repo root
const photosDir = path.join(__dirname, '../../photos');
app.use('/photos', express.static(photosDir));

// Serve the built frontend (populated by `npm run build` in frontend/)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// ── Helpers ──────────────────────────────────────────────────────────────────

// Use local date so midnight on the Pi doesn't jump to yesterday in UTC
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const _getRotaTask = db.prepare('SELECT title FROM chores_rota WHERE type = ? AND day_of_week = ?');
const _isDone      = db.prepare('SELECT 1 FROM chores_log WHERE type = ? AND scheduled_date = ? AND done_at IS NOT NULL');

// Walk back up to 7 days to find the oldest uncompleted scheduled chore.
// That's what shows today — rolled-over tasks persist until ticked off.
function getActiveChore(type) {
  const today = new Date();
  for (let daysBack = 6; daysBack >= 0; daysBack--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const dateStr = localDateStr(d);
    const row = _getRotaTask.get(type, d.getDay());
    if (!row) continue;
    if (!_isDone.get(type, dateStr)) {
      return { title: row.title, scheduledDate: dateStr, daysOverdue: daysBack };
    }
  }
  // Everything done — return today's in a done state
  const dateStr = localDateStr(today);
  const row = _getRotaTask.get(type, today.getDay());
  return { title: row?.title ?? null, scheduledDate: dateStr, daysOverdue: 0, done: true };
}

// ── API ──────────────────────────────────────────────────────────────────────

app.get('/api/photos', (_req, res) => {
  try {
    const files = fs.readdirSync(photosDir).filter(f => PHOTO_EXTENSIONS.test(f));
    res.json(files);
  } catch {
    res.json([]);
  }
});

app.get('/api/tasks', (_req, res) => {
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE completed = 0 ORDER BY created_at ASC'
  ).all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, source = 'manual' } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const result = db.prepare(
    'INSERT INTO tasks (title, source) VALUES (?, ?)'
  ).run(title.trim(), source);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id/complete', (req, res) => {
  db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/chores/today', (_req, res) => {
  res.json({
    main:  getActiveChore('main'),
    small: getActiveChore('small'),
  });
});

app.post('/api/chores/done', (req, res) => {
  const { type, scheduledDate } = req.body || {};
  if (!type || !scheduledDate) {
    return res.status(400).json({ error: 'type and scheduledDate are required' });
  }
  db.prepare(
    'INSERT OR REPLACE INTO chores_log (type, scheduled_date, done_at) VALUES (?, ?, datetime("now"))'
  ).run(type, scheduledDate);
  res.json({ ok: true });
});

// ── Appliances ───────────────────────────────────────────────────────────────

app.get('/api/appliances', (_req, res) => {
  res.json(db.prepare('SELECT * FROM appliances ORDER BY id').all());
});

app.post('/api/appliances/:id/start', (req, res) => {
  db.prepare('UPDATE appliances SET status = ?, started_at = ? WHERE id = ?')
    .run('running', new Date().toISOString(), req.params.id);
  res.json(db.prepare('SELECT * FROM appliances WHERE id = ?').get(req.params.id));
});

app.post('/api/appliances/:id/done', (req, res) => {
  db.prepare('UPDATE appliances SET status = ? WHERE id = ?').run('done', req.params.id);
  res.json(db.prepare('SELECT * FROM appliances WHERE id = ?').get(req.params.id));
});

app.post('/api/appliances/:id/reset', (req, res) => {
  db.prepare('UPDATE appliances SET status = ?, started_at = NULL WHERE id = ?')
    .run('empty', req.params.id);
  res.json(db.prepare('SELECT * FROM appliances WHERE id = ?').get(req.params.id));
});

app.patch('/api/appliances/:id/duration', (req, res) => {
  const { minutes } = req.body || {};
  if (!minutes || minutes < 1) return res.status(400).json({ error: 'minutes required' });
  db.prepare('UPDATE appliances SET duration_minutes = ? WHERE id = ?').run(minutes, req.params.id);
  res.json({ ok: true });
});

// ── Weather ───────────────────────────────────────────────────────────────────

let _weatherCache = { data: null, at: 0 };
const WEATHER_TTL = 30 * 60 * 1000;

app.get('/api/weather', async (_req, res) => {
  const { LATITUDE: lat, LONGITUDE: lon } = process.env;
  if (!lat || !lon) {
    return res.status(503).json({ error: 'LATITUDE and LONGITUDE not set in .env' });
  }

  if (_weatherCache.data && Date.now() - _weatherCache.at < WEATHER_TTL) {
    return res.json(_weatherCache.data);
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weathercode,precipitation` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=auto&forecast_days=2`;

    const r = await fetch(url);
    const data = await r.json();
    _weatherCache = { data, at: Date.now() };
    res.json(data);
  } catch {
    if (_weatherCache.data) return res.json(_weatherCache.data); // serve stale on error
    res.status(503).json({ error: 'Weather unavailable' });
  }
});

// ── Bins ──────────────────────────────────────────────────────────────────────

const binsConfigPath = path.join(__dirname, '../bins.json');
let binsConfig = { collections: [] };
try {
  binsConfig = JSON.parse(fs.readFileSync(binsConfigPath, 'utf8'));
} catch {
  console.warn('bins.json not found or invalid — bin reminders disabled');
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86_400_000 + 1) / 7);
}

function isCollectionDay(col, date) {
  if (date.getDay() !== col.dayOfWeek) return false;
  if (col.frequency === 'weekly') return true;
  const week = isoWeek(date);
  return col.weekParity === 'even' ? week % 2 === 0 : week % 2 !== 0;
}

app.get('/api/bins', (_req, res) => {
  const now   = new Date();
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Show all day if it's collection day
  const todayHits = binsConfig.collections.filter(c => isCollectionDay(c, today));
  if (todayHits.length) {
    return res.json({ reminder: true, isToday: true,
      collections: todayHits.map(({ name, emoji }) => ({ name, emoji })) });
  }

  // Show from 18:00 the evening before
  if (now.getHours() >= 18) {
    const tomorrowHits = binsConfig.collections.filter(c => isCollectionDay(c, tomorrow));
    if (tomorrowHits.length) {
      return res.json({ reminder: true, isToday: false,
        collections: tomorrowHits.map(({ name, emoji }) => ({ name, emoji })) });
    }
  }

  res.json({ reminder: false, isToday: false, collections: [] });
});


app.get('*', (_req, res) => {
  const index = path.join(frontendDist, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(404).send('Frontend not built yet. Run: cd frontend && npm run build');
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Gandalf backend running on http://localhost:${PORT}`);
});
