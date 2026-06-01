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

// Fall back to frontend for client-side routing
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
