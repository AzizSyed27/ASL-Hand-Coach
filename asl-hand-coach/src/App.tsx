import { useState } from "react";
import "./App.css";
import CameraOverlay from "./CameraOverlay";
import ModeTabs, { type ModeKey } from "./components/ModeTabs";
import { HandPipelineProvider } from "./pipeline/HandPipelineProvider";
import TeachingMode from "./modes/TechingMode";
import QuizMode from "./modes/QuizMode";
import FreeMode from "./modes/FreeMode";

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
            {mode === "quiz" && <QuizMode />}
            {mode === "free" && <FreeMode />}
          </div>
        </div>
      </div>
    </HandPipelineProvider>
  );
}