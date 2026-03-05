import { useCallback, useEffect, useRef } from "react";
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandPipeline } from "../src/pipeline/HandPipelineProvider";
import DevTemplateTools from "../src/components/DevTemplateTools";

export default function CameraOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { videoRef, status, error, debug, setFrameRenderer, getLatestVector, templatesRev, bumpTemplatesRev } =
    useHandPipeline();

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
        <div className="hint">Next: ModeTabs + Teaching/Quiz/Free using stablePrediction.</div>
      </div>

      <div className="stage">
        <video ref={videoRef} className="video" />
        <canvas ref={canvasRef} className="canvas" />
      </div>

      {import.meta.env.DEV && (
        <DevTemplateTools
          key={templatesRev}
          getLatestVector={getLatestVector}
          onTemplatesChanged={bumpTemplatesRev}
        />
      )}
    </div>
  );
}