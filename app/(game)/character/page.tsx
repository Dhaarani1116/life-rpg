'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, CharacterAttribute } from '@/types';
import { getLevelFromXp, getXpProgress, totalXpForLevel } from '@/lib/rpg/progression';
import { motion } from 'framer-motion';

const ATTRIBUTE_INFO: Record<string, { emoji: string; color: string; description: string }> = {
  intellect: {
    emoji: '🧠',
    color: 'text-purple-400',
    description: 'Learning, coding, studying',
  },
  strength: {
    emoji: '💪',
    color: 'text-red-400',
    description: 'Physical exercise, heavy lifting',
  },
  focus: {
    emoji: '🎯',
    color: 'text-cyan-400',
    description: 'Deep work, meditation, concentration',
  },
  vitality: {
    emoji: '❤️',
    color: 'text-emerald-400',
    description: 'Health, running, wellness',
  },
};

function SkeletonLoader() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-white/10 rounded-lg animate-pulse border border-white/10"
        />
      ))}
    </div>
  );
}

export default function CharacterPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacter();
    const interval = setInterval(loadCharacter, 20000); // Refresh every 20s
    return () => clearInterval(interval);
  }, []);

  async function loadCharacter() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (charError || !charData) {
        setError('Failed to load character');
        return;
      }

      const { data: attrData, error: attrError } = await supabase
        .from('character_attributes')
        .select('*')
        .eq('character_id', charData.id);

      if (attrError) {
        setError('Failed to load attributes');
        return;
      }

      setCharacter(charData);
      setAttributes(attrData || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load character:', err);
      setError('An error occurred while loading your character');
    } finally {
      setLoading(false);
    }
  }

  if (error && !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 border-red-500/50 text-white max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-6">{error}</p>
            <Link href="/dashboard" className="block">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
        <div className="container-safe">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">👤 Character Stats</h1>
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Dashboard
              </Button>
            </Link>
          </div>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  const xpProgress = getXpProgress(character.total_xp);
  const nextLevelXp = totalXpForLevel(character.level + 1) - totalXpForLevel(character.level);

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
            👤 Character Stats
          </motion.h1>
          <Link href="/dashboard">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Dashboard
            </Button>
          </Link>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 p-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Main Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Level */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-7xl font-bold text-amber-400 mb-6">{character.level}</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Progress to Level {character.level + 1}</span>
                      <span className="text-amber-400 font-semibold">{xpProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress.percent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {xpProgress.current} / {xpProgress.required} XP
                    {xpProgress.required - xpProgress.current > 0 && (
                      <span className="block text-xs mt-1 text-gray-500">
                        {xpProgress.required - xpProgress.current} XP to next level
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* XP Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total XP</div>
                    <motion.div
                      className="text-5xl font-bold text-purple-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {character.total_xp.toLocaleString()}
                    </motion.div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">XP to Next Level</div>
                    <div className="text-3xl font-semibold text-amber-400">
                      {xpProgress.required - xpProgress.current}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Streaks & Currency */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-6xl font-bold text-orange-400 mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🔥 {character.current_streak}
                </motion.div>
                <p className="text-sm text-gray-400">Days active in a row</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Longest Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-6xl font-bold text-yellow-400 mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐ {character.longest_streak}
                </motion.div>
                <p className="text-sm text-gray-400">Personal record</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle>Gold</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-6xl font-bold text-yellow-300 mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  💰 {character.gold}
                </motion.div>
                <p className="text-sm text-gray-400">Available for relics</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attributes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
              <CardDescription className="text-gray-400">Your developed skills and strengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                {attributes.map((attr, idx) => {
                  const info = ATTRIBUTE_INFO[attr.attribute] || {
                    emoji: '⭐',
                    color: 'text-gray-400',
                    description: 'Unknown attribute',
                  };

                  return (
                    <motion.div
                      key={attr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{info.emoji}</div>
                          <div>
                            <div className="font-semibold capitalize">{attr.attribute}</div>
                            <div className="text-xs text-gray-400">{info.description}</div>
                          </div>
                        </div>
                        <motion.div
                          className="text-2xl font-bold text-amber-400"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                        >
                          {attr.xp}
                        </motion.div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((attr.xp / 1000) * 100, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        {attr.xp} / 1000 XP
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
