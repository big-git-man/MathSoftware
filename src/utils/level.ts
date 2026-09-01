// Level math. Must stay identical to the Postgres `level_thresholds` seed
// (increment level L -> L+1 is 120 + 110 * L). Mirror is tested in __tests__.

export const LEVEL_BASE = 120;      // XP for level 1 -> 2
export const LEVEL_GROWTH = 110;    // XP growth per level
export const MAX_LEVEL = 60;

export function cumulativeXP(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (LEVEL_BASE + LEVEL_GROWTH * level);
}

export function xpForNextLevel(level: number): number {
  return LEVEL_BASE + LEVEL_GROWTH * level;
}

export function levelFromTotalXP(total: number): number {
  let lvl = 1;
  while (lvl < MAX_LEVEL && cumulativeXP(lvl + 1) <= total) lvl++;
  return lvl;
}

export function xpIntoCurrentLevel(total: number): number {
  const lvl = levelFromTotalXP(total);
  return total - cumulativeXP(lvl);
}

export function progressToNextLevel(total: number): number {
  const lvl = levelFromTotalXP(total);
  const into = xpIntoCurrentLevel(total);
  const next = xpForNextLevel(lvl);
  return next > 0 ? into / next : 0;
}
