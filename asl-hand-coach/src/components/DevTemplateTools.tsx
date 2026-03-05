// src/components/DevTemplateTools.tsx
// REPLACE

import { useMemo, useState } from "react";
import { ALL_LABELS } from "../recognition/labels";
import {
    clearUserTemplates,
    downloadJson,
    getMergedTemplates,
    loadDefaultTemplates,
    loadUserTemplates,
    saveUserTemplate,
    type TemplatesMap,
} from "../recognition/templates";

type Props = {
    getLatestVector: () => number[] | null;
    onTemplatesChanged: () => void;
};

function countCoverage(templates: TemplatesMap): { have: number; total: number } {
    let have = 0;
    for (const l of ALL_LABELS) if (templates[l]) have++;
    return { have, total: ALL_LABELS.length };
}

export default function DevTemplateTools({ getLatestVector, onTemplatesChanged }: Props) {
    const [label, setLabel] = useState<string>("A");
    const [autoNext, setAutoNext] = useState(true);

    // This component remounts when templatesRev changes (from CameraOverlay key),
    // so merged templates will refresh naturally.
    const merged: TemplatesMap = useMemo(() => getMergedTemplates(), []);
    const coverage = useMemo(() => countCoverage(merged), [merged]);

    const hasMerged = Boolean(merged[label]);

    const record = () => {
        const v = getLatestVector();
        if (!v) {
            alert("No vector yet. Put a hand in frame first.");
            return false;
        }
        try {
            saveUserTemplate(label, v);
            onTemplatesChanged();
            return true;
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
            return false;
        }
    };

    const nextLabel = () => {
        const idx = ALL_LABELS.indexOf(label);
        const next = ALL_LABELS[(idx + 1) % ALL_LABELS.length];
        setLabel(next);
    };

    const prevLabel = () => {
        const idx = ALL_LABELS.indexOf(label);
        const prev = ALL_LABELS[(idx - 1 + ALL_LABELS.length) % ALL_LABELS.length];
        setLabel(prev);
    };

    const recordAndNext = () => {
        const ok = record();
        if (ok && autoNext) nextLabel();
        if (ok) alert(`Saved user template for ${label}${autoNext ? " (next)" : ""}`);
    };

    const clearOverrides = () => {
        clearUserTemplates();
        onTemplatesChanged();
        alert("Cleared user overrides.");
    };

    const exportDefaults = () => downloadJson("defaultTemplates.json", loadDefaultTemplates());
    const exportUser = () => downloadJson("userTemplates.json", loadUserTemplates());
    const exportMerged = () => downloadJson("mergedTemplates.json", getMergedTemplates());

    // This is the key button: download merged with the exact filename you’ll ship.
    const downloadMergedAsDefaults = () => downloadJson("defaultTemplates.json", getMergedTemplates());

    return (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <strong>Dev Calibration:</strong>

                <label>
                Label:{" "}
                <select value={label} onChange={(e) => setLabel(e.target.value)}>
                    {ALL_LABELS.map((l) => (
                    <option key={l} value={l}>
                        {l}
                    </option>
                    ))}
                </select>
                </label>

                <button onClick={prevLabel}>Prev</button>
                <button onClick={nextLabel}>Next</button>

                <button onClick={record}>Record</button>
                <button onClick={recordAndNext}>Record & Next</button>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
                Auto-advance
                </label>

                <span style={{ opacity: 0.8 }}>
                Exists for {label}: <strong>{hasMerged ? "YES" : "NO"}</strong>
                </span>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ opacity: 0.85 }}>
                Coverage: <strong>{coverage.have}</strong> / {coverage.total}
                </span>

                <div style={{ flex: 1, minWidth: 160, height: 8, background: "#eee", borderRadius: 999 }}>
                <div
                    style={{
                    width: `${(coverage.have / coverage.total) * 100}%`,
                    height: "100%",
                    background: "#111",
                    borderRadius: 999,
                    }}
                />
                </div>

                <button onClick={clearOverrides}>Clear user overrides</button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={exportUser}>Export user overrides</button>
                <button onClick={exportMerged}>Export merged</button>
                <button onClick={exportDefaults}>Export current defaults</button>
                <button onClick={downloadMergedAsDefaults}>Download merged as defaultTemplates.json</button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                Recommended seed set for MVP: A, B, C, E, I, O, U, 0–5, SPACE, BACKSPACE, CLEAR.
            </div>
        </div>
    );
}