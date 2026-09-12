import React from 'react';
import { cn } from '@/lib/utils';

// Displays "LEVEL X" with a pill style and subtle glow
export default function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium',
        'bg-primary/20 text-primary',
        'shadow-[0_0_6px_hsl(var(--primary))]'
      )}
    >
      LEVEL {level}
    </span>
  );
}
