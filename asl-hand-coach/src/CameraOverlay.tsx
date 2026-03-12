import { useCallback, useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { useHandPipeline } from "../src/pipeline/HandPipelineProvider";
import DevTemplateTools from "../src/components/DevTemplateTools";

function labelToOverlayPath(label: string): string {
  return `/overlays/${label}.png`;
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function CameraOverlay(props: { overlayLabel?: string | null }) {
  const { overlayLabel = null } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overlayOk, setOverlayOk] = useState(true);

  const {
    videoRef,
    status,
    error,
    debug,
    setFrameRenderer,
    getLatestVector,
    templatesRev,
    bumpTemplatesRev,
  } = useHandPipeline();

  const overlaySrc = overlayLabel ? labelToOverlayPath(overlayLabel) : null;

  useEffect(() => {
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
    ({
      results,
      video,
    }: {
      results: HandLandmarkerResult;
      video: HTMLVideoElement;
    }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      syncCanvasToVideo(video);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawingUtils = new DrawingUtils(ctx);
      for (const handLandmarks of results.landmarks ?? []) {
        drawingUtils.drawConnectors(
          handLandmarks,
          HandLandmarker.HAND_CONNECTIONS
        );
        drawingUtils.drawLandmarks(handLandmarks);
      }
    },
    []
  );

  useEffect(() => {
    setFrameRenderer(drawResults);
    return () => setFrameRenderer(null);
  }, [drawResults, setFrameRenderer]);

  const summaryPrediction =
    debug.stablePrediction ?? debug.prediction ?? debug.bestLabel ?? "Unknown";

  return (
    <section className="cameraShell">
      <div className="cameraCardHeader">
        <div>
          <span className="cameraEyebrow">Live tracking</span>
          <h2 className="cameraCardTitle">Camera preview</h2>
        </div>

        <div className="cameraStatusPill">{status}</div>
      </div>

      <div className="cameraStatGrid">
        <div className="cameraStat">
          <span className="cameraStatLabel">Hands</span>
          <strong className="cameraStatValue">
            {formatValue(debug.hands)}
          </strong>
        </div>

        <div className="cameraStat">
          <span className="cameraStatLabel">Handedness</span>
          <strong className="cameraStatValue">
            {formatValue(debug.handedness)}
          </strong>
        </div>

        <div className="cameraStat">
          <span className="cameraStatLabel">Templates</span>
          <strong className="cameraStatValue">
            {formatValue(debug.templatesCount)}
          </strong>
        </div>

        <div className="cameraStat">
          <span className="cameraStatLabel">Target</span>
          <strong className="cameraStatValue">
            {overlayLabel ?? "Free"}
          </strong>
        </div>

        <div className="cameraStat">
          <span className="cameraStatLabel">Prediction</span>
          <strong className="cameraStatValue">{summaryPrediction}</strong>
        </div>
      </div>

      {error && (
        <div className="cameraAlert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="stage cameraStage">
        <video ref={videoRef} className="video" />
        <canvas ref={canvasRef} className="canvas" />

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

      <div className="cameraInfoBar">
        <div className="cameraInfoItem">
          <span>Best match</span>
          <strong>{debug.bestLabel ?? "-"}</strong>
        </div>

        <div className="cameraInfoItem">
          <span>Distance</span>
          <strong>
            {Number.isFinite(debug.distance) ? debug.distance.toFixed(3) : "-"}
          </strong>
        </div>

        <div className="cameraInfoItem">
          <span>Stable</span>
          <strong>{debug.stablePrediction ?? "-"}</strong>
        </div>

        <div className="cameraInfoItem">
          <span>Held</span>
          <strong>{Math.floor(debug.stableForMs)} ms</strong>
        </div>
      </div>

      {/*  
      {import.meta.env.DEV && (
        <div className="cameraDevTools">
          <DevTemplateTools
            key={templatesRev}
            getLatestVector={getLatestVector}
            onTemplatesChanged={bumpTemplatesRev}
          />
        </div>
      )}
        */}
    </section>
  );
}