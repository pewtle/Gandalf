import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_MS        = 60_000;
const LONG_PRESS_MS  = 650;
const PRESETS        = [
  { label: '30m', value: 30 },
  { label: '1h',  value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h',  value: 120 },
];

const COLOR = {
  empty:   '#30d158', // green
  running: '#ff453a', // red
  done:    '#ff9f0a', // orange
};

// Two-note ding via Web Audio — no audio file needed
function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [660, 0.28]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  } catch {}
}

// ── Countdown ring card ──────────────────────────────────────────────────────

function ApplianceCard({ appliance, onTap, onExpire, onLongPress }) {
  const [elapsed, setElapsed]   = useState(0);
  const pressTimerRef           = useRef(null);
  const didLongPressRef         = useRef(false);

  const SIZE  = 76;
  const SW    = 4;
  const r     = (SIZE - SW * 2) / 2;
  const circ  = 2 * Math.PI * r;

  // Drive the ring animation at 1-second resolution
  useEffect(() => {
    if (appliance.status !== 'running' || !appliance.started_at) { setElapsed(0); return; }
    const tick = () => setElapsed(Date.now() - new Date(appliance.started_at).getTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appliance.status, appliance.started_at]);

  // Precise timeout so the ding fires at exactly the right moment
  useEffect(() => {
    if (appliance.status !== 'running' || !appliance.started_at) return;
    const durationMs  = appliance.duration_minutes * 60_000;
    const remaining   = durationMs - (Date.now() - new Date(appliance.started_at).getTime());
    if (remaining <= 0) { onExpire(appliance.id); return; }
    const id = setTimeout(() => onExpire(appliance.id), remaining);
    return () => clearTimeout(id);
  }, [appliance.id, appliance.status, appliance.started_at, appliance.duration_minutes, onExpire]);

  const durationMs = appliance.duration_minutes * 60_000;
  const progress   = appliance.status === 'running'
    ? Math.max(0, 1 - elapsed / durationMs)
    : 1; // full ring for empty (dim) and done (bright)

  const color       = COLOR[appliance.status];
  const ringOpacity = appliance.status === 'empty' ? 0.22 : 1;
  const dashOffset  = appliance.status === 'running'
    ? circ * (1 - progress)
    : 0;

  const onPressStart = (e) => {
    e.stopPropagation();
    didLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress(appliance.id);
    }, LONG_PRESS_MS);
  };

  const onPressEnd = (e) => {
    e.stopPropagation();
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
    if (!didLongPressRef.current) onTap(appliance.id, appliance.status);
  };

  const onPressCancel = () => {
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressCancel}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      onTouchMove={onPressCancel}
    >
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg
          width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Track */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={SW} />
          {/* Countdown / status ring */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={SW}
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            opacity={ringOpacity}
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`,
              transition: appliance.status === 'running'
                ? 'stroke-dashoffset 1s linear'
                : 'stroke 0.4s ease, opacity 0.4s ease',
            }}
          />
        </svg>

        {/* Emoji centred over the ring */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {appliance.emoji}
        </div>
      </div>

      <span style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: 80,
      }}>
        {appliance.name}
      </span>
    </div>
  );
}

// ── Duration picker ──────────────────────────────────────────────────────────

function DurationPicker({ appliance, onSave, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 170,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(28,28,30,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          padding: '14px 16px 16px',
          minWidth: 260,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 12 }}>
          {appliance.name} — timer
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {PRESETS.map(({ label, value }) => (
            <button
              key={value}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 11,
                border: 'none',
                background: value === appliance.duration_minutes
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0.07)',
                color: value === appliance.duration_minutes ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 15,
                fontWeight: value === appliance.duration_minutes ? 700 : 400,
                cursor: 'pointer',
              }}
              onClick={() => onSave(appliance.id, value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Strip ────────────────────────────────────────────────────────────────────

export default function ApplianceStrip() {
  const [appliances, setAppliances] = useState([]);
  const [editingId, setEditingId]   = useState(null);

  const load = useCallback(() => {
    fetch('/api/appliances')
      .then(r => r.json())
      .then(setAppliances)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const handleTap = (id, status) => {
    const endpoint = status === 'empty' ? 'start' : 'reset';
    fetch(`/api/appliances/${id}/${endpoint}`, { method: 'POST' })
      .then(r => r.json())
      .then(updated => setAppliances(prev => prev.map(a => a.id === id ? updated : a)))
      .catch(() => {});
  };

  const handleExpire = useCallback((id) => {
    playDing();
    fetch(`/api/appliances/${id}/done`, { method: 'POST' })
      .then(r => r.json())
      .then(updated => setAppliances(prev => prev.map(a => a.id === id ? updated : a)))
      .catch(() => {});
  }, []);

  const saveDuration = (id, minutes) => {
    fetch(`/api/appliances/${id}/duration`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes }),
    })
      .then(() => setAppliances(prev => prev.map(a => a.id === id ? { ...a, duration_minutes: minutes } : a)))
      .catch(() => {});
    setEditingId(null);
  };

  if (!appliances.length) return null;

  const editingAppliance = appliances.find(a => a.id === editingId);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.62)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '16px 28px 14px',
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
          pointerEvents: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {appliances.map(appliance => (
          <ApplianceCard
            key={appliance.id}
            appliance={appliance}
            onTap={handleTap}
            onExpire={handleExpire}
            onLongPress={setEditingId}
          />
        ))}
      </div>

      {editingId && editingAppliance && (
        <DurationPicker
          appliance={editingAppliance}
          onSave={saveDuration}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
