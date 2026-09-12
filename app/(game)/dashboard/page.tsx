'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Character, CharacterAttribute } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { XPBarAnimation } from '@/components/game/animations';
import { getLevelFromXp, getXpProgress } from '@/lib/rpg/progression';

export default function DashboardPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000); // Refresh every 15s for real-time feel
    return () => clearInterval(interval);
  }, []);

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

  if (loading || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-white text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-4xl mb-4">⚔️</div>
          <p>Loading your adventure...</p>
        </motion.div>
      </div>
    );
  }

  const xpProgress = getXpProgress(character.total_xp);
  const attributeIcons: Record<string, string> = {
    intellect: '🧠',
    strength: '💪',
    focus: '🎯',
    vitality: '❤️',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <motion.h1
            className="text-5xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ⚔️ Life RPG
          </motion.h1>
          <Button
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>

        {/* Character Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Level Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white h-full">
              <CardHeader>
                <CardTitle className="text-lg">Level</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-7xl font-bold text-amber-400 mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {character.level}
                </motion.div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-amber-400">{xpProgress.percent}%</span>
                    </div>
                    <XPBarAnimation current={xpProgress.current} required={xpProgress.required} />
                  </div>
                  <div className="text-xs text-gray-400">
                    {xpProgress.current} / {xpProgress.required} XP
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Streak Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white h-full">
              <CardHeader>
                <CardTitle className="text-lg">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-6xl font-bold text-orange-400 mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  🔥 {character.current_streak}
                </motion.div>
                <p className="text-sm text-gray-300">
                  Longest: <span className="text-yellow-400 font-semibold">{character.longest_streak} days</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gold Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white h-full">
              <CardHeader>
                <CardTitle className="text-lg">Gold</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-6xl font-bold text-yellow-400 mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                >
                  💰 {character.gold}
                </motion.div>
                <p className="text-sm text-gray-300">Available for relics</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attributes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
              <CardDescription className="text-gray-400">Your developed strengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {attributes.map((attr, idx) => (
                  <motion.div
                    key={attr.id}
                    className="bg-white/5 rounded-lg p-4 text-center border border-white/10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl mb-2">{attributeIcons[attr.attribute] || '⭐'}</div>
                    <div className="text-xs font-medium text-gray-300 mb-2 capitalize">{attr.attribute}</div>
                    <motion.div
                      className="text-2xl font-bold text-amber-400"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                    >
                      {attr.xp}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Link href="/quests" className="block">
            <motion.div
              className="h-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-lg font-semibold">
                📜 My Quests
              </Button>
            </motion.div>
          </Link>
          <Link href="/relics" className="block">
            <motion.div
              className="h-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-lg font-semibold">
                🎁 Relics Shop
              </Button>
            </motion.div>
          </Link>
          <Link href="/character" className="block">
            <motion.div
              className="h-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full h-16 bg-cyan-600 hover:bg-cyan-700 text-lg font-semibold">
                👤 Character
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
