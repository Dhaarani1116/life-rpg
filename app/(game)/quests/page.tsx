'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createQuest, completeQuest, deleteQuest } from '@/lib/actions/quests';
import { Quest, Character, Difficulty, Attribute } from '@/types';
import { RewardAnimation, LevelUpAnimation } from '@/components/game/animations';
import { getLevelFromXp } from '@/lib/rpg/progression';

const DIFFICULTIES: Record<Difficulty, { label: string }> = {
  trivial: { label: 'Trivial' },
  easy: { label: 'Easy' },
  medium: { label: 'Medium' },
  hard: { label: 'Hard' },
  epic: { label: 'Epic' },
};

const ATTRIBUTES: Record<Attribute, { label: string }> = {
  intellect: { label: 'Intellect' },
  strength: { label: 'Strength' },
  focus: { label: 'Focus' },
  vitality: { label: 'Vitality' },
};

export default function QuestsPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    attribute: 'intellect' as Attribute,
    difficulty: 'medium' as Difficulty,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [rewardData, setRewardData] = useState({ xp: 0, gold: 0, attrXp: 0, attr: 'intellect' as Attribute });
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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

      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setCharacter(charData);
      setQuests(questsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createQuest(formData);
      setFormData({ title: '', description: '', attribute: 'intellect', difficulty: 'medium' });
      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create quest');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteQuest(quest: Quest) {
    if (!character) return;

    setCompletingId(quest.id);
    setError(null);

    try {
      const result = await completeQuest(quest.id);

      setRewardData({
        xp: result.xpEarned,
        gold: result.goldEarned,
        attrXp: result.attributeXpEarned,
        attr: quest.attribute as Attribute,
      });
      setShowRewardAnimation(true);

      const oldLevel = getLevelFromXp(character.total_xp);
      const newCharLevel = getLevelFromXp(character.total_xp + result.xpEarned);

      if (newCharLevel > oldLevel) {
        setTimeout(() => {
          setNewLevel(newCharLevel);
          setShowLevelUpAnimation(true);
        }, 600);
      }

      setTimeout(() => {
        setShowRewardAnimation(false);
        setShowLevelUpAnimation(false);
        loadData();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete quest');
      setCompletingId(null);
    }
  }

  async function handleDeleteQuest(questId: string) {
    try {
      await deleteQuest(questId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quest');
    }
  }

  const activeQuests = quests.filter((q) => !q.is_completed);
  const completedQuests = quests.filter((q) => q.is_completed);

  return (
    <div className="container-safe py-6 sm:py-8 max-w-3xl space-y-6">
      <RewardAnimation
        isVisible={showRewardAnimation}
        xp={rewardData.xp}
        gold={rewardData.gold}
        attributeXp={rewardData.attrXp}
        attributeName={ATTRIBUTES[rewardData.attr]?.label || ''}
      />
      <LevelUpAnimation isVisible={showLevelUpAnimation} newLevel={newLevel} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Quests</h1>
          <p className="text-xs text-muted-foreground">
            {activeQuests.length} active · {completedQuests.length} completed
          </p>
        </div>
        {!showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            New quest
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {/* Create Quest Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New quest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Read chapter 4 of system design book"
                  className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes, steps, or acceptance criteria"
                  className="w-full h-20 rounded-md border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Attribute</label>
                  <select
                    value={formData.attribute}
                    onChange={(e) => setFormData({ ...formData, attribute: e.target.value as Attribute })}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(ATTRIBUTES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create quest'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-secondary rounded-lg" />
          <div className="h-16 bg-secondary rounded-lg" />
          <div className="h-16 bg-secondary rounded-lg" />
        </div>
      ) : (
        <>
          {/* Active Quests */}
          {activeQuests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-sm font-medium text-foreground mb-1">All clear</p>
                <p className="text-xs text-muted-foreground mb-4">You have no active quests right now.</p>
                {!showCreateForm && (
                  <Button size="sm" onClick={() => setShowCreateForm(true)}>
                    Create a quest
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeQuests.map((quest) => (
                <Card key={quest.id} className="hover:border-foreground/20 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{quest.title}</p>
                      {quest.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{quest.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{quest.attribute}</span>
                        <span>·</span>
                        <span className="capitalize">{quest.difficulty}</span>
                        <span>·</span>
                        <span className="text-xp font-medium">+{quest.xp_reward} XP</span>
                        <span>·</span>
                        <span className="text-gold font-medium">+{quest.gold_reward}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCompleteQuest(quest)}
                        disabled={completingId === quest.id}
                      >
                        {completingId === quest.id ? 'Saving…' : 'Done'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteQuest(quest.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div className="pt-6 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Completed
              </p>
              <div className="space-y-1">
                {completedQuests.slice(0, 5).map((quest) => (
                  <div
                    key={quest.id}
                    className="flex items-center justify-between py-2 text-xs text-muted-foreground"
                  >
                    <span className="line-through truncate mr-4">{quest.title}</span>
                    <span className="shrink-0 text-xp">+{quest.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
