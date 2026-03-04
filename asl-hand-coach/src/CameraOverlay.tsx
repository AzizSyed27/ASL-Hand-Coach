// src/components/CameraOverlay.tsx
// PATCH (replace the component code with this)

import { useCallback, useRef } from "react";
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandTracking } from "../src/hooks/useHandTracking";

export default function CameraOverlay() {
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const { videoRef, status, error } = useHandTracking({
        onResults: (results) => {
        const video = videoRef.current;
        if (!video) return;
        drawResults(results, video);
        },
    });

    return (
        <div className="cameraWrap">
        <div className="hud">
            <div>
            <strong>Status:</strong> {status}
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
        </div>
    );
}