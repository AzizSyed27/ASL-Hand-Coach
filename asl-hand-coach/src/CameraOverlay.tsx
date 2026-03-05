// src/components/CameraOverlay.tsx
// PATCH

import { useCallback, useMemo, useRef, useState } from "react";
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandTracking } from "../src/hooks/useHandTracking";
import { landmarksToFeatureVector } from "../src/recognition/features";
import type { Handedness } from "../src/recognition/types";
import DevTemplateTools from "../src/components/DevTemplateTools";
import { getMergedTemplates } from "../src/recognition/templates";
import { classifyNearest } from "../src/recognition/classify";
import { StabilityFilter } from "../src/recognition/stability";

export default function CameraOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const latestVectorRef = useRef<number[] | null>(null);
  const [templatesRev, setTemplatesRev] = useState(0);

  // Load merged templates when templates change (user records/clears)
  const mergedTemplates = useMemo(() => getMergedTemplates(), [templatesRev]);

  // Tune these as you collect templates:
  // Start a bit lenient, then tighten once defaults are good.
  const DIST_THRESHOLD = 1.35;

  const stabilityRef = useRef(
    new StabilityFilter({
      requiredStableMs: 450,
      requiredClearMs: 200,
    })
  );

  const [debug, setDebug] = useState<{
    hands: number;
    handedness: Handedness;
    vectorLen: number;
    palmSize: number;
    prediction: string | null;
    bestLabel: string | null;
    distance: number;
    stablePrediction: string | null;
    stableForMs: number;
    templatesCount: number;
  }>({
    hands: 0,
    handedness: "Unknown",
    vectorLen: 0,
    palmSize: 0,
    prediction: null,
    bestLabel: null,
    distance: Infinity,
    stablePrediction: null,
    stableForMs: 0,
    templatesCount: Object.keys(mergedTemplates).length,
  });

  const lastHudUpdateRef = useRef<number>(0);

  const syncCanvasToVideo = (video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  };

  const drawResults = useCallback((results: HandLandmarkerResult, video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    syncCanvasToVideo(video);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(ctx);

    for (const handLandmarks of results.landmarks ?? []) {
      drawingUtils.drawConnectors(handLandmarks, HandLandmarker.HAND_CONNECTIONS);
      drawingUtils.drawLandmarks(handLandmarks);
    }
  }, []);

  const parseHandedness = (results: HandLandmarkerResult): Handedness => {
    const first = results.handednesses?.[0]?.[0] as any;
    const raw = (first?.categoryName ?? first?.displayName ?? "").toString().toLowerCase();
    if (raw.includes("left")) return "Left";
    if (raw.includes("right")) return "Right";
    return "Unknown";
  };

  const { videoRef, status, error } = useHandTracking({
    onResults: (results, meta) => {
      const video = videoRef.current;
      if (!video) return;

      drawResults(results, video);

      const hands = results.landmarks?.length ?? 0;
      const handedness = parseHandedness(results);

      let prediction: string | null = null;
      let bestLabel: string | null = null;
      let distance = Infinity;
      let vectorLen = 0;
      let palmSize = 0;

      if (hands > 0) {
        const extracted = landmarksToFeatureVector(results.landmarks![0] as any, handedness);
        latestVectorRef.current = extracted.vector;

        vectorLen = extracted.vector.length;
        palmSize = extracted.palmSize;

        const cls = classifyNearest(extracted.vector, mergedTemplates, DIST_THRESHOLD);
        prediction = cls.label;
        bestLabel = cls.bestLabel;
        distance = cls.distance;
      } else {
        latestVectorRef.current = null;
      }

      const stableState = stabilityRef.current.update(prediction, meta.nowMs);

      // Update HUD ~5x/sec (avoid rerender spam)
      const now = performance.now();
      if (now - lastHudUpdateRef.current < 200) return;
      lastHudUpdateRef.current = now;

      setDebug({
        hands,
        handedness,
        vectorLen,
        palmSize,
        prediction,
        bestLabel,
        distance,
        stablePrediction: stableState.stable,
        stableForMs: stableState.stableForMs,
        templatesCount: Object.keys(mergedTemplates).length,
      });
    },
  });

  return (
    <div className="cameraWrap">
      <div className="hud">
        <div>
          <strong>Status:</strong> {status}
        </div>

        <div>
          <strong>Templates:</strong> {debug.templatesCount}{" "}
          <strong style={{ marginLeft: 12 }}>Hands:</strong> {debug.hands}{" "}
          <strong style={{ marginLeft: 12 }}>Handedness:</strong> {debug.handedness}
        </div>

        <div>
          <strong>Prediction:</strong> {debug.prediction ?? "Unknown"}{" "}
          <strong style={{ marginLeft: 12 }}>Best:</strong> {debug.bestLabel ?? "-"}{" "}
          <strong style={{ marginLeft: 12 }}>Dist:</strong>{" "}
          {Number.isFinite(debug.distance) ? debug.distance.toFixed(3) : "∞"}{" "}
          <strong style={{ marginLeft: 12 }}>Stable:</strong> {debug.stablePrediction ?? "—"}{" "}
          <strong style={{ marginLeft: 12 }}>StableFor:</strong> {Math.floor(debug.stableForMs)}ms
        </div>

        <div>
          <strong>Vector:</strong> {debug.vectorLen}{" "}
          <strong style={{ marginLeft: 12 }}>PalmSize:</strong>{" "}
          {debug.palmSize ? debug.palmSize.toFixed(4) : "0"}
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="hint">Tip: Record a few templates (A, B, C, 1, 2) to see live predictions.</div>
      </div>

      <div className="stage">
        <video ref={videoRef} className="video" />
        <canvas ref={canvasRef} className="canvas" />
      </div>

      {import.meta.env.DEV && (
        <DevTemplateTools
          key={templatesRev}
          getLatestVector={() => latestVectorRef.current}
          onTemplatesChanged={() => setTemplatesRev((v) => v + 1)}
        />
      )}
    </div>
  );
}