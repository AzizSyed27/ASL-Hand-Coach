import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import "../styles/coach.css";

import CameraOverlay from "../CameraOverlay";
import ModeTabs, { type ModeKey } from "../components/ModeTabs";
import TeachingMode from "../modes/TechingMode";
import QuizMode from "../modes/QuizMode";
import FreeMode from "../modes/FreeMode";

const MODE_COPY: Record<ModeKey, { title: string; description: string }> = {
  teach: {
    title: "Guided coaching",
    description:
      "Follow the target sign, use the visual overlay, and build confidence one letter at a time.",
  },
  quiz: {
    title: "Quiz challenge",
    description:
      "Test your recall with random prompts and instant feedback while keeping the same live camera workspace.",
  },
  free: {
    title: "Free signing",
    description:
      "Spell naturally at your own pace and use the live preview to practice full sequences and repeated letters.",
  },
};

export default function CoachApp() {
  const [mode, setMode] = useState<ModeKey>("teach");
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null);

  const activeOverlayLabel = mode === "teach" ? overlayLabel : null;

  return (
    <div className="app coachPage">
      <div className="coachPageInner">
        <header className="coachHero">
          <div className="coachHeroCopy">
            <span className="coachEyebrow">ASL Hand Coach</span>
            <h1 className="coachHeroTitle">Practice with real-time feedback.</h1>
            <p className="coachHeroText">
              The same live hand-tracking experience from your landing page, now
              turned into a focused learning workspace.
            </p>
          </div>

          <div className="coachHeroActions">
            
            <Link className="coachBackBtn" to="/">
              ← Home
            </Link>
          </div>
        </header>

        <section className="coachSurface">
          <div className="coachTabsHeader">
            <div>
              <span className="coachTabsEyebrow">Modes</span>

              <div className="chooseMode">

                <h2 className="coachTabsTitle">Choose how you want to learn</h2>

                <ModeTabs mode={mode} onChange={setMode} />

              </div>
              
            </div>
          </div>

          

          <div className="layout coachLayout">
            <CameraOverlay overlayLabel={activeOverlayLabel} />

            <div className="modeArea coachModeArea">
              <div className="coachPanelIntro">
                <span className="coachPanelEyebrow">Workspace</span>
                <h2 className="coachPanelTitle">{MODE_COPY[mode].title}</h2>
                <p className="coachPanelText">{MODE_COPY[mode].description}</p>
              </div>

              {mode === "teach" && (
                <TeachingMode onTargetLabelChange={setOverlayLabel} />
              )}
              {mode === "quiz" && <QuizMode />}
              {mode === "free" && <FreeMode />}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}