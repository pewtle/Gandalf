import Screensaver from './components/Screensaver';
import TaskOverlay from './components/TaskOverlay';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Screensaver />
      <TaskOverlay />
    </div>
  );
}
