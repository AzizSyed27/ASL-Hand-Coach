import type { TemplatesMap } from "./templates";

export type ClassificationResult = {
    label: string | null;     // null = Unknown
    bestLabel: string | null; // best match even if rejected by threshold
    distance: number;         // distance to bestLabel (Infinity if none)
};

// L2 distance between two vectors, with length check
function l2Distance(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return Math.sqrt(sum);
}

/**
 * Nearest neighbor template matching by L2 distance.
 * - returns null if:
 *   - no templates exist, or
 *   - vector length mismatch, or
 *   - best distance > threshold
 */
export function classifyNearest(
    vector: number[],
    templates: TemplatesMap,
    threshold: number
): ClassificationResult {
    const entries = Object.entries(templates);

    if (!vector || vector.length === 0 || entries.length === 0) {
        return { label: null, bestLabel: null, distance: Infinity };
    }

    let bestLabel: string | null = null;
    let bestDist = Infinity;

    // Iterate over templates to find the closest match
    for (const [label, tmpl] of entries) {
        if (!tmpl || tmpl.length !== vector.length) continue;
        const d = l2Distance(vector, tmpl);
        if (d < bestDist) {
        bestDist = d;
        bestLabel = label;
        }
    }

    if (!bestLabel) return { label: null, bestLabel: null, distance: Infinity };

    const accepted = bestDist <= threshold;
    return {
        label: accepted ? bestLabel : null,
        bestLabel,
        distance: bestDist,
    };
}