import './App.css'
import CameraOverlay from './CameraOverlay'

function App() {

  return (
    <div className="app">
      <header className="topbar">
        <h1>ASL Hand Coach (MVP)</h1>
        <p>Task 1: camera + live hand landmarks overlay</p>
      </header>

      <main className="main">
        <CameraOverlay />
      </main>
    </div>
  );
}

export default App
