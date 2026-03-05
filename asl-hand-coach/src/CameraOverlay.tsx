import { useCallback, useRef, useState } from "react";
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandTracking } from "../src/hooks/useHandTracking";
import { landmarksToFeatureVector } from "../src/recognition/features";
import type { Handedness } from "../src/recognition/types";
import DevTemplateTools from "../src/components/DevTemplateTools";

export default function CameraOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const latestVectorRef = useRef<number[] | null>(null);
  const [templatesRev, setTemplatesRev] = useState(0); // forces DevTools remount/recompute if you want

  const [debug, setDebug] = useState<{
    hands: number;
    handedness: Handedness;
    vectorLen: number;
    palmSize: number;
  }>({ hands: 0, handedness: "Unknown", vectorLen: 0, palmSize: 0 });

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
    onResults: (results) => {
      const video = videoRef.current;
      if (!video) return;

      drawResults(results, video);

      const now = performance.now();
      if (now - lastHudUpdateRef.current < 200) return;
      lastHudUpdateRef.current = now;

      const hands = results.landmarks?.length ?? 0;
      const handedness = parseHandedness(results);

      if (hands > 0) {
        const { vector, palmSize } = landmarksToFeatureVector(results.landmarks![0] as any, handedness);
        latestVectorRef.current = vector;

        setDebug({ hands, handedness, vectorLen: vector.length, palmSize });
      } else {
        latestVectorRef.current = null;
        setDebug({ hands: 0, handedness: "Unknown", vectorLen: 0, palmSize: 0 });
      }
    },
  });

  return (
    <div className="cameraWrap">
      <div className="hud">
        <div>
          <strong>Status:</strong> {status}
        </div>

        <div>
          <strong>Hands:</strong> {debug.hands}{" "}
          <strong style={{ marginLeft: 12 }}>Handedness:</strong> {debug.handedness}{" "}
          <strong style={{ marginLeft: 12 }}>Vector:</strong> {debug.vectorLen}{" "}
          <strong style={{ marginLeft: 12 }}>PalmSize:</strong>{" "}
          {debug.palmSize ? debug.palmSize.toFixed(4) : "0"}
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="hint">Tip: good lighting + keep your hand fully in frame.</div>
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