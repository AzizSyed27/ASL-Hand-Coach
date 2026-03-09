import { useState } from "react";
import "../App.css";

import CameraOverlay from "../CameraOverlay";
import ModeTabs, { type ModeKey } from "../components/ModeTabs";
import TeachingMode from "../modes/TechingMode";
import QuizMode from "../modes/QuizMode";
import FreeMode from "../modes/FreeMode";
import { Link } from "react-router-dom";

export default function CoachApp() {
  const [mode, setMode] = useState<ModeKey>("teach");
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null);



  return (
    <div className="app">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>ASL Hand Coach</h1>
          <span className="muted">MVP</span>
          <div style={{ flex: 1 }} />
          <Link className="linkBtn" to="/">
            ← Home
          </Link>
        </div>
        <p style={{ marginTop: 6 }}>Teaching • Quiz • Free</p>
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
  );
}