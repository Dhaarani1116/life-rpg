import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface XPBarProps {
  current: number;
  required: number;
}

export default function XPBar({ current, required }: XPBarProps) {
  const percent = Math.min((current / required) * 100, 100);
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-foreground font-medium">
        {current.toLocaleString()}/{required.toLocaleString()} XP
      </span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-xp rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="text-muted-foreground">{Math.round(percent)}%</span>
    </div>
  );
}
