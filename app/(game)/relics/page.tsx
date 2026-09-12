'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, InventoryItem, Relic } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-500', text: 'text-gray-200', border: 'border-gray-400/50' },
  uncommon: { bg: 'bg-green-500', text: 'text-green-200', border: 'border-green-400/50' },
  rare: { bg: 'bg-blue-500', text: 'text-blue-200', border: 'border-blue-400/50' },
  epic: { bg: 'bg-purple-500', text: 'text-purple-200', border: 'border-purple-400/50' },
  legendary: { bg: 'bg-yellow-500', text: 'text-yellow-200', border: 'border-yellow-400/50' },
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

      setPurchaseSuccess(relic.name);
      setTimeout(() => setPurchaseSuccess(null), 2000);
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
          <motion.h1
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            🎁 Relics Shop
          </motion.h1>
          <Link href="/dashboard">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Gold Display */}
        {character && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm mb-2">Available Gold</p>
                    <motion.p
                      className="text-4xl font-bold text-amber-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💰 {character.gold}
                    </motion.p>
                  </div>
                  <div className="text-6xl opacity-20">🏆</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Inventory */}
        <AnimatePresence>
          {inventory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Your Relics ({inventory.length})</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`bg-white/10 border-white/20 backdrop-blur-md text-white text-center`}>
                      <CardContent className="py-6">
                        <div className="text-5xl mb-3">{item.relic?.icon || '⭐'}</div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.relic?.name}</h3>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-1">{item.relic?.description}</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                            RARITY_COLORS[item.relic?.rarity || 'common'].bg
                          }`}
                        >
                          {item.relic?.rarity}
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Relics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
              {relics.map((relic, idx) => {
                const colors = RARITY_COLORS[relic.rarity];
                const isAffordable = character && character.gold >= relic.cost;
                const isOwned = inventory.some((i) => i.relic_id === relic.id);

                return (
                  <motion.div
                    key={relic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all text-white flex flex-col h-full ${
                        !isAffordable && !isOwned ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="py-6 flex-1">
                        <div className="text-5xl mb-4 text-center">{relic.icon || '⭐'}</div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{relic.name}</h3>
                        <p className="text-sm text-gray-300 mb-4 min-h-12">{relic.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${colors.bg}`}>
                            {relic.rarity}
                          </span>
                          <span className="text-xl text-amber-400 font-bold">{relic.cost} 💰</span>
                        </div>
                      </CardContent>
                      <CardContent className="py-0 pb-6">
                        {isOwned ? (
                          <Button disabled className="w-full opacity-50">
                            ✓ Owned
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchaseRelic(relic)}
                            disabled={!isAffordable || purchasing === relic.id}
                            className={`w-full ${
                              isAffordable
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {purchasing === relic.id
                              ? '⏳ Processing...'
                              : !isAffordable
                                ? 'Not Enough Gold'
                                : 'Buy'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Purchase Success Toast */}
        <AnimatePresence>
          {purchaseSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-8 right-8 sm:left-auto sm:right-8 sm:w-96 bg-green-500/20 border border-green-400/50 text-green-300 p-4 rounded-lg backdrop-blur-md"
            >
              <p className="font-semibold">🎉 {purchaseSuccess} acquired!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
