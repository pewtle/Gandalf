import { useState, useEffect, useRef } from 'react';

export default function TaskScreen({ onBack }) {
  const [tasks, setTasks]       = useState([]);
  const [chores, setChores]     = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .catch(() => {});

    fetch('/api/chores/today')
      .then(r => r.json())
      .then(setChores)
      .catch(() => {});
  }, []);

  const openInput = () => {
    setShowInput(true);
    // Defer focus so the element has rendered
    setTimeout(() => inputRef.current?.focus(), 50);
  };

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
        setShowInput(false);
      })
      .catch(() => {});
  };

  const completeTask = (id) => {
    fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' })
      .then(() => setTasks(prev => prev.filter(t => t.id !== id)))
      .catch(() => {});
  };

  const markChoreDone = (type, scheduledDate) => {
    fetch('/api/chores/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, scheduledDate }),
    })
      .then(() => fetch('/api/chores/today'))
      .then(r => r.json())
      .then(setChores)
      .catch(() => {});
  };

  const mainDone  = chores?.main?.done;
  const smallDone = chores?.small?.done;
  const showChores = chores && (!mainDone || !smallDone);

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <span style={s.heading}>Tasks</span>
        <div style={{ flex: 1 }} />
        <button style={s.addTaskBtn} onClick={openInput}>+ Add task</button>
      </div>

      <div style={s.list}>

        {/* ── Chores section ───────────────────────────────────── */}
        {showChores && (
          <div style={s.choreSection}>
            <div style={s.sectionLabel}>Today's chores</div>

            {!mainDone && (
              <div style={s.row}>
                <div style={s.choreInfo}>
                  <span style={s.taskText}>{chores.main.title}</span>
                  {chores.main.daysOverdue > 0 && (
                    <span style={s.overdue}>↩ {chores.main.daysOverdue}d overdue</span>
                  )}
                </div>
                <button
                  style={s.doneBtn}
                  onClick={() => markChoreDone('main', chores.main.scheduledDate)}
                >✓</button>
              </div>
            )}

            {!smallDone && (
              <div style={s.row}>
                <div style={s.choreInfo}>
                  <span style={{ ...s.taskText, fontSize: 19, color: 'rgba(255,255,255,0.8)' }}>
                    {chores.small.title}
                  </span>
                  {chores.small.daysOverdue > 0 && (
                    <span style={s.overdue}>↩ {chores.small.daysOverdue}d overdue</span>
                  )}
                </div>
                <button
                  style={s.doneBtn}
                  onClick={() => markChoreDone('small', chores.small.scheduledDate)}
                >✓</button>
              </div>
            )}
          </div>
        )}

        {/* ── Tasks section ────────────────────────────────────── */}
        {showChores && tasks.length > 0 && (
          <div style={s.sectionLabel}>To do</div>
        )}

        {tasks.length === 0 && !showChores && (
          <p style={s.empty}>Nothing here. Add something below.</p>
        )}

        {tasks.map(task => (
          <div key={task.id} style={s.row}>
            <span style={s.taskText}>{task.title}</span>
            <button style={s.doneBtn} onClick={() => completeTask(task.id)}>✓</button>
          </div>
        ))}

      </div>

      {showInput && (
        <div style={s.addBar}>
          <input
            ref={inputRef}
            style={s.input}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addTask();
              if (e.key === 'Escape') { setShowInput(false); setNewTitle(''); }
            }}
            placeholder="What needs doing?"
          />
          <button style={s.addBtn} onClick={addTask}>Add</button>
        </div>
      )}
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
  addTaskBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: 500,
    padding: '10px 18px',
    cursor: 'pointer',
  },
  heading: {
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 32px',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 20,
    marginBottom: 4,
  },
  choreSection: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  choreInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  taskText: {
    fontSize: 22,
    lineHeight: 1.35,
  },
  overdue: {
    fontSize: 12,
    color: '#ff9f0a',
    fontWeight: 600,
  },
  empty: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 18,
    marginTop: 48,
    textAlign: 'center',
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
    alignSelf: 'center',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    padding: '14px 22px',
    cursor: 'pointer',
  },
};
