'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, CharacterAttribute } from '@/types';
import { getXpProgress, totalXpForLevel } from '@/lib/rpg/progression';

const ATTRIBUTE_INFO: Record<string, { label: string; description: string; color: string }> = {
  intellect: {
    label: 'Intellect',
    description: 'Learning, coding, studying, deep reading',
    color: 'bg-purple-500',
  },
  strength: {
    label: 'Strength',
    description: 'Exercise, physical training, heavy lifting',
    color: 'bg-red-500',
  },
  focus: {
    label: 'Focus',
    description: 'Deep work sessions, meditation, single-tasking',
    color: 'bg-blue-500',
  },
  vitality: {
    label: 'Vitality',
    description: 'Sleep, nutrition, running, general wellness',
    color: 'bg-emerald-500',
  },
};

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

      let { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!charData) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: user.email?.split('@')[0] || 'Adventurer' }, { onConflict: 'id' });

        const { data: newChar } = await supabase
          .from('characters')
          .insert({ user_id: user.id })
          .select()
          .maybeSingle();

        if (newChar) {
          charData = newChar;
          const attributesList = ['intellect', 'strength', 'focus', 'vitality'];
          await supabase.from('character_attributes').insert(
            attributesList.map((attr) => ({
              character_id: newChar.id,
              attribute: attr,
              xp: 0,
            }))
          );
        }
      }

      if (charData) {
        const { data: attrData } = await supabase
          .from('character_attributes')
          .select('*')
          .eq('character_id', charData.id);

        setCharacter(charData);
        setAttributes(attrData || []);
      }
    } catch (err) {
      console.error('Failed to load character:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !character) {
    return (
      <div className="container-safe py-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-6 w-32 bg-secondary rounded" />
          <div className="h-32 bg-secondary rounded-lg" />
          <div className="h-48 bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  const xpProgress = getXpProgress(character.total_xp);
  const xpToNext = totalXpForLevel(character.level + 1) - character.total_xp;

  return (
    <div className="container-safe py-6 sm:py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Character</h1>
        <p className="text-xs text-muted-foreground">Progression and attribute breakdown</p>
      </div>

      {/* Primary stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Level & Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-stat text-foreground">Level {character.level}</span>
              <span className="text-xs text-muted-foreground">{xpToNext} XP to next level</span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span>
                <span>{xpProgress.percent}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-xp rounded-full transition-all"
                  style={{ width: `${xpProgress.percent}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>Total XP</span>
              <span className="font-medium text-foreground">{character.total_xp.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity & Economy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Current streak</p>
                <p className="text-2xl font-bold text-foreground">{character.current_streak} days</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Longest streak</p>
                <p className="text-2xl font-bold text-foreground">{character.longest_streak} days</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">Gold balance</span>
              <span className="font-medium text-gold">{character.gold}g</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attribute details */}
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border -mx-5 px-5">
            {attributes.map((attr) => {
              const info = ATTRIBUTE_INFO[attr.attribute] || {
                label: attr.attribute,
                description: '',
                color: 'bg-gray-500',
              };
              const percent = Math.min((attr.xp / 1000) * 100, 100);

              return (
                <div key={attr.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">{info.label}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground shrink-0">{attr.xp} XP</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.color} rounded-full transition-all`}
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
