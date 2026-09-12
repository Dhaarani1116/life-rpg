'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

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
          {/* XP Burst */}
          <motion.div
            className="text-6xl font-bold text-amber-400"
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -200, opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            +{xp} XP
          </motion.div>

          {/* Gold Burst */}
          <motion.div
            className="text-5xl font-bold text-yellow-400 absolute"
            initial={{ x: -100, y: 0, opacity: 1 }}
            animate={{ x: -200, y: -100, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          >
            +{gold} 💰
          </motion.div>

          {/* Attribute Burst */}
          <motion.div
            className="text-4xl font-bold text-purple-400 absolute"
            initial={{ x: 100, y: 0, opacity: 1 }}
            animate={{ x: 200, y: -100, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          >
            +{attributeXp} {attributeName}
          </motion.div>

          {/* Celebration particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 150,
                y: Math.sin((i / 8) * Math.PI * 2) * 150 - 100,
                opacity: 0,
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {['⭐', '✨', '🎉', '🏆', '💎', '🔥', '⚡', '🌟'][i]}
            </motion.div>
          ))}
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
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background blur */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Level up card */}
          <motion.div
            className="relative bg-gradient-to-br from-purple-600 to-purple-800 px-12 py-8 rounded-xl shadow-2xl"
            initial={{ scale: 0, rotateX: 90 }}
            animate={{ scale: 1, rotateX: 0 }}
            exit={{ scale: 0, rotateX: -90 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <motion.div className="text-white text-center">
              <motion.div
                className="text-7xl font-bold mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                LEVEL UP!
              </motion.div>
              <motion.div
                className="text-6xl font-bold text-amber-300"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: 2, delay: 0.2 }}
              >
                Level {newLevel}
              </motion.div>
            </motion.div>

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-amber-400"
              animate={{ boxShadow: ['0 0 20px rgba(251, 146, 60, 0.5)', '0 0 40px rgba(251, 146, 60, 0.8)'] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
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

export function XPBarAnimation({ current, required, isLevelingUp }: XPBarAnimationProps) {
  const percentage = Math.min((current / required) * 100, 100);

  return (
    <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {isLevelingUp && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
}
