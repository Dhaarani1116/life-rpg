'use client';

import { useState, useEffect, useId } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createQuest, completeQuest, deleteQuest } from '@/lib/actions/quests';
import { Brain, Dumbbell, Eye, HeartPulse, Check, Sparkles, Target, Compass } from 'lucide-react';
import { Quest, Character, Difficulty, Attribute } from '@/types';
import RewardBurst from '@/components/game/reward-burst';
import LevelUpOverlay from '@/components/game/level-up-overlay';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { getLevelFromXp } from '@/lib/rpg/progression';

const DIFFICULTIES: Record<Difficulty, { label: string }> = {
  trivial: { label: 'Trivial' },
  easy: { label: 'Easy' },
  medium: { label: 'Medium' },
  hard: { label: 'Hard' },
  epic: { label: 'Epic' },
};

// Difficulty badge styling classes
const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  trivial: 'bg-gray-500 text-white',
  easy: 'bg-green-500 text-white',
  medium: 'bg-yellow-500 text-black',
  hard: 'bg-orange-500 text-white',
  epic: 'bg-purple-600 text-white',
};

// Attribute icon mapping
const ATTRIBUTE_ICONS: Record<Attribute, React.ComponentType<{ className?: string }>> = {
  intellect: Brain,
  strength: Dumbbell,
  focus: Eye,
  vitality: HeartPulse,
};

const ATTRIBUTES: Record<Attribute, { label: string }> = {
  intellect: { label: 'Intellect' },
  strength: { label: 'Strength' },
  focus: { label: 'Focus' },
  vitality: { label: 'Vitality' },
};

function isTodayDate(dateString: string): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

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

  const reduced = useReducedMotion();
  const progressLabelId = useId();

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const xpReward = formData.difficulty === 'trivial' ? 25 : formData.difficulty === 'easy' ? 50 : formData.difficulty === 'medium' ? 100 : formData.difficulty === 'hard' ? 200 : 500;
      const goldReward = formData.difficulty === 'trivial' ? 5 : formData.difficulty === 'easy' ? 10 : formData.difficulty === 'medium' ? 25 : formData.difficulty === 'hard' ? 50 : 150;

      const { error: insertError } = await supabase.from('quests').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        attribute: formData.attribute,
        difficulty: formData.difficulty,
        xp_reward: xpReward,
        gold_reward: goldReward,
      });

      if (insertError) throw new Error(insertError.message);

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
      const { data: rpcData, error: rpcError } = await supabase.rpc('commit_quest_completion', {
        p_quest_id: quest.id,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const xpEarned = rpcData.xp_earned;
      const goldEarned = rpcData.gold_earned;
      const attributeXpEarned = rpcData.attribute_xp_earned;

      setRewardData({
        xp: xpEarned,
        gold: goldEarned,
        attrXp: attributeXpEarned,
        attr: quest.attribute as Attribute,
      });
      setShowRewardAnimation(true);

      const oldLevel = getLevelFromXp(character.total_xp);
      const newCharLevel = getLevelFromXp(character.total_xp + xpEarned);

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
      const { error: deleteErr } = await supabase.from('quests').delete().eq('id', questId);
      if (deleteErr) throw new Error(deleteErr.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quest');
    }
  }

  // All Quests separation
  const activeQuests = quests.filter((q) => !q.is_completed);
  const completedQuests = quests.filter((q) => q.is_completed);

  // Today's Adventure separation
  const todayQuests = quests.filter((q) => isTodayDate(q.created_at));
  const totalToday = todayQuests.length;
  const completedToday = todayQuests.filter((q) => q.is_completed).length;
  const firstIncompleteToday = todayQuests.find((q) => !q.is_completed);
  const isAdventureComplete = totalToday > 0 && completedToday === totalToday;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const handleCloseLevelUp = () => {
    setShowLevelUpAnimation(false);
  };

  return (
    <div className="container-safe py-6 sm:py-8 max-w-3xl space-y-8">
      {/* Existing RewardBurst and LevelUpOverlay */}
      <RewardBurst
        isVisible={showRewardAnimation}
        xp={rewardData.xp}
        gold={rewardData.gold}
        attributeXp={rewardData.attrXp}
        attributeName={ATTRIBUTES[rewardData.attr]?.label || ''}
      />
      <LevelUpOverlay isVisible={showLevelUpAnimation} newLevel={newLevel} onClose={handleCloseLevelUp} />

      {/* Global error banner */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: TODAY'S ADVENTURE                                              */}
      {/* ========================================================================= */}
      <section aria-labelledby="todays-adventure-heading" className="space-y-4">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card/90 to-primary/10 p-5 shadow-lg backdrop-blur-sm">
          {/* Subtle decorative glow */}
          <div
            className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2
                  id="todays-adventure-heading"
                  className="font-display text-lg sm:text-xl font-bold tracking-wide text-foreground uppercase"
                >
                  Today&apos;s Adventure
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your missions for today
              </p>
            </div>

            {totalToday > 0 && (
              <div className="flex items-baseline gap-1.5 self-start sm:self-auto bg-background/50 border border-border/60 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-semibold text-foreground">
                  {completedToday} / {totalToday}
                </span>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            )}
          </div>

          {/* Progress Bar (when totalToday > 0) */}
          {totalToday > 0 && (
            <div className="mt-4 pt-3 border-t border-border/40 relative z-10 space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium">
                <span id={progressLabelId} className="text-muted-foreground">
                  Adventure Progress
                </span>
                <span className="text-primary font-semibold">{progressPercent}%</span>
              </div>
              <div
                role="progressbar"
                aria-labelledby={progressLabelId}
                aria-valuenow={completedToday}
                aria-valuemin={0}
                aria-valuemax={totalToday}
                aria-valuetext={`${completedToday} of ${totalToday} missions completed`}
                className="h-2 w-full overflow-hidden rounded-full bg-secondary/80"
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-xp"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={reduced ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading state for Today's Adventure */}
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-20 bg-secondary/50 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Case A: 0 Quests Today */}
            {totalToday === 0 && (
              <Card className="border-dashed border-border/80 bg-card/40">
                <CardContent className="text-center py-8 sm:py-10 space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
                    <Target className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-foreground tracking-wide font-display">
                    NO ADVENTURE YET
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Create your first quest for today and begin your journey.
                  </p>
                  {!showCreateForm && (
                    <div className="pt-2">
                      <Button size="sm" onClick={() => setShowCreateForm(true)}>
                        Create today&apos;s first quest
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Case B: Adventure Complete Celebration Card */}
            {isAdventureComplete && (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-xl border border-xp/40 bg-gradient-to-r from-xp/10 via-card to-gold/10 p-4 sm:p-5 text-center shadow-md"
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center gap-1.5 text-xp font-display text-base sm:text-lg font-bold">
                    <Sparkles className="w-5 h-5 text-gold animate-pulse" aria-hidden="true" />
                    <span>ADVENTURE COMPLETE</span>
                    <Sparkles className="w-5 h-5 text-gold animate-pulse" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You conquered today&apos;s missions. Outstanding discipline, Adventurer!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Case C: Today's Quests List (if any exist) */}
            {totalToday > 0 && (
              <div className="space-y-2.5">
                {todayQuests.map((quest) => {
                  const isCompleted = quest.is_completed;
                  const isCurrentMission = !isCompleted && quest.id === firstIncompleteToday?.id;
                  const isOtherIncomplete = !isCompleted && !isCurrentMission;

                  return (
                    <motion.div
                      layout
                      key={`today-${quest.id}`}
                      transition={{ duration: 0.2 }}
                      className={`relative rounded-lg border transition-all duration-200 overflow-hidden ${
                        isCurrentMission
                          ? 'border-primary shadow-sm shadow-primary/20 bg-card/95 ring-1 ring-primary/40'
                          : isCompleted
                          ? 'border-border/40 bg-card/40 opacity-75'
                          : 'border-border bg-card/70 opacity-90'
                      }`}
                    >
                      {/* Top banner tag for Current Mission */}
                      {isCurrentMission && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/15 border-b border-primary/20 text-primary text-[11px] font-semibold tracking-wider uppercase">
                          <Target className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Current Mission</span>
                        </div>
                      )}

                      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <div
                                className="w-4 h-4 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0"
                                aria-label="Completed"
                              >
                                <Check className="w-3 h-3" />
                              </div>
                            ) : null}
                            <p
                              className={`text-sm font-medium leading-snug ${
                                isCompleted
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              }`}
                            >
                              {quest.title}
                            </p>
                          </div>

                          {quest.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                              {quest.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pl-6">
                            {/* Attribute icon + name */}
                            {(() => {
                              const Icon = ATTRIBUTE_ICONS[quest.attribute];
                              return (
                                <span className="inline-flex items-center mr-1">
                                  <Icon className="w-3 h-3 mr-1" aria-hidden="true" />
                                  <span className="capitalize">{quest.attribute}</span>
                                </span>
                              );
                            })()}
                            {/* Difficulty badge */}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                DIFFICULTY_STYLES[quest.difficulty]
                              }`}
                            >
                              {quest.difficulty}
                            </span>
                            <span className="text-xp font-medium">+{quest.xp_reward} XP</span>
                            <span className="text-gold font-medium">+{quest.gold_reward}g</span>
                          </div>
                        </div>

                        {/* Actions for Today's Quest */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-6 sm:pl-0">
                          {!isCompleted && (
                            <Button
                              size="sm"
                              variant={isCurrentMission ? 'default' : 'secondary'}
                              onClick={() => handleCompleteQuest(quest)}
                              disabled={completingId === quest.id}
                              className="active:scale-95 transition-transform"
                            >
                              {completingId === quest.id ? 'Saving…' : 'Complete'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteQuest(quest.id)}
                            aria-label={`Delete quest ${quest.title}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: ALL QUESTS (PRESERVED FULL EXPERIENCE)                         */}
      {/* ========================================================================= */}
      <section aria-labelledby="all-quests-heading" className="space-y-4 pt-4 border-t border-border/80">
        {/* Header & Create Trigger */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="all-quests-heading" className="text-base sm:text-lg font-semibold text-foreground">
              All Quests
            </h2>
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
                  <motion.div
                    layout
                    key={quest.id}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{quest.title}</p>
                        {quest.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{quest.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                          {/* Attribute icon + name */}
                          {(() => {
                            const Icon = ATTRIBUTE_ICONS[quest.attribute];
                            return (
                              <span className="inline-flex items-center mr-1">
                                <Icon className="w-3 h-3 mr-1" aria-hidden="true" />
                                <span className="capitalize">{quest.attribute}</span>
                              </span>
                            );
                          })()}
                          {/* Difficulty badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_STYLES[quest.difficulty]} mr-1`}>
                            {quest.difficulty}
                          </span>
                          <span className="text-xp font-medium mr-1">+{quest.xp_reward} XP</span>
                          <span className="text-gold font-medium">+{quest.gold_reward}g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCompleteQuest(quest)}
                          disabled={completingId === quest.id}
                          className="active:scale-95 transition-transform"
                        >
                          {completingId === quest.id ? 'Saving…' : 'Done'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteQuest(quest.id)}
                          aria-label={`Delete quest ${quest.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
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
      </section>
    </div>
  );
}
