'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface RewardAnimationProps {
  isVisible: boolean;
  xp: number;
  gold: number;
  attributeXp: number;
  attributeName: string;
}

export function RewardAnimation({
  isVisible,
  xp,
  gold,
  attributeXp,
  attributeName,
}: RewardAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card border border-border rounded-lg shadow-lg px-8 py-5 text-center"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <p className="text-sm font-medium text-foreground mb-2">Quest complete</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-xp font-semibold">+{xp} XP</span>
              <span className="text-gold font-semibold">+{gold} gold</span>
              <span className="text-primary font-semibold">+{attributeXp} {attributeName}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LevelUpAnimationProps {
  isVisible: boolean;
  newLevel: number;
}

export function LevelUpAnimation({ isVisible, newLevel }: LevelUpAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-foreground/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-card border border-border rounded-lg shadow-xl px-12 py-8 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Level up</p>
            <p className="text-stat text-primary">Level {newLevel}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface XPBarAnimationProps {
  current: number;
  required: number;
  isLevelingUp?: boolean;
}

export function XPBarAnimation({ current, required }: XPBarAnimationProps) {
  const percentage = Math.min((current / required) * 100, 100);

  return (
    <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-xp rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
