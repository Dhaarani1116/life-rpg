/**
 * RPG Progression Engine
 *
 * Non-linear leveling system with increasing XP requirements.
 * All calculations are deterministic and server-authoritative.
 */

import { Difficulty, Attribute } from '@/types';

/**
 * XP required to reach a specific level (not cumulative)
 * Formula: floor(100 * level^1.5)
 */
export function xpForLevel(level: number): number {
  if (level < 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Total XP required to reach a specific level (cumulative)
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Current level based on total XP
 */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * XP progress toward next level
 * Returns { current, required, percent }
 */
export function getXpProgress(totalXp: number): {
  current: number;
  required: number;
  percent: number;
} {
  const level = getLevelFromXp(totalXp);
  const currentLevelTotal = totalXpForLevel(level);
  const nextLevelTotal = totalXpForLevel(level + 1);

  const current = totalXp - currentLevelTotal;
  const required = nextLevelTotal - currentLevelTotal;
  const percent = Math.round((current / required) * 100);

  return { current, required, percent };
}

/**
 * XP reward for completing a quest
 * Base rewards vary by difficulty, plus streak multiplier
 */
export function getQuestXpReward(
  difficulty: Difficulty,
  streakDays: number = 0
): number {
  const baseRewards: Record<Difficulty, number> = {
    trivial: 25,
    easy: 50,
    medium: 100,
    hard: 200,
    epic: 500,
  };

  const base = baseRewards[difficulty];
  const streakMultiplier = 1 + Math.min(streakDays * 0.1, 0.5); // Max 50% bonus

  return Math.floor(base * streakMultiplier);
}

/**
 * Gold reward for completing a quest
 * Scaled by difficulty
 */
export function getQuestGoldReward(difficulty: Difficulty): number {
  const baseRewards: Record<Difficulty, number> = {
    trivial: 5,
    easy: 10,
    medium: 25,
    hard: 50,
    epic: 150,
  };

  return baseRewards[difficulty];
}

/**
 * Attribute XP earned from quest completion
 * Typically 20% of quest XP
 */
export function getAttributeXpReward(questXpReward: number): number {
  return Math.floor(questXpReward * 0.2);
}

/**
 * Check if user qualifies for level-up
 */
export function checkLevelUp(
  totalXpBefore: number,
  totalXpAfter: number
): boolean {
  const levelBefore = getLevelFromXp(totalXpBefore);
  const levelAfter = getLevelFromXp(totalXpAfter);
  return levelAfter > levelBefore;
}

/**
 * Calculate streak with daily activity tracking
 */
export function calculateStreak(
  lastActiveDate: string | null,
  currentDate: string,
  currentStreak: number,
  longestStreak: number
): { current: number; longest: number } {
  if (!lastActiveDate) {
    return { current: 1, longest: Math.max(longestStreak, 1) };
  }

  const current = new Date(currentDate).getTime();
  const last = new Date(lastActiveDate).getTime();
  const daysDiff = Math.floor((current - last) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return { current: currentStreak, longest: longestStreak };
  } else if (daysDiff === 1) {
    const newCurrent = currentStreak + 1;
    return { current: newCurrent, longest: Math.max(longestStreak, newCurrent) };
  } else {
    return { current: 1, longest: Math.max(longestStreak, 1) };
  }
}
