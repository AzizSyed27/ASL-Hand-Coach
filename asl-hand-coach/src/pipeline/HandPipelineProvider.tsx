import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useHandTracking } from "../hooks/useHandTracking";
import { landmarksToFeatureVector } from "../recognition/features";
import type { Handedness } from "../recognition/types";
import { getMergedTemplates } from "../recognition/templates";
import { classifyNearest } from "../recognition/classify";
import { StabilityFilter } from "../recognition/stability";

export type PipelineDebug = {
    templatesCount: number;
    hands: number;
    handedness: Handedness;

    vectorLen: number;
    palmSize: number;

    prediction: string | null;
    bestLabel: string | null;
    distance: number;

    stablePrediction: string | null;
    stableForMs: number;
};

type FrameRenderer = (args: {
    results: HandLandmarkerResult;
    video: HTMLVideoElement;
}) => void;

type HandPipelineValue = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    status: string;
    error: string | null;

    debug: PipelineDebug;

    // latest canonical vector (length 63) for dev recording
    getLatestVector: () => number[] | null;

    // let CameraOverlay register a draw function, called every inference frame
    setFrameRenderer: (fn: FrameRenderer | null) => void;

    // templates refresh trigger (after record/clear)
    templatesRev: number;
    bumpTemplatesRev: () => void;
};

const HandPipelineContext = createContext<HandPipelineValue | null>(null);

function parseHandedness(results: HandLandmarkerResult): Handedness {
    const first = results.handednesses?.[0]?.[0] as any;
    const raw = (first?.categoryName ?? first?.displayName ?? "").toString().toLowerCase();
    if (raw.includes("left")) return "Left";
    if (raw.includes("right")) return "Right";
    return "Unknown";
}

export function HandPipelineProvider({ children }: { children: React.ReactNode }) {
    // Templates (defaults + user overrides)
    const [templatesRev, setTemplatesRev] = useState(0);
    const mergedTemplates = useMemo(() => getMergedTemplates(), [templatesRev]);
    const templatesRef = useRef(mergedTemplates);
    useEffect(() => {
        templatesRef.current = mergedTemplates;
    }, [mergedTemplates]);

    // Classification tuning (you’ll tighten later as defaults improve)
    const DIST_THRESHOLD = 1.35;

    // Stability filter
    const stabilityRef = useRef(
        new StabilityFilter({
        requiredStableMs: 450,
        requiredClearMs: 200,
        })
    );

    // Frame renderer (for drawing overlay)
    const frameRendererRef = useRef<FrameRenderer | null>(null);
    const setFrameRenderer = useCallback((fn: FrameRenderer | null) => {
        frameRendererRef.current = fn;
    }, []);

    // Latest vector for calibration record button
    const latestVectorRef = useRef<number[] | null>(null);
    const getLatestVector = useCallback(() => latestVectorRef.current, []);

    // Debug state for UI (throttled)
    const [debug, setDebug] = useState<PipelineDebug>(() => ({
        templatesCount: Object.keys(mergedTemplates).length,
        hands: 0,
        handedness: "Unknown",
        vectorLen: 0,
        palmSize: 0,
        prediction: null,
        bestLabel: null,
        distance: Infinity,
        stablePrediction: null,
        stableForMs: 0,
    }));
    const lastHudUpdateRef = useRef(0);

    const bumpTemplatesRev = useCallback(() => setTemplatesRev((v) => v + 1), []);

    const { videoRef, status, error } = useHandTracking({
        onResults: (results, meta) => {
        const video = videoRef.current;
        if (video && frameRendererRef.current) {
            frameRendererRef.current({ results, video });
        }

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

            const cls = classifyNearest(extracted.vector, templatesRef.current, DIST_THRESHOLD);
            prediction = cls.label;
            bestLabel = cls.bestLabel;
            distance = cls.distance;
        } else {
            latestVectorRef.current = null;
        }

        const stableState = stabilityRef.current.update(prediction, meta.nowMs);

        // Throttle UI updates to ~5x/sec
        const now = performance.now();
        if (now - lastHudUpdateRef.current < 200) return;
        lastHudUpdateRef.current = now;

        setDebug({
            templatesCount: Object.keys(templatesRef.current).length,
            hands,
            handedness,
            vectorLen,
            palmSize,
            prediction,
            bestLabel,
            distance,
            stablePrediction: stableState.stable,
            stableForMs: stableState.stableForMs,
        });
        },
    });

    const value: HandPipelineValue = {
        videoRef,
        status,
        error,
        debug,
        getLatestVector,
        setFrameRenderer,
        templatesRev,
        bumpTemplatesRev,
    };

    return <HandPipelineContext.Provider value={value}>{children}</HandPipelineContext.Provider>;
}

export function useHandPipeline() {
  const ctx = useContext(HandPipelineContext);
  if (!ctx) throw new Error("useHandPipeline must be used inside HandPipelineProvider");
  return ctx;
}