import { useState } from "react";
import "./App.css";
import CameraOverlay from "./CameraOverlay";
import ModeTabs, { type ModeKey } from "./components/ModeTabs";
import { HandPipelineProvider } from "./pipeline/HandPipelineProvider";
import TeachingMode from "./modes/TechingMode";

export default function App() {
  const [mode, setMode] = useState<ModeKey>("teach");
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null);

  return (
    <HandPipelineProvider>
      <div className="app">
        <header className="topbar">
          <h1>ASL Hand Coach (MVP)</h1>
          <p>Week 3: modes start (Teaching Mode first)</p>
        </header>

        <ModeTabs mode={mode} onChange={setMode} />

        <div className="layout">
          <CameraOverlay overlayLabel={mode === "teach" ? overlayLabel : null} />
          <div className="modeArea">
            {mode === "teach" && <TeachingMode onTargetLabelChange={setOverlayLabel} />}
            {mode === "quiz" && (
              <div className="panel">
                <h2>Quiz Mode</h2>
                <p className="muted">Next task: scoring + streak + prompt cycling.</p>
              </div>
            )}
            {mode === "free" && (
              <div className="panel">
                <h2>Free Mode</h2>
                <p className="muted">Next task: timer commit + lock/release + Space/Backspace/Clear.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </HandPipelineProvider>
  );
}