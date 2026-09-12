import {
  xpForLevel,
  totalXpForLevel,
  getLevelFromXp,
  getXpProgress,
  getQuestXpReward,
  checkLevelUp,
  calculateStreak,
} from './progression';

describe('RPG Progression Engine', () => {
  describe('xpForLevel', () => {
    it('should calculate XP for level 1', () => {
      expect(xpForLevel(1)).toBe(100);
    });

    it('should calculate XP for level 2', () => {
      expect(xpForLevel(2)).toBe(282);
    });

    it('should increase non-linearly', () => {
      const level1 = xpForLevel(1);
      const level2 = xpForLevel(2);
      const level3 = xpForLevel(3);
      expect(level2 - level1).toBeLessThan(level3 - level2);
    });
  });

  describe('totalXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(totalXpForLevel(1)).toBe(0);
    });

    it('should be cumulative', () => {
      const total2 = totalXpForLevel(2);
      const total3 = totalXpForLevel(3);
      expect(total3).toBeGreaterThan(total2);
    });
  });

  describe('getLevelFromXp', () => {
    it('should return level 1 at 0 XP', () => {
      expect(getLevelFromXp(0)).toBe(1);
    });

    it('should return correct level', () => {
      const xpForLevel2 = totalXpForLevel(2);
      expect(getLevelFromXp(xpForLevel2)).toBe(2);
    });
  });

  describe('getQuestXpReward', () => {
    it('should return base reward without streak', () => {
      expect(getQuestXpReward('trivial', 0)).toBe(25);
      expect(getQuestXpReward('easy', 0)).toBe(50);
      expect(getQuestXpReward('medium', 0)).toBe(100);
    });

    it('should apply streak multiplier', () => {
      const noStreak = getQuestXpReward('medium', 0);
      const withStreak = getQuestXpReward('medium', 5);
      expect(withStreak).toBeGreaterThan(noStreak);
    });

    it('should cap streak bonus at 50%', () => {
      const max50 = getQuestXpReward('medium', 10);
      const max100 = getQuestXpReward('medium', 1000);
      expect(max50).toBe(max100);
    });
  });

  describe('checkLevelUp', () => {
    it('should detect level up', () => {
      const xpBefore = 0;
      const xpAfter = totalXpForLevel(2);
      expect(checkLevelUp(xpBefore, xpAfter)).toBe(true);
    });

    it('should not detect false level up', () => {
      // totalXpForLevel(2) = xpForLevel(1) = floor(100*1^1.5) = 100
      // So 99 XP stays at level 1, no level-up occurs
      const xpBefore = 50;
      const xpAfter = 99;
      expect(checkLevelUp(xpBefore, xpAfter)).toBe(false);
    });
  });

  describe('calculateStreak', () => {
    // Authoritative rule:
    // - First completion (no lastActiveDate): streak = 1
    // - Same-day completion: streak unchanged
    // - Next consecutive day: streak + 1
    // - One or more days missed: reset to 1

    it('first completion returns streak 1', () => {
      const result = calculateStreak(null, '2024-01-01', 0, 0);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it('same-day completion returns streak unchanged', () => {
      // Character already completed a quest today (current_streak=3, last_active=today)
      const result = calculateStreak('2024-01-03', '2024-01-03', 3, 5);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(5);
    });

    it('consecutive-day completion increments streak', () => {
      // Last active was yesterday, streak was 2
      const result = calculateStreak('2024-01-02', '2024-01-03', 2, 2);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('one-day gap resets streak to 1', () => {
      // Last active was 2 days ago (missed one day)
      const result = calculateStreak('2024-01-01', '2024-01-03', 5, 10);
      expect(result.current).toBe(1);
    });

    it('multi-day gap resets streak to 1', () => {
      // Last active was a week ago
      const result = calculateStreak('2024-01-01', '2024-01-08', 7, 7);
      expect(result.current).toBe(1);
    });

    it('longest streak is preserved after a break', () => {
      // Had a longest streak of 10, now breaking with streak 1
      const result = calculateStreak('2024-01-01', '2024-01-08', 7, 10);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(10);
    });

    it('longest streak is updated when current exceeds it', () => {
      // Current streak of 4 surpasses longest of 3
      const result = calculateStreak('2024-01-03', '2024-01-04', 4, 3);
      expect(result.current).toBe(5);
      expect(result.longest).toBe(5);
    });

    it('Monday through Wednesday then Friday scenario', () => {
      // Monday: first completion (streak=1)
      const mon = calculateStreak(null, '2024-01-01', 0, 0);
      expect(mon.current).toBe(1);
      expect(mon.longest).toBe(1);

      // Monday again (second quest same day)
      const monAgain = calculateStreak('2024-01-01', '2024-01-01', mon.current, mon.longest);
      expect(monAgain.current).toBe(1);
      expect(monAgain.longest).toBe(1);

      // Tuesday
      const tue = calculateStreak('2024-01-01', '2024-01-02', monAgain.current, monAgain.longest);
      expect(tue.current).toBe(2);
      expect(tue.longest).toBe(2);

      // Wednesday
      const wed = calculateStreak('2024-01-02', '2024-01-03', tue.current, tue.longest);
      expect(wed.current).toBe(3);
      expect(wed.longest).toBe(3);

      // Thursday missed — Friday completion
      const fri = calculateStreak('2024-01-03', '2024-01-05', wed.current, wed.longest);
      expect(fri.current).toBe(1);
      expect(fri.longest).toBe(3); // longest preserved
    });
  });
});
