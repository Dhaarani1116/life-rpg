import {
  xpForLevel,
  totalXpForLevel,
  getLevelFromXp,
  getXpProgress,
  getQuestXpReward,
  checkLevelUp,
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
      const xpBefore = 50;
      const xpAfter = 100;
      expect(checkLevelUp(xpBefore, xpAfter)).toBe(false);
    });
  });
});
