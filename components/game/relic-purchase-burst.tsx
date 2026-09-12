import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type RelicPurchaseBurstProps = {
  /**
   * Name of the relic that was just purchased.
   * When this prop is a non‑empty string the burst is shown.
   */
  name: string;
};

/**
 * A compact, premium‑feeling purchase celebration.
 *
 * • No full‑screen backdrop – the badge floats in the centre of the viewport.
 * • Uses a gold sparkle animation to convey value.
 * • Respects prefers‑reduced‑motion – the animation is disabled when the user
 *   requests it.
 * • The component disappears automatically after the animation finishes.
 */
export default function RelicPurchaseBurst({ name }: RelicPurchaseBurstProps) {
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(!!name);

  // When the `name` prop changes we restart the animation.
  useEffect(() => {
    if (name) {
      setVisible(true);
    }
  }, [name]);

  // Auto‑hide after the exit animation completes.
  const handleAnimationComplete = () => {
    if (!visible) return;
    // After the exit transition the component will be removed.
    setVisible(false);
  };

  // If no name – render nothing.
  if (!name) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={handleAnimationComplete}
        >
          <motion.div
            className="bg-card border border-border rounded-lg shadow-xl px-6 py-4 text-center"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 25, duration: 0.8 }
            }
          >
            {/* Gold sparkle – a simple emoji works beautifully and needs no extra assets */}
            <div className="text-3xl mb-2 animate-pulse" role="img" aria-label="Gold sparkle">
              ✨
            </div>
            <p className="text-sm font-medium text-gold">Acquired {name}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
