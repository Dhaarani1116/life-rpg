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
  allActivityDates: string[]
): { current: number; longest: number } {
  const current = new Date(currentDate);
  const sorted = allActivityDates
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sorted.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let expectedDate = new Date(sorted[sorted.length - 1]);

  // Work backwards from most recent
  for (let i = sorted.length - 1; i >= 0; i--) {
    const date = sorted[i];
    const daysDiff = Math.floor(
      (expectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      expectedDate = new Date(date);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      currentStreak = 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      expectedDate = new Date(date);
      expectedDate.setDate(expectedDate.getDate() - 1);
    }
  }

  // Check if streak was broken
  const daysSinceLastActivity = lastActiveDate
    ? Math.floor(
        (current.getTime() - new Date(lastActiveDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  if (daysSinceLastActivity > 1) {
    currentStreak = 0;
  }

  return { current: currentStreak, longest: longestStreak };
}
