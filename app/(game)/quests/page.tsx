'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createQuest, completeQuest, deleteQuest } from '@/lib/actions/quests';
import { Quest } from '@/types';
import { motion } from 'framer-motion';
import { Difficulty, Attribute } from '@/types';

const DIFFICULTIES: Record<Difficulty, { label: string; color: string; icon: string }> = {
  trivial: { label: 'Trivial', color: 'bg-gray-500', icon: '⚪' },
  easy: { label: 'Easy', color: 'bg-green-500', icon: '🟢' },
  medium: { label: 'Medium', color: 'bg-yellow-500', icon: '🟡' },
  hard: { label: 'Hard', color: 'bg-red-500', icon: '🔴' },
  epic: { label: 'Epic', color: 'bg-purple-500', icon: '🟣' },
};

const ATTRIBUTES: Record<Attribute, { label: string; icon: string; color: string }> = {
  intellect: { label: 'Intellect', icon: '🧠', color: 'text-purple-400' },
  strength: { label: 'Strength', icon: '💪', color: 'text-red-400' },
  focus: { label: 'Focus', icon: '🎯', color: 'text-cyan-400' },
  vitality: { label: 'Vitality', icon: '❤️', color: 'text-emerald-400' },
};

export default function QuestsPage() {
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

  useEffect(() => {
    loadQuests();
  }, []);

  async function loadQuests() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQuests(data || []);
    } catch (err) {
      console.error('Failed to load quests:', err);
      setError('Failed to load quests');
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
      await loadQuests();
    } catch (err: any) {
      setError(err.message || 'Failed to create quest');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      await completeQuest(questId);
      await loadQuests();
    } catch (err: any) {
      setError(err.message || 'Failed to complete quest');
    }
  }

  async function handleDeleteQuest(questId: string) {
    try {
      await deleteQuest(questId);
      await loadQuests();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quest');
    }
  }

  const activeQuests = quests.filter((q) => !q.is_completed);
  const completedQuests = quests.filter((q) => q.is_completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="container-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">📜 Quests</h1>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

        {/* Create Quest Form */}
        {showCreateForm && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white mb-8">
            <CardHeader>
              <CardTitle>New Quest</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateQuest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quest Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Complete your daily workout"
                    className="input w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details about this quest"
                    className="input w-full bg-white/10 border-white/20 text-white placeholder-gray-400 h-24 resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Attribute</label>
                    <select
                      value={formData.attribute}
                      onChange={(e) => setFormData({ ...formData, attribute: e.target.value as Attribute })}
                      className="input w-full bg-white/10 border-white/20 text-white"
                    >
                      {(Object.entries(ATTRIBUTES) as [Attribute, any][]).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                      className="input w-full bg-white/10 border-white/20 text-white"
                    >
                      {(Object.entries(DIFFICULTIES) as [Difficulty, any][]).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    {submitting ? 'Creating...' : 'Create Quest'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1 text-white border-white/30 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="mb-8 bg-amber-600 hover:bg-amber-700">
            + New Quest
          </Button>
        )}

        {loading ? (
          <div className="text-white text-center py-12">Loading quests...</div>
        ) : (
          <>
            {/* Active Quests */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Active Quests ({activeQuests.length})</h2>
              {activeQuests.length === 0 ? (
                <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-300">No active quests. Create one to begin!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeQuests.map((quest, idx) => (
                    <motion.div key={quest.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all text-white">
                        <CardContent className="py-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{quest.title}</h3>
                              {quest.description && <p className="text-gray-300 text-sm mb-3">{quest.description}</p>}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-sm ${ATTRIBUTES[quest.attribute as Attribute].color}`}>
                                  {ATTRIBUTES[quest.attribute as Attribute].icon} {ATTRIBUTES[quest.attribute as Attribute].label}
                                </span>
                                <span className="text-sm text-amber-400">
                                  {DIFFICULTIES[quest.difficulty as Difficulty].icon} {DIFFICULTIES[quest.difficulty as Difficulty].label}
                                </span>
                                <span className="text-sm text-green-400">+{quest.xp_reward} XP</span>
                                <span className="text-sm text-yellow-400">+{quest.gold_reward} Gold</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleCompleteQuest(quest.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                ✓ Complete
                              </Button>
                              <Button
                                onClick={() => handleDeleteQuest(quest.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Quests */}
            {completedQuests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Completed ({completedQuests.length})</h2>
                <div className="space-y-4 opacity-60">
                  {completedQuests.slice(0, 5).map((quest) => (
                    <Card key={quest.id} className="bg-white/10 border-white/20 backdrop-blur-md text-white">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-green-400">✓</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{quest.title}</h4>
                            <p className="text-xs text-gray-400">
                              Completed {new Date(quest.completed_at!).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-sm text-amber-400">+{quest.xp_reward} XP</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
