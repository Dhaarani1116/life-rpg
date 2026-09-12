'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, InventoryItem, Relic } from '@/types';

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
};

export default function RelicsPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [relics, setRelics] = useState<Relic[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Load character
      const { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load relics
      const { data: relicsData } = await supabase.from('relics').select('*').order('cost', { ascending: true });

      // Load inventory
      const { data: invData } = await supabase
        .from('inventory')
        .select('*, relic:relic_id(*)')
        .eq('user_id', user.id);

      setCharacter(charData);
      setRelics(relicsData || []);
      setInventory(invData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load relics');
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Deduct gold
      await supabase
        .from('characters')
        .update({ gold: character.gold - relic.cost })
        .eq('id', character.id);

      // Add to inventory
      await supabase.from('inventory').insert({
        user_id: user.id,
        relic_id: relic.id,
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to purchase relic');
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">🎁 Relics Shop</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Gold Display */}
        {character && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Available Gold</p>
                  <p className="text-4xl font-bold text-amber-400">💰 {character.gold}</p>
                </div>
                <div className="text-6xl">🏆</div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

        {/* Inventory */}
        {inventory.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Your Relics ({inventory.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item) => (
                <Card key={item.id} className="bg-white/10 border-white/20 backdrop-blur-md text-white">
                  <CardContent className="py-6 text-center">
                    <div className="text-4xl mb-3">{item.relic?.icon || '⭐'}</div>
                    <h3 className="font-semibold mb-1">{item.relic?.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{item.relic?.description}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${RARITY_COLORS[item.relic?.rarity || 'common']}`}>
                      {item.relic?.rarity}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Relics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Available Relics</h2>
          {loading ? (
            <div className="text-white text-center py-12">Loading relics...</div>
          ) : relics.length === 0 ? (
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardContent className="py-12 text-center">
                <p className="text-gray-300">No relics available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relics.map((relic) => (
                <Card key={relic.id} className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all text-white flex flex-col">
                  <CardContent className="py-6 flex-1">
                    <div className="text-4xl mb-4 text-center">{relic.icon || '⭐'}</div>
                    <h3 className="font-semibold text-lg mb-2">{relic.name}</h3>
                    <p className="text-sm text-gray-300 mb-4 min-h-12">{relic.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${RARITY_COLORS[relic.rarity]}`}>
                        {relic.rarity}
                      </span>
                      <span className="text-xl text-amber-400 font-bold">{relic.cost} 💰</span>
                    </div>
                  </CardContent>
                  <CardContent className="py-0 pb-6">
                    <Button
                      onClick={() => handlePurchaseRelic(relic)}
                      disabled={!character || character.gold < relic.cost || purchasing === relic.id}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    >
                      {purchasing === relic.id ? 'Purchasing...' : 'Buy'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
