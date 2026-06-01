import { useState, useEffect, useRef } from 'react';

export default function TaskScreen({ onBack }) {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .catch(() => {});

    inputRef.current?.focus();
  }, []);

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
      .then(r => r.json())
      .then(task => {
        setTasks(prev => [...prev, task]);
        setNewTitle('');
        inputRef.current?.focus();
      })
      .catch(() => {});
  };

  const completeTask = (id) => {
    fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' })
      .then(() => setTasks(prev => prev.filter(t => t.id !== id)))
      .catch(() => {});
  };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <span style={s.heading}>Tasks</span>
      </div>

      <div style={s.list}>
        {tasks.length === 0 && (
          <p style={s.empty}>Nothing here. Add something below.</p>
        )}
        {tasks.map(task => (
          <div key={task.id} style={s.row}>
            <span style={s.taskText}>{task.title}</span>
            <button style={s.doneBtn} onClick={() => completeTask(task.id)}>✓</button>
          </div>
        ))}
      </div>

      <div style={s.addBar}>
        <input
          ref={inputRef}
          style={s.input}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
        />
        <button style={s.addBtn} onClick={addTask}>+</button>
      </div>
    </div>
  );
}

const s = {
  screen: {
    position: 'absolute',
    inset: 0,
    background: '#111',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '28px 32px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 30,
    lineHeight: 1,
    cursor: 'pointer',
    padding: '0 8px 0 0',
  },
  heading: {
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 32px',
  },
  empty: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 18,
    marginTop: 48,
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  taskText: {
    flex: 1,
    fontSize: 22,
    lineHeight: 1.35,
  },
  doneBtn: {
    flexShrink: 0,
    width: 52,
    height: 52,
    background: 'rgba(52, 199, 89, 0.12)',
    border: '1px solid rgba(52, 199, 89, 0.35)',
    borderRadius: 12,
    color: '#34c759',
    fontSize: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBar: {
    display: 'flex',
    gap: 12,
    padding: '16px 32px 36px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 20,
    padding: '14px 18px',
    outline: 'none',
  },
  addBtn: {
    flexShrink: 0,
    width: 54,
    height: 54,
    alignSelf: 'center',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 30,
    lineHeight: 1,
    cursor: 'pointer',
  },
};
