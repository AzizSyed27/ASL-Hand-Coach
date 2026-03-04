import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CameraOverlay from './CameraOverlay'

function App() {
  const [count, setCount] = useState(0)

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
