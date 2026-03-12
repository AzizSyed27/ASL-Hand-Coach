// src/modes/FreeMode.tsx
// PATCH (replace whole file)

import { useEffect, useRef, useState } from "react";
import { useHandPipeline } from "../pipeline/HandPipelineProvider";

type CommitLabel = string; // A–Z, 0–9, or control labels

function applyCommit(text: string, label: CommitLabel): string {
  if (label === "SPACE") return text + " ";
  if (label === "BACKSPACE") return text.slice(0, -1);
  if (label === "CLEAR") return "";
  return text + label;
}

export default function FreeMode() {
  const { debug } = useHandPipeline();

  // Tunables
  const REQUIRED_STABLE_MS = 450; // must be stable this long to commit
  const RELEASE_MS = 200;         // must be "released" this long to unlock
  const UNLOCK_TICK_MS = 50;      // how often we check release

  const [commitIntervalMs, setCommitIntervalMs] = useState<number>(1200);
  const [text, setText] = useState<string>("");

  const [locked, setLocked] = useState(false);

  // Refs (so timers don't reset / closures don't go stale)
  const stableLabelRef = useRef<string | null>(null);
  const stableForMsRef = useRef<number>(0);
  const predictionRef = useRef<string | null>(null);
  const handsRef = useRef<number>(0);

  const lockedRef = useRef<boolean>(false);
  const lastCommittedLabelRef = useRef<string | null>(null);

  const releaseSinceRef = useRef<number | null>(null);

  // Keep refs in sync with latest pipeline outputs
  useEffect(() => {
    stableLabelRef.current = debug.stablePrediction;
    stableForMsRef.current = debug.stableForMs;
    predictionRef.current = debug.prediction; // IMPORTANT: this changes faster than stable
    handsRef.current = debug.hands;
  }, [debug.stablePrediction, debug.stableForMs, debug.prediction, debug.hands]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  // Commit timer: stable interval, reads latest stable values from refs
  useEffect(() => {
    const id = window.setInterval(() => {
      const label = stableLabelRef.current;
      const heldMs = stableForMsRef.current;

      if (!label) return;
      if (heldMs < REQUIRED_STABLE_MS) return;
      if (lockedRef.current) return;

      // Commit!
      setText((prev) => applyCommit(prev, label));

      // Lock
      lockedRef.current = true;
      setLocked(true);

      // Remember committed label for release detection
      lastCommittedLabelRef.current = label;

      // Reset release timer
      releaseSinceRef.current = null;
    }, commitIntervalMs);

    return () => window.clearInterval(id);
  }, [commitIntervalMs]);

  // ✅ Unlock checker: runs frequently and reliably accumulates RELEASE_MS
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!lockedRef.current) {
        releaseSinceRef.current = null;
        return;
      }

      const now = performance.now();
      const last = lastCommittedLabelRef.current;
      const pred = predictionRef.current;
      const hands = handsRef.current;

      const noHand = hands === 0;
      const unknown = pred === null;

      // If classifier always outputs something, changing to ANY other label is a valid "release"
      const changedAway =
        last !== null &&
        pred !== null &&
        pred !== last;

      const releasedNow = noHand || unknown || changedAway;

      if (releasedNow) {
        if (releaseSinceRef.current === null) releaseSinceRef.current = now;

        if (now - releaseSinceRef.current >= RELEASE_MS) {
          lockedRef.current = false;
          setLocked(false);
          releaseSinceRef.current = null;
        }
      } else {
        releaseSinceRef.current = null;
      }
    }, UNLOCK_TICK_MS);

    return () => window.clearInterval(id);
  }, []);

  const clear = () => setText("");
  const backspace = () => setText((t) => t.slice(0, -1));
  const addSpace = () => setText((t) => t + " ");

  const eligible =
    !locked && debug.stablePrediction !== null && debug.stableForMs >= REQUIRED_STABLE_MS;

  return (
    <div className="panel coachModePanel">
      <div className="panelHeader coachPanelHeader">
        <div>
          <span className="modeKicker">Free mode</span>
          <h3 className="modeHeading">Spell naturally at your own pace</h3>
        </div>

        <div className="modeControlGroup">
          <label className="modeSelectLabel" htmlFor="commit-interval">
            Commit speed
          </label>
          <select
            id="commit-interval"
            className="modeSelect"
            value={commitIntervalMs}
            onChange={(e) => setCommitIntervalMs(Number(e.target.value))}
          >
            <option value={1000}>Every 1.0s</option>
            <option value={1200}>Every 1.2s</option>
            <option value={1500}>Every 1.5s</option>
            <option value={2000}>Every 2.0s</option>
          </select>
        </div>
      </div>

      <div className="bigPrompt modePromptCard">
        <div className="modePromptTop">
          <span className="modePromptLabel">Output</span>
          <span className="modeNeedChip">Need {REQUIRED_STABLE_MS}ms</span>
        </div>

        <div className="modeOutputBox">
          {text || <span className="muted">Make signs to type…</span>}
        </div>

        <div className="statusLine modeStatusLine">
          <span className="modeStatusPill">
            Prediction <strong>{debug.prediction ?? "Unknown"}</strong>
          </span>
          <span className="modeStatusPill">
            Stable <strong>{debug.stablePrediction ?? "-"}</strong>
          </span>
          <span className="modeStatusPill">
            Held <strong>{Math.floor(debug.stableForMs)}ms</strong>
          </span>
          <span className="modeStatusPill">
            Locked <strong>{locked ? "YES" : "NO"}</strong>
          </span>
          <span className="modeStatusPill">
            Eligible <strong>{eligible ? "YES" : "NO"}</strong>
          </span>
          <span className="modeStatusPill">
            Last commit <strong>{lastCommittedLabelRef.current ?? "-"}</strong>
          </span>
        </div>

        <div className="feedback">
          {locked ? (
            <span className="muted">
              Locked after commit. Unlock by removing your hand or switching to
              another sign for about {RELEASE_MS}ms.
            </span>
          ) : eligible ? (
            <span className="good">Ready - the next timer tick will commit.</span>
          ) : (
            <span className="muted">
              Hold a stable sign for at least {REQUIRED_STABLE_MS}ms.
            </span>
          )}
        </div>
      </div>

      <div className="row modeActions">
        <button type="button" onClick={addSpace}>
          Add space
        </button>
        <button type="button" onClick={backspace}>
          Backspace
        </button>
        <button type="button" onClick={clear}>
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            lockedRef.current = false;
            setLocked(false);
            releaseSinceRef.current = null;
          }}
          disabled={!locked}
          className="modeGhostBtn"
        >
          Force unlock
        </button>
      </div>

      
    </div>
  );
}