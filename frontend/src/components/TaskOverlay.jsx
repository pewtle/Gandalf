import { useState, useEffect } from 'react';

const POLL_MS = 30_000;
const MAX_TASKS = 2;

export default function TaskOverlay() {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(all => setTasks(all.slice(0, MAX_TASKS)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div style={styles.panel}>
      <div style={styles.label}>Next up</div>
      {tasks.map(task => (
        <div key={task.id} style={styles.taskRow}>
          <span style={styles.arrow}>→</span>
          <span style={styles.taskText}>{task.title}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute',
    bottom: 196,
    left: 44,
    background: 'rgba(0, 0, 0, 0.62)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: '14px 22px 18px',
    color: '#fff',
    maxWidth: 320,
    // Keep the panel from becoming interactive / blocking photo clicks
    pointerEvents: 'none',
    userSelect: 'none',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 10,
  },
  taskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 6,
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.35)',
    flexShrink: 0,
    fontSize: 18,
    lineHeight: 1.35,
  },
  taskText: {
    fontSize: 22,
    fontWeight: 500,
    lineHeight: 1.35,
    color: '#fff',
  },
};
