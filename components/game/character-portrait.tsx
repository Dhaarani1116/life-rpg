import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function CharacterPortrait({ size = 80 }: { size?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={reduced ? {} : { y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Helmet */}
        <path d="M32 8c-8 0-14 6-14 14v4h28v-4c0-8-6-14-14-14z" fill="hsl(var(--primary) / 0.8)" />
        {/* Face */}
        <circle cx="32" cy="28" r="8" fill="hsl(var(--foreground) / 0.9)" />
        {/* Cloak */}
        <path d="M18 36c0 12 28 12 28 0V46H18z" fill="hsl(var(--secondary) / 0.6)" />
      </svg>
    </motion.div>
  );
}
