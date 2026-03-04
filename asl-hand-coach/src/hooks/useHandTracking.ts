import { useEffect, useMemo, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

export type HandTrackingStatus =
    | "idle"
    | "starting_camera"
    | "loading_model"
    | "running"
    | "error";

export type HandTrackingOptions = {
    
    // default: "/models/hand_landmarker.task", maybe build my own with fewer classes/features for smaller size and faster load?
    modelAssetPath?: string; 

    // WASM bundle base path 
    // default: jsdelivr tasks-vision latest
    wasmBasePath?: string; 

    // How many hands to detect 
    // default: 2
    numHands?: number; 

    /*
     * Called on every frame where inference runs.
     * Used to draw overlays or feed future recognition logic.
     */
    onResults?: (results: HandLandmarkerResult, meta: { nowMs: number }) => void;

    // GPU first, fallback CPU (AUTO) 
    // default: "AUTO"
    delegate?: "AUTO" | "GPU" | "CPU"; 
};

export type UseHandTrackingReturn = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    status: HandTrackingStatus;
    error: string | null;

    // latest results stored in a ref to avoid re-render spam 
    latestResultsRef: React.MutableRefObject<HandLandmarkerResult | null>;
};

export function useHandTracking(options: HandTrackingOptions = {}): UseHandTrackingReturn {
    const {
        modelAssetPath = "/models/hand_landmarker.task",
        wasmBasePath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        numHands = 2,
        onResults,
        delegate = "AUTO",
    } = options;

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);

    const latestResultsRef = useRef<HandLandmarkerResult | null>(null);
    const onResultsRef = useRef<typeof onResults>(onResults);

    const [status, setStatus] = useState<HandTrackingStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    // Keep callback ref fresh without restarting the pipeline
    useEffect(() => {
        onResultsRef.current = onResults;
    }, [onResults]);

    // Memoize the config so the effect only restarts if these change
    const config = useMemo(
        () => ({ modelAssetPath, wasmBasePath, numHands, delegate }),
        [modelAssetPath, wasmBasePath, numHands, delegate]
    );

    useEffect(() => {
        let cancelled = false;

        const cleanup = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;

            if (streamRef.current) {
                for (const track of streamRef.current.getTracks()) track.stop();
                streamRef.current = null;
            }

            // @ ts-expect-error - close may exist depending on version
            landmarkerRef.current?.close?.();
            landmarkerRef.current = null;

            latestResultsRef.current = null;
            lastVideoTimeRef.current = -1;
        };

        const start = async () => {
            try {
                setError(null);
                setStatus("starting_camera");

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
                video.playsInline = true;
                video.muted = true;

                await video.play();

                // Ensure metadata ready
                await new Promise<void>((resolve) => {
                    if (video.readyState >= 2) return resolve();
                    video.onloadedmetadata = () => resolve();
                });

                if (cancelled) return;

                setStatus("loading_model");

                const vision = await FilesetResolver.forVisionTasks(config.wasmBasePath);
                if (cancelled) return;

                const create = async (delegateChoice: "GPU" | "CPU") => {
                return await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                    modelAssetPath: config.modelAssetPath,
                    delegate: delegateChoice,
                    },
                    runningMode: "VIDEO",
                    numHands: config.numHands,
                });
                };

                let lm: HandLandmarker;

                if (config.delegate === "GPU") {
                lm = await create("GPU");
                } else if (config.delegate === "CPU") {
                lm = await create("CPU");
                } else {
                // AUTO: try GPU then fallback CPU
                try {
                    lm = await create("GPU");
                } catch {
                    lm = await create("CPU");
                }
                }

                if (cancelled) return;

                landmarkerRef.current = lm;
                setStatus("running");

                const loop = () => {
                const videoEl = videoRef.current;
                const landmarker = landmarkerRef.current;

                if (!videoEl || !landmarker) return;

                // Only run inference when the video time advances
                if (videoEl.currentTime !== lastVideoTimeRef.current) {
                    lastVideoTimeRef.current = videoEl.currentTime;

                    const nowMs = performance.now();
                    const results = landmarker.detectForVideo(videoEl, nowMs);

                    latestResultsRef.current = results;
                    onResultsRef.current?.(results, { nowMs });
                }

                rafRef.current = requestAnimationFrame(loop);
                };

                rafRef.current = requestAnimationFrame(loop);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setError(msg);
                setStatus("error");
                cleanup();
            }
        };

        start();

        return () => {
        cancelled = true;
        cleanup();
        };
    }, [config]);

    return { videoRef, status, error, latestResultsRef };
}