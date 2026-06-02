import { useState } from 'react';
import Screensaver from './components/Screensaver';
import WeatherStrip from './components/WeatherStrip';
import TaskOverlay from './components/TaskOverlay';
import ChoreOverlay from './components/ChoreOverlay';
import ApplianceStrip from './components/ApplianceStrip';
import TaskScreen from './components/TaskScreen';
import './App.css';

export default function App() {
  const [view, setView] = useState('screensaver');

  if (view === 'tasks') {
    return (
      <div className="app">
        <TaskScreen onBack={() => setView('screensaver')} />
      </div>
    );
  }

  return (
    <div className="app" onClick={() => setView('tasks')} style={{ cursor: 'pointer' }}>
      <Screensaver />
      <WeatherStrip />
      <TaskOverlay />
      <ApplianceStrip />
      <ChoreOverlay />
    </div>
  );
}
