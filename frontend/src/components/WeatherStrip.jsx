import { useState, useEffect } from 'react';

const WEATHER_POLL_MS = 10 * 60 * 1000;
const BINS_POLL_MS    =  5 * 60 * 1000;

function weatherInfo(code) {
  if (code === 0)  return { emoji: '☀️',  label: 'Clear' };
  if (code <= 2)   return { emoji: '⛅',  label: 'Partly cloudy' };
  if (code === 3)  return { emoji: '☁️',  label: 'Overcast' };
  if (code <= 49)  return { emoji: '🌫️', label: 'Foggy' };
  if (code <= 57)  return { emoji: '🌦️', label: 'Drizzle' };
  if (code <= 67)  return { emoji: '🌧️', label: 'Rain' };
  if (code <= 77)  return { emoji: '❄️',  label: 'Snow' };
  if (code <= 82)  return { emoji: '🌧️', label: 'Showers' };
  if (code <= 86)  return { emoji: '🌨️', label: 'Snow showers' };
  return                  { emoji: '⛈️',  label: 'Thunderstorm' };
}

function hint(precipMm, tempC) {
  const parts = [];
  if (precipMm > 0.5) parts.push('Umbrella');
  if (tempC < 10)     parts.push('Coat');
  return parts.length ? parts.join(' & ') : 'Fine';
}

export default function WeatherStrip() {
  const [time, setTime]       = useState('');
  const [weather, setWeather] = useState(null);
  const [bins, setBins]       = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Clock — updates every second
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Weather
  useEffect(() => {
    const load = () =>
      fetch('/api/weather').then(r => r.json()).then(setWeather).catch(() => {});
    load();
    const id = setInterval(load, WEATHER_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Bins
  useEffect(() => {
    const load = () =>
      fetch('/api/bins').then(r => r.json()).then(setBins).catch(() => {});
    load();
    const id = setInterval(load, BINS_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (weather?.daily) setExpanded(v => !v);
  };

  const current      = weather?.current;
  const daily        = weather?.daily;
  const todayInfo    = current ? weatherInfo(current.weathercode) : null;
  const tomorrowInfo = daily   ? weatherInfo(daily.weathercode[1]) : null;

  return (
    <div style={s.wrapper}>
      {/* ── Main strip ─────────────────────────────── */}
      <div style={s.strip} onClick={handleClick}>

        <span style={s.clock}>{time}</span>

        <div style={s.sep} />

        {current && todayInfo ? (
          <div style={s.weatherRow}>
            <span style={s.emoji}>{todayInfo.emoji}</span>
            <span style={s.temp}>{Math.round(current.temperature_2m)}°C</span>
            <span style={s.hint}>{hint(current.precipitation, current.temperature_2m)}</span>
          </div>
        ) : (
          <span style={s.dim}>Weather loading…</span>
        )}

        <div style={{ flex: 1 }} />

        {bins?.reminder && (
          <div style={s.binsBadge}>
            <span>{bins.collections.map(c => c.emoji).join(' ')}</span>
            <span style={s.binsLabel}>{bins.isToday ? 'Bins today' : 'Tonight'}</span>
          </div>
        )}
      </div>

      {/* ── Tomorrow (expanded) ────────────────────── */}
      {expanded && daily && tomorrowInfo && (
        <div style={s.tomorrow} onClick={e => e.stopPropagation()}>
          <span style={s.dim}>Tomorrow</span>
          <span style={s.emoji}>{tomorrowInfo.emoji}</span>
          <span style={s.temp}>
            {Math.round(daily.temperature_2m_min[1])}–{Math.round(daily.temperature_2m_max[1])}°C
          </span>
          <span style={s.hint}>
            {hint(daily.precipitation_sum[1], daily.temperature_2m_min[1])}
          </span>
        </div>
      )}
    </div>
  );
}

const glass = {
  background: 'rgba(0, 0, 0, 0.58)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const s = {
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  strip: {
    ...glass,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: '0 32px',
    height: 58,
    color: '#fff',
    cursor: 'pointer',
    userSelect: 'none',
  },
  clock: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  sep: {
    width: 1,
    height: 24,
    background: 'rgba(255,255,255,0.15)',
    flexShrink: 0,
  },
  weatherRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 1,
  },
  temp: {
    fontSize: 20,
    fontWeight: 500,
  },
  hint: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
  },
  dim: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
  },
  binsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 15,
    flexShrink: 0,
  },
  binsLabel: {
    fontWeight: 600,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  tomorrow: {
    ...glass,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 32px',
    color: '#fff',
    fontSize: 18,
  },
};
