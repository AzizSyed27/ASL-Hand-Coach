// src/components/DevTemplateTools.tsx
// CREATE

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

// Dev-only tools for recording templates, exporting JSON, etc. 
type Props = {
    getLatestVector: () => number[] | null;
    onTemplatesChanged: () => void;
};

// Note: This component is not meant for production use, but it’s super helpful for quickly creating templates while testing. It lets you record the current hand pose as a template for any label, and export the default/user/merged templates as JSON files.
export default function DevTemplateTools({ getLatestVector, onTemplatesChanged }: Props) {
    const [label, setLabel] = useState<string>("A");
    const merged: TemplatesMap = useMemo(() => getMergedTemplates(), []);
    const hasMerged = Boolean(merged[label]);

    // Record the current vector as a user template for the selected label, with error handling
    const record = () => {
        const v = getLatestVector();
        if (!v) {
            alert("No vector yet. Put a hand in frame first.");
        return;
        }
        try {
            saveUserTemplate(label, v);
            onTemplatesChanged();
            alert(`Saved user template for ${label}`);
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
        }
    };

    // Clear all user templates (not defaults), with confirmation
    const clearOverrides = () => {
        clearUserTemplates();
        onTemplatesChanged();
        alert("Cleared user overrides.");
    };

    const exportDefaults = () => downloadJson("defaultTemplates.json", loadDefaultTemplates());
    const exportUser = () => downloadJson("userTemplates.json", loadUserTemplates());
    const exportMerged = () => downloadJson("mergedTemplates.json", getMergedTemplates());

    return (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <strong>Dev Tools:</strong>

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

                <button onClick={record}>Record template</button>

                <span style={{ opacity: 0.8 }}>
                    Template exists for {label}: <strong>{hasMerged ? "YES" : "NO"}</strong>
                </span>

                <button onClick={clearOverrides}>Clear user overrides</button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={exportUser}>Export user overrides</button>
                <button onClick={exportMerged}>Export merged</button>
                <button onClick={exportDefaults}>Export defaults</button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                This is dev-only. Record templates while holding a steady sign in frame.
            </div>
        </div>
    );
}