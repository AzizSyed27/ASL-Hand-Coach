// MVP lesson order: A–Z then 0–9
export const LESSON_LABELS: string[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."0123456789".split(""),
];

// MVP note: J and Z are treated as “static” shapes for now (motion later).
export const MOTION_LETTERS = new Set(["J", "Z"]);