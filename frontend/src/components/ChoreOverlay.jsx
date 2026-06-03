import { useState, useEffect } from 'react';

const POLL_MS = 60_000;

export default function ChoreOverlay() {
  const [chores, setChores] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/chores/today')
        .then(r => r.json())
        .then(setChores)
        .catch(() => {});

    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (!chores) return null;

  const mainDone  = chores.main?.done;
  const smallDone = chores.small?.done;
  if (mainDone && smallDone) return null;

  return (
    <div style={s.panel}>
      <div style={s.label}>House</div>

      {!mainDone && (
        <div style={s.row}>
          <span style={s.bullet}>⬤</span>
          <span style={s.mainText}>{chores.main.title}</span>
          {chores.main.daysOverdue > 0 && (
            <span style={s.overdue}>↩{chores.main.daysOverdue}d</span>
          )}
        </div>
      )}

      {!smallDone && (
        <div style={s.row}>
          <span style={{ ...s.bullet, opacity: 0.45, fontSize: 7 }}>⬤</span>
          <span style={s.smallText}>{chores.small.title}</span>
          {chores.small.daysOverdue > 0 && (
            <span style={s.overdue}>↩{chores.small.daysOverdue}d</span>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  panel: {
    position: 'absolute',
    bottom: 196,
    right: 44,
    background: 'rgba(0, 0, 0, 0.62)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: '14px 22px 18px',
    color: '#fff',
    maxWidth: 300,
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
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    paddingTop: 7,
  },
  bullet: {
    fontSize: 9,
    flexShrink: 0,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  mainText: {
    flex: 1,
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.35,
  },
  smallText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.35,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  overdue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#ff9f0a',
    flexShrink: 0,
  },
};
