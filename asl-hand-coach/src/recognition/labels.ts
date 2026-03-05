export const CORE_LABELS: string[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."0123456789".split(""),
];

// Custom “typing” signs for Free Mode (you’ll create templates for these too)
export const CONTROL_LABELS: string[] = ["SPACE", "BACKSPACE", "CLEAR"];

export const ALL_LABELS: string[] = [...CORE_LABELS, ...CONTROL_LABELS];