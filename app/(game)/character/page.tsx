'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, CharacterAttribute } from '@/types';
import { getLevelFromXp, getXpProgress, totalXpForLevel } from '@/lib/rpg/progression';

export default function CharacterPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacter();
  }, []);

  async function loadCharacter() {
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
      console.error('Failed to load character:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading character...</div>
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

  const xpProgress = getXpProgress(character.total_xp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">👤 Character Stats</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Level */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-7xl font-bold text-amber-400 mb-4">{character.level}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Progress to Level {character.level + 1}</span>
                  <span className="text-amber-400">{xpProgress.percent}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-amber-400 h-3 rounded-full transition-all"
                    style={{ width: `${xpProgress.percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {xpProgress.current} / {xpProgress.required} XP
                </div>
              </div>
            </CardContent>
          </Card>

          {/* XP Stats */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-300 mb-1">Total XP</div>
                  <div className="text-4xl font-bold text-purple-400">{character.total_xp.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">XP to Next Level</div>
                  <div className="text-2xl font-semibold text-amber-400">{xpProgress.required - xpProgress.current}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Streaks & Currency */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-orange-400 mb-2">🔥 {character.current_streak}</div>
              <p className="text-sm text-gray-300">Consecutive days active</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Longest Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-yellow-400 mb-2">⭐ {character.longest_streak}</div>
              <p className="text-sm text-gray-300">Personal record</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
            <CardHeader>
              <CardTitle>Gold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-amber-400 mb-2">💰 {character.gold}</div>
              <p className="text-sm text-gray-300">Available for rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Attributes */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
            <CardDescription className="text-gray-400">Your character's developed skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {attributes.map((attr) => (
                <div key={attr.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold capitalize">
                      {attr.attribute === 'intellect' && '🧠 Intellect'}
                      {attr.attribute === 'strength' && '💪 Strength'}
                      {attr.attribute === 'focus' && '🎯 Focus'}
                      {attr.attribute === 'vitality' && '❤️ Vitality'}
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{attr.xp}</div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((attr.xp / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
