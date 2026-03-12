// src/modes/QuizMode.tsx
// CREATE

import { useEffect, useMemo, useRef, useState } from "react";
import { useHandPipeline } from "../pipeline/HandPipelineProvider";
import { LESSON_LABELS, MOTION_LETTERS } from "./lesson";

type Stats = {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
};

function pickRandomLabel(labels: string[], avoid?: string | null) {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];

  let next = labels[Math.floor(Math.random() * labels.length)];
  if (avoid) {
    // avoid immediate repeats if possible
    let guard = 0;
    while (next === avoid && guard < 10) {
      next = labels[Math.floor(Math.random() * labels.length)];
      guard++;
    }
  }
  return next;
}

export default function QuizMode() {
  const { debug } = useHandPipeline();

  // Feel free to tune these:
  const CORRECT_HOLD_MS = 550; // must hold correct stablePrediction this long
  const WRONG_HOLD_MS = 1100;   // (optional) count a wrong attempt if stable wrong held this long
  const LOCK_MS = 650;         // anti-double-trigger for both correct and wrong

  const labels = useMemo(() => LESSON_LABELS, []);
  const [target, setTarget] = useState(() => pickRandomLabel(labels));
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });

  const lockUntilRef = useRef<number>(0);

  const nextPrompt = (resetStreak?: boolean) => {
    setTarget((prev) => pickRandomLabel(labels, prev));
    if (resetStreak) {
      setStats((s) => ({ ...s, streak: 0 }));
    }
  };

  const reset = () => {
    setStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
    setTarget(pickRandomLabel(labels));
    lockUntilRef.current = 0;
  };

  // Core quiz loop: react to stablePrediction.
  useEffect(() => {
    const now = performance.now();
    if (now < lockUntilRef.current) return;

    const stable = debug.stablePrediction; // null or label
    const held = debug.stableForMs;

    if (!stable) return; // no stable sign yet

    // Correct
    if (stable === target && held >= CORRECT_HOLD_MS) {
      lockUntilRef.current = now + LOCK_MS;

      setStats((s) => {
        const streak = s.streak + 1;
        return {
          correct: s.correct + 1,
          wrong: s.wrong,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
        };
      });

      // Advance prompt
      nextPrompt(false);
      return;
    }

    // Wrong (counts attempts + resets streak, but does NOT advance)
    if (stable !== target && held >= WRONG_HOLD_MS) {
      lockUntilRef.current = now + LOCK_MS;

      setStats((s) => ({
        correct: s.correct,
        wrong: s.wrong + 1,
        streak: 0,
        bestStreak: s.bestStreak,
      }));
    }
  }, [debug.stablePrediction, debug.stableForMs, target]);

  const isMotionLetter = MOTION_LETTERS.has(target);

  // Lightweight feedback text (no flickery punish)
  const feedback =
    debug.stablePrediction === null
      ? "Show your hand and hold the sign steady."
      : debug.stablePrediction === target
      ? `Correct - keep holding… (${Math.floor(debug.stableForMs)}ms)`
      : `So close. Not ${target}. I’m seeing ${debug.stablePrediction}. Try again.`;

  return (
    <div className="panel coachModePanel">
      <div className="panelHeader coachPanelHeader">
        <div>
          <span className="modeKicker">Quiz mode</span>
          <h3 className="modeHeading">Answer the current prompt</h3>
        </div>

        <div className="modeMeta">
          <span className="modeMetaChip">
            Correct <strong>{stats.correct}</strong>
          </span>
          <span className="modeMetaChip">
            Wrong <strong>{stats.wrong}</strong>
          </span>
          <span className="modeMetaChip">
            Streak <strong>{stats.streak}</strong>
          </span>
          <span className="modeMetaChip">
            Best <strong>{stats.bestStreak}</strong>
          </span>
        </div>
      </div>

      <div className="bigPrompt modePromptCard">
        <div className="modePromptTop">
          <span className="modePromptLabel">Prompt</span>
          <span className="modeNeedChip">Need {CORRECT_HOLD_MS}ms</span>
        </div>

        <div className="promptLabel">{target}</div>

        <div className="statusLine modeStatusLine">
          <span className="modeStatusPill">
            Stable <strong>{debug.stablePrediction ?? "-"}</strong>
          </span>
          <span className="modeStatusPill">
            Held <strong>{Math.floor(debug.stableForMs)}ms</strong>
          </span>
        </div>

        {isMotionLetter && (
          <div className="notice">
            Note: <strong>{target}</strong> is motion in real ASL. For now,
            use the static version.
          </div>
        )}

        <div className="feedback">
          <span
            className={debug.stablePrediction === target ? "good" : "muted"}
          >
            {feedback}
          </span>
        </div>
      </div>

      <div className="row modeActions">
        <button type="button" onClick={() => nextPrompt(true)}>
          Skip
        </button>
        <button type="button" onClick={reset} className="modeGhostBtn">
          Reset stats
        </button>
      </div>
    </div>
  );
}