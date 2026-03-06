import { useCallback, useEffect, useRef, useState } from "react";
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandPipeline } from "../src/pipeline/HandPipelineProvider";
import DevTemplateTools from "../src/components/DevTemplateTools";

function labelToOverlayPath(label: string): string {
  // Convention: put transparent PNGs here:
  // public/overlays/A.png, public/overlays/0.png, public/overlays/SPACE.png, etc.
  return `/overlays/${label}.png`;
}

export default function CameraOverlay(props: { overlayLabel?: string | null }) {
  const { overlayLabel = null } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overlayOk, setOverlayOk] = useState(true);

  const { videoRef, status, error, debug, setFrameRenderer, getLatestVector, templatesRev, bumpTemplatesRev } =
    useHandPipeline();

  const overlaySrc = overlayLabel ? labelToOverlayPath(overlayLabel) : null;

  useEffect(() => {
    // reset when the target changes
    setOverlayOk(true);
  }, [overlaySrc]);

  const syncCanvasToVideo = (video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  };

  const drawResults = useCallback(
    ({ results, video }: { results: HandLandmarkerResult; video: HTMLVideoElement }) => {
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
    },
    []
  );

  useEffect(() => {
    setFrameRenderer(drawResults);
    return () => setFrameRenderer(null);
  }, [drawResults, setFrameRenderer]);

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
          <strong style={{ marginLeft: 12 }}>Held:</strong> {Math.floor(debug.stableForMs)}ms
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="stage">
        <video ref={videoRef} className="video" />
        <canvas ref={canvasRef} className="canvas" />

        {/* Optional teaching overlay (transparent PNG) */}
        {overlaySrc && overlayOk && (
          <img
            className="overlayImg"
            src={overlaySrc}
            alt=""
            onError={() => setOverlayOk(false)}
            draggable={false}
          />
        )}
      </div>

      {import.meta.env.DEV && (
        <DevTemplateTools key={templatesRev} getLatestVector={getLatestVector} onTemplatesChanged={bumpTemplatesRev} />
      )}
    </div>
  );
}