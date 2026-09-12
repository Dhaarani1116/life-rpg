'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Character, CharacterAttribute, Quest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XPBarAnimation } from '@/components/game/animations';
import { getXpProgress } from '@/lib/rpg/progression';

const ATTRIBUTE_LABELS: Record<string, { label: string; color: string }> = {
  intellect: { label: 'Intellect', color: 'bg-purple-500' },
  strength: { label: 'Strength', color: 'bg-red-500' },
  focus: { label: 'Focus', color: 'bg-blue-500' },
  vitality: { label: 'Vitality', color: 'bg-emerald-500' },
};

export default function DashboardPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([]);
  const [recentQuests, setRecentQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
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

      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(3);

      setCharacter(charData);
      setAttributes(attrData || []);
      setRecentQuests(questsData || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !character) {
    return (
      <div className="container-safe py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-secondary rounded" />
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="h-24 bg-secondary rounded-lg" />
            <div className="h-24 bg-secondary rounded-lg" />
            <div className="h-24 bg-secondary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const xpProgress = getXpProgress(character.total_xp);

  return (
    <div className="container-safe py-6 sm:py-8 max-w-4xl space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-muted-foreground">Level</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl sm:text-stat text-foreground">{character.level}</p>
            <div className="mt-2 space-y-1">
              <XPBarAnimation current={xpProgress.current} required={xpProgress.required} />
              <p className="text-[11px] text-muted-foreground">
                {xpProgress.current} / {xpProgress.required} XP
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-muted-foreground">Streak</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl sm:text-stat text-foreground">
              {character.current_streak}
              <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Best: {character.longest_streak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-muted-foreground">Gold</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl sm:text-stat text-foreground">{character.gold}</p>
            <Link href="/relics" className="text-[11px] text-primary hover:underline mt-2 inline-block">
              Shop rewards
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active quests preview */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <CardTitle>Active quests</CardTitle>
          <Link href="/quests">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        <CardContent>
          {recentQuests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground mb-3">No active quests right now.</p>
              <Link href="/quests">
                <Button size="sm">Create quest</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border -mx-5 px-5">
              {recentQuests.map((quest) => (
                <div key={quest.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{quest.title}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {quest.attribute} · {quest.difficulty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-xp font-medium">+{quest.xp_reward} XP</span>
                    <span className="text-gold font-medium">+{quest.gold_reward}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attributes */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <CardTitle>Attributes</CardTitle>
          <Link href="/character">
            <Button variant="ghost" size="sm">Details</Button>
          </Link>
        </div>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {attributes.map((attr) => {
              const meta = ATTRIBUTE_LABELS[attr.attribute] || { label: attr.attribute, color: 'bg-gray-500' };
              const percent = Math.min((attr.xp / 1000) * 100, 100);

              return (
                <div key={attr.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">{attr.xp} XP</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.color} rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
