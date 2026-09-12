'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Character, CharacterAttribute } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
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

        const { data: attrData } = await supabase
          .from('character_attributes')
          .select('*')
          .eq('character_id', charData?.id);

        setCharacter(charData);
        setAttributes(attrData || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your adventure...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Character not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">⚔️ Life RPG</h1>
          <Button
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>

        {/* Character Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Level Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-bold text-amber-400 mb-4">{character.level}</div>
                <div className="text-sm text-gray-300">
                  {character.total_xp} / {character.total_xp + 1000} XP to next level
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: '45%' }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gold Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Gold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-bold text-amber-300 mb-4">💰 {character.gold}</div>
                <p className="text-sm text-gray-300">Complete quests to earn gold</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attributes */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white mb-8">
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
            <CardDescription className="text-gray-400">Your character's strengths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {attributes.map((attr) => (
                <div key={attr.id} className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">
                    {attr.attribute === 'intellect' && '🧠'}
                    {attr.attribute === 'strength' && '💪'}
                    {attr.attribute === 'focus' && '🎯'}
                    {attr.attribute === 'vitality' && '❤️'}
                  </div>
                  <div className="text-sm font-medium capitalize mb-2">{attr.attribute}</div>
                  <div className="text-xl font-bold text-amber-400">{attr.xp}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/quests" className="block">
            <Button className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-lg">
              📜 My Quests
            </Button>
          </Link>
          <Link href="/relics" className="block">
            <Button className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-lg">
              🎁 Relics Shop
            </Button>
          </Link>
          <Link href="/character" className="block">
            <Button className="w-full h-16 bg-cyan-600 hover:bg-cyan-700 text-lg">
              👤 Character
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
