// src/recognition/stability.ts
// CREATE

export type StabilityConfig = {
    requiredStableMs: number; // e.g. 350–600ms
    requiredClearMs: number;  // e.g. 200ms
};

// Types and logic for managing the stability of predictions over time, to avoid flickering between predictions when the hand is in an ambiguous pose or transitioning between poses. The StabilityFilter class promotes a candidate prediction to stable if it’s held for long enough, and clears stable if we’ve been unknown for long enough. The update() method should be called with each new prediction and the current timestamp, and it returns the current stable/candidate state.
export type StabilityState = {
    stable: string | null;
    stableForMs: number;
    candidate: string | null;
    candidateForMs: number;
};

// This class manages the stability of predictions over time. It promotes a candidate prediction to stable if it’s held for long enough, and clears stable if we’ve been unknown for long enough. The update() method should be called with each new prediction and the current timestamp, and it returns the current stable/candidate state.
export class StabilityFilter {
    private cfg: StabilityConfig;

    private candidate: string | null = null;
    private candidateSinceMs = 0;

    private stable: string | null = null;
    private stableSinceMs = 0;

    private nullSinceMs: number | null = null;

    constructor(cfg: StabilityConfig) {
        this.cfg = cfg;
    }

    update(pred: string | null, nowMs: number): StabilityState {
        // Track how long we’ve been “unknown”
        if (pred === null) {
        if (this.nullSinceMs === null) this.nullSinceMs = nowMs;
        } else {
            this.nullSinceMs = null;
        }

        // Candidate logic
        if (pred !== this.candidate) {
            this.candidate = pred;
            this.candidateSinceMs = nowMs;
        }

        const candidateForMs = nowMs - this.candidateSinceMs;

        // Promote candidate to stable if it’s non-null and held long enough
        if (this.candidate !== null && candidateForMs >= this.cfg.requiredStableMs) {
            if (this.stable !== this.candidate) {
                this.stable = this.candidate;
                this.stableSinceMs = nowMs;
            }
        }

        // Clear stable if we've been unknown long enough
        if (this.nullSinceMs !== null) {
            const nullForMs = nowMs - this.nullSinceMs;
            if (nullForMs >= this.cfg.requiredClearMs) {
                this.stable = null;
                this.stableSinceMs = nowMs;
            }
        }

        const stableForMs = this.stable ? nowMs - this.stableSinceMs : 0;

        return {
        stable: this.stable,
        stableForMs,
        candidate: this.candidate,
        candidateForMs,
        };
    }
}