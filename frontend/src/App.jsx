import { useState } from 'react';
import Screensaver from './components/Screensaver';
import TaskOverlay from './components/TaskOverlay';
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
      <TaskOverlay />
    </div>
  );
}
