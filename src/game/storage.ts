const KEY='bomberman-progress';
export interface Progress {
  unlocked: number;
  bestScore: number;
}
export function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as Progress; } catch { }
  return { unlocked:1, bestScore:0 };
}
export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}
