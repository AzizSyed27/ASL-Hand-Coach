import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

type Status = "idle" | "starting_camera" | "loading_model" | "running" | "error";

export default function CameraOverlay() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);

    // Keep the canvas internal pixel size synced to the camera video frame size.
    const syncCanvasToVideo = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;

        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
    };

    const drawResults = (results: HandLandmarkerResult) => {
        
        const canvas = canvasRef.current;
        
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawingUtils = new DrawingUtils(ctx);

        // results.landmarks: array of hands, each is 21 landmarks
        for (const handLandmarks of results.landmarks ?? []) {
            drawingUtils.drawConnectors(handLandmarks, HandLandmarker.HAND_CONNECTIONS);
            drawingUtils.drawLandmarks(handLandmarks);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const start = async () => {

        try {
            setStatus("starting_camera");

            // 1) Start camera
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("getUserMedia not supported in this browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            if (cancelled) return;

            streamRef.current = stream;

            const video = videoRef.current;
            if (!video) throw new Error("Video element not ready.");

            video.srcObject = stream;

            // Important for iOS/Safari autoplay behavior
            video.playsInline = true;
            video.muted = true;

            await video.play();

            // Wait until metadata is ready so videoWidth/videoHeight exists
            await new Promise<void>((resolve) => {
                if (video.readyState >= 2) return resolve();
                video.onloadedmetadata = () => resolve();
            });

            if (cancelled) return;

            syncCanvasToVideo();

            // 2) Load model + wasm
            setStatus("loading_model");

            const vision = await FilesetResolver.forVisionTasks(
                // official wasm bundle location (can be CDN-hosted)
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            if (cancelled) return;

            // Try GPU first; if it fails, fall back to CPU.
            const create = async (delegate: "GPU" | "CPU") => {
               
                return await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                    modelAssetPath: "/models/hand_landmarker.task",
                    delegate,
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                });
                };

                let landmarker: HandLandmarker;
                try {
                    landmarker = await create("GPU");
                } catch {
                    landmarker = await create("CPU");
                }

                if (cancelled) return;

                landmarkerRef.current = landmarker;

                // 3) Detection loop
                setStatus("running");

                const loop = () => {
                    const videoEl = videoRef.current;
                    const lm = landmarkerRef.current;

                    if (!videoEl || !lm) return;

                    // Keep canvas sized correctly (handles device rotations/resizes)
                    if (videoEl.videoWidth && videoEl.videoHeight) {
                        syncCanvasToVideo();
                    }

                    // Only run inference when the video time changes (saves work)
                    if (videoEl.currentTime !== lastVideoTimeRef.current) {
                        lastVideoTimeRef.current = videoEl.currentTime;

                        // detectForVideo requires a timestamp in ms (API signature)
                        const nowMs = performance.now();
                        const results = lm.detectForVideo(videoEl, nowMs);
                        drawResults(results);
                    }

                    rafRef.current = requestAnimationFrame(loop);
                };

                rafRef.current = requestAnimationFrame(loop);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setError(msg);
                setStatus("error");
            }
        };

        start();

        return () => {
        cancelled = true;

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) track.stop();
            streamRef.current = null;
        }

        // Free MediaPipe resources if supported
        // (close() exists on many Tasks instances)
        // @ ts-expect-error - close may exist depending on version
        landmarkerRef.current?.close?.();
        landmarkerRef.current = null;
        };
    }, []);

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
            <div className="hint">
            Tip: good lighting + keep your hand fully in frame.
            </div>
        </div>

        <div className="stage">
            <video ref={videoRef} className="video" />
            <canvas ref={canvasRef} className="canvas" />
        </div>
        </div>
    );
}