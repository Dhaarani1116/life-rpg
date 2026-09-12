'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { RelicCard } from '@/components/game/relic-card';
import RelicPurchaseBurst from '@/components/game/relic-purchase-burst';
import { Character, InventoryItem, Relic } from '@/types';

const RARITY_BADGES: Record<string, { label: string; class: string }> = {
  common: { label: 'Common', class: 'bg-secondary text-muted-foreground' },
  uncommon: { label: 'Uncommon', class: 'bg-emerald-50 text-emerald-700' },
  rare: { label: 'Rare', class: 'bg-blue-50 text-blue-700' },
  epic: { label: 'Epic', class: 'bg-purple-50 text-purple-700' },
  legendary: { label: 'Legendary', class: 'bg-amber-50 text-amber-700' },
};

export default function RelicsPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [relics, setRelics] = useState<Relic[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: relicsData } = await supabase
        .from('relics')
        .select('*')
        .order('cost', { ascending: true });

      const { data: invData } = await supabase
        .from('inventory')
        .select('*, relic:relic_id(*)')
        .eq('user_id', user.id);

      setCharacter(charData);
      setRelics(relicsData || []);
      setInventory(invData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchaseRelic(relic: Relic) {
    if (!character || character.gold < relic.cost) {
      setError('Not enough gold');
      return;
    }

    setPurchasing(relic.id);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('purchase_relic', { p_relic_id: relic.id });
      if (error) {
        setError(error.message || 'Failed to purchase item');
      } else {
        const result = data[0];
        setPurchaseSuccess(result.relic_name);
        setTimeout(() => setPurchaseSuccess(null), 2500);
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase item');
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <div className="container-safe py-6 sm:py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-semibold text-foreground">Relic Vault</h1>
          <p className="text-sm text-muted-foreground">Spend your gold on powerful relics</p>
        </div>
        {character && (
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Balance</span>
            <p className="text-base font-bold text-gold">{character.gold}g</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {purchaseSuccess && (
        <RelicPurchaseBurst name={purchaseSuccess} />
      )}

      {/* Inventory */}
      {inventory.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Owned items ({inventory.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inventory.map((item) => (
              <Card key={item.id} className="bg-secondary/50">
                <CardContent className="p-3 text-center">
                  <p className="text-sm font-medium text-foreground truncate">{item.relic?.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.relic?.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Items */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Available items
        </h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : relics.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              No items available in the shop right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relics.map((relic) => {
              const isAffordable = (character?.gold ?? 0) >= relic.cost;
              const isOwned = inventory.some((i) => i.relic_id === relic.id);
              return (
                <RelicCard
                  key={relic.id}
                  relic={relic}
                  isOwned={isOwned}
                  isAffordable={isAffordable}
                  purchasingId={purchasing}
                  onPurchase={handlePurchaseRelic}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
