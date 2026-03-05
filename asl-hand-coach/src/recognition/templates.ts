import defaultTemplatesJson from "../data/defaultTemplates.json";

export type TemplatesMap = Record<string, number[]>;

const LS_KEY = "asl-hand-coach.userTemplates.v1";
// 21 (landmarks) * 3 (x,y,z) = 63 numbers per template
const EXPECTED_VECTOR_LEN = 63; 

// Validate that the input is an object mapping strings to number arrays of the expected length
function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && x.every((n) => typeof n === "number" && Number.isFinite(n));
}

// Sanitize raw input (from JSON) into a valid TemplatesMap, filtering out any invalid entries
function sanitizeTemplates(raw: unknown): TemplatesMap {
  if (!raw || typeof raw !== "object") return {};
  const out: TemplatesMap = {};
  for (const [label, vec] of Object.entries(raw as Record<string, unknown>)) {
    if (isNumberArray(vec) && vec.length === EXPECTED_VECTOR_LEN) {
      out[label] = vec;
    }
  }
  return out;
}

// Load default templates from the bundled JSON file
export function loadDefaultTemplates(): TemplatesMap {
  return sanitizeTemplates(defaultTemplatesJson);
}

// Load user templates from localStorage, with error handling 
export function loadUserTemplates(): TemplatesMap {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (!s) return {};
    const parsed = JSON.parse(s);
    return sanitizeTemplates(parsed);
  } catch {
    return {};
  }
}

// Save a user template to localStorage
export function saveUserTemplate(label: string, vector: number[]): void {
  if (!isNumberArray(vector) || vector.length !== EXPECTED_VECTOR_LEN) {
    throw new Error(`Template vector must be length ${EXPECTED_VECTOR_LEN}.`);
  }
  const curr = loadUserTemplates();
  curr[label] = vector;
  localStorage.setItem(LS_KEY, JSON.stringify(curr));
}

// Remove a user template from localStorage
export function clearUserTemplates(): void {
  localStorage.removeItem(LS_KEY);
}

// Get the merged templates, where user templates override defaults
export function getMergedTemplates(): TemplatesMap {
  const defaults = loadDefaultTemplates();
  const user = loadUserTemplates();
  return { ...defaults, ...user }; // user wins
}

// trigger a download of the templates as a JSON file
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}