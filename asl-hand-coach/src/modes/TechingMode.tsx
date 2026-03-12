import { useEffect, useMemo, useRef, useState } from "react";
import { useHandPipeline } from "../pipeline/HandPipelineProvider";
import { LESSON_LABELS, MOTION_LETTERS } from "./lesson";

type Props = {
  onTargetLabelChange?: (label: string) => void;
};

export default function TeachingMode({ onTargetLabelChange }: Props) {
  const { debug } = useHandPipeline();

  const HOLD_MS = 550; // how long stablePrediction must match target to pass
  const COOLDOWN_MS = 700; // prevents double-advancing

  const labels = useMemo(() => LESSON_LABELS, []);
  const [idx, setIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());

  const lastAdvanceMsRef = useRef<number>(0);

  const target = labels[idx];

  // Tell App/CameraOverlay which overlay image to show
  useEffect(() => {
    onTargetLabelChange?.(target);
  }, [target, onTargetLabelChange]);

  // Auto-advance when stablePrediction matches target and held long enough
  useEffect(() => {
    const now = performance.now();
    if (now - lastAdvanceMsRef.current < COOLDOWN_MS) return;

    const isCorrect = debug.stablePrediction === target;
    const heldEnough = debug.stableForMs >= HOLD_MS;

    if (isCorrect && heldEnough) {
      lastAdvanceMsRef.current = now;

      setCompleted((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });

      setIdx((prev) => Math.min(prev + 1, labels.length - 1));
    }
  }, [debug.stablePrediction, debug.stableForMs, idx, labels.length, target]);

  const goPrev = () => setIdx((v) => Math.max(0, v - 1));
  const goNext = () => setIdx((v) => Math.min(labels.length - 1, v + 1));

  const skip = () => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    goNext();
  };

  const reset = () => {
    setIdx(0);
    setCompleted(new Set());
  };

  const progressText = `${idx + 1} / ${labels.length}`;
  const doneCount = completed.size;

  const isMotionLetter = MOTION_LETTERS.has(target);
  const stableMatches = debug.stablePrediction === target;

  return (
    <div className="panel coachModePanel">
      <div className="panelHeader coachPanelHeader">
        <div>
          <span className="modeKicker">Teaching mode</span>
          <h3 className="modeHeading">Follow the target sign</h3>
        </div>

        <div className="modeMeta">
          <span className="modeMetaChip">
            Progress <strong>{progressText}</strong>
          </span>
          <span className="modeMetaChip">
            Completed <strong>{doneCount}</strong>
          </span>
        </div>
      </div>

      <div className="bigPrompt modePromptCard">
        <div className="modePromptTop">
          <span className="modePromptLabel">Target</span>
          <span className="modeNeedChip">Need {HOLD_MS}ms</span>
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
            MVP note: <strong>{target}</strong> is motion in real ASL. For MVP,
            use the static version.
          </div>
        )}

        <div className="feedback">
          {stableMatches ? (
            <span className="good">Correct - keep holding to advance.</span>
          ) : (
            <span className="muted">
              Make the sign and hold steady until it advances.
            </span>
          )}
        </div>
      </div>

      <div className="row modeActions">
        <button type="button" onClick={goPrev} disabled={idx === 0}>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={idx === labels.length - 1}
        >
          Next
        </button>

        {(target === "J" || target === "Z") && (
          <button type="button" onClick={skip}>
            Skip (MVP)
          </button>
        )}

        <button type="button" onClick={reset} className="modeGhostBtn">
          Reset
        </button>
      </div>

      <div className="modeHint">
        Tip: keep your hand centered and avoid rotating your wrist too much.
      </div>
    </div>
  );
}