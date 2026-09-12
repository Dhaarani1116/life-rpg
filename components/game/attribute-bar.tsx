import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AttributeBarProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  xp: number;
  colorClass: string; // Tailwind bg color class
}

export default function AttributeBar({ label, Icon, xp, colorClass }: AttributeBarProps) {
  const percent = Math.min((xp / 1000) * 100, 100);
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`w-4 h-4 ${colorClass}`} aria-hidden="true" />
      <span className="flex-1 font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground mr-2">{xp} XP</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'hsl(var(--xp) / 1)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
