import './App.css'
import CameraOverlay from './CameraOverlay'
import { HandPipelineProvider } from "./pipeline/HandPipelineProvider";

function App() {

  return (
    <HandPipelineProvider>
      <div className="app">
        <header className="topbar">
          <h1>ASL Hand Coach (MVP)</h1>
          <p>Shared pipeline context (pre-modes)</p>
        </header>

        <main className="main">
          <CameraOverlay />
        </main>
      </div>
    </HandPipelineProvider>
  );
}

export default App
