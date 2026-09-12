import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type RewardBurstProps = {
  isVisible: boolean;
  xp: number;
  gold: number;
  attributeXp: number;
  attributeName: string;
};

export default function RewardBurst({ isVisible, xp, gold, attributeXp, attributeName }: RewardBurstProps) {
  const reduced = useReducedMotion();
  if (!isVisible) return null;

  // Compact floating badge (no full-screen backdrop)
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card border border-border rounded-lg shadow-xl px-6 py-4 text-center"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25, duration: 0.8 }}
          >
            <p className="text-sm font-medium text-foreground mb-2">Quest complete</p>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-xp font-semibold">+{xp} XP</span>
              <span className="text-gold font-semibold">+{gold} gold</span>
              {attributeXp > 0 && attributeName && (
                <span className="text-primary font-semibold">
                  +{attributeXp} {attributeName}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
