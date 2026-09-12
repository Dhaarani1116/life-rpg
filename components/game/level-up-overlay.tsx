import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import CharacterPortrait from '@/components/game/character-portrait';

type LevelUpOverlayProps = {
  isVisible: boolean;
  newLevel: number;
  /** Callback to close the overlay */
  onClose: () => void;
};

export default function LevelUpOverlay({ isVisible, newLevel, onClose }: LevelUpOverlayProps) {
  const reduced = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Focus management: move focus into dialog on open, restore on close
  useEffect(() => {
    if (isVisible) {
      previouslyFocused.current = document.activeElement;
      // Focus the Continue button after mount
      setTimeout(() => {
        const btn = overlayRef.current?.querySelector('button');
        btn?.focus();
      }, 0);
    } else if (previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
  }, [isVisible]);

  // Escape key handling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onClose]);

    // Focus trap within dialog
  useEffect(() => {
    if (!isVisible) return;
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const dialog = overlayRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener('keydown', trap);
    return () => dialog.removeEventListener('keydown', trap);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-heading"
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop that blocks interaction */}
          <motion.div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.3 }}
          />
          {/* Dialog panel */}
          <motion.div
            className="relative bg-card border border-border rounded-xl shadow-2xl p-8 flex flex-col items-center space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 20 }}
          >
            <p className="text-sm text-muted-foreground uppercase" aria-hidden="true">
              Level Up!
            </p>
            <h2 className="text-4xl font-bold font-display text-primary" id="level-up-heading">
              Level {newLevel}
            </h2>
            <CharacterPortrait size={96} />
            <button
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={onClose}
            >
              Continue
            </button>
            {/* Optional subtle glow effect */}
            {!reduced && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ border: '2px solid hsl(var(--primary))' }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 hsl(var(--primary) / 0)',
                    '0 0 12px 8px hsl(var(--primary) / 0.4)',
                    '0 0 0 0 hsl(var(--primary) / 0)'
                  ]
                }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
