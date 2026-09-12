import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Relic } from '@/types';

// Badge map – mirrors the page's badge definitions but includes subtle borders for visual distinction
const RARITY_BADGES: Record<string, { label: string; class: string }> = {
  common: { label: 'Common', class: 'bg-secondary text-muted-foreground border border-gray-400' },
  uncommon: { label: 'Uncommon', class: 'bg-emerald-50 text-emerald-700 border border-emerald-500' },
  rare: { label: 'Rare', class: 'bg-blue-50 text-blue-700 border border-blue-500' },
  epic: { label: 'Epic', class: 'bg-purple-50 text-purple-700 border border-purple-500' },
  legendary: { label: 'Legendary', class: 'bg-amber-50 text-amber-700 border border-amber-500' },
};

interface RelicCardProps {
  relic: Relic;
  isOwned: boolean;
  isAffordable: boolean;
  purchasingId: string | null;
  onPurchase: (relic: Relic) => void;
}

export const RelicCard: React.FC<RelicCardProps> = ({ relic, isOwned, isAffordable, purchasingId, onPurchase }) => {
  const badge = RARITY_BADGES[relic.rarity] || RARITY_BADGES.common;
  const isPurchasing = purchasingId === relic.id;

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Icon – use the stored emoji/string */}
            <span className="text-2xl" aria-hidden="true">
              {relic.icon ?? '🔹'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{relic.name}</p>
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${badge.class}`}
                aria-label={`Rarity: ${badge.label}`}
              >
                {badge.label}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-gold shrink-0" aria-label="Cost">
            {relic.cost}g
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{relic.description}</p>
        <div>
          {isOwned ? (
            <Button size="sm" variant="ghost" disabled className="w-full text-xs" aria-label="Owned">
              Owned
            </Button>
          ) : (
            <Button
              size="sm"
              variant={isAffordable ? 'default' : 'outline'}
              disabled={!isAffordable || isPurchasing}
              onClick={() => onPurchase(relic)}
              className="w-full text-xs"
              aria-label={isAffordable ? `Buy ${relic.name} for ${relic.cost} gold` : `Cannot afford ${relic.name}`}
              aria-busy={isPurchasing}
            >
              {isPurchasing ? 'Purchasing…' : isAffordable ? 'Buy' : 'Not enough gold'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelicCard;
