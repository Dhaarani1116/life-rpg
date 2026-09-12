'use server';

import { getUserFromSession, getServerSupabaseClient } from '@/lib/supabase/server';
import { createQuestSchema } from '@/lib/validators/quests';
import { getQuestXpReward, getQuestGoldReward, getAttributeXpReward } from '@/lib/rpg/progression';
import { revalidatePath } from 'next/cache';
import { Difficulty, Attribute } from '@/types';

/**
 * Create a new quest
 */
export async function createQuest(input: unknown) {
  const parsed = createQuestSchema.parse(input);
  const user = await getUserFromSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const xpReward = getQuestXpReward(parsed.difficulty as Difficulty, 0);
  const goldReward = getQuestGoldReward(parsed.difficulty as Difficulty);

  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase.from('quests').insert({
    user_id: user.id,
    title: parsed.title,
    description: parsed.description,
    attribute: parsed.attribute,
    difficulty: parsed.difficulty,
    xp_reward: xpReward,
    gold_reward: goldReward,
  });

  if (error) {
    throw new Error(`Failed to create quest: ${error.message}`);
  }

  revalidatePath('/dashboard');
  revalidatePath('/quests');

  return data;
}

/**
 * Complete a quest and award rewards
 * Server-side calculation ensures security
 */
export async function completeQuest(questId: string) {
  const user = await getUserFromSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = await getServerSupabaseClient();

  // Fetch the quest
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .eq('user_id', user.id)
    .single();

  if (questError || !quest) {
    throw new Error('Quest not found');
  }

  if (quest.is_completed) {
    throw new Error('Quest already completed');
  }

  // Fetch character and streak info
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!character) {
    throw new Error('Character not found');
  }

  // Get activity for streak calculation
  const { data: activities } = await supabase
    .from('daily_activity')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const currentStreak = character.current_streak || 0;
  const xpReward = getQuestXpReward(quest.difficulty as Difficulty, currentStreak);
  const attributeXpReward = getAttributeXpReward(xpReward);

  // Update quest completion
  const { error: completeError } = await supabase
    .from('quests')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', questId);

  if (completeError) {
    throw new Error('Failed to complete quest');
  }

  // Record completion
  await supabase.from('quest_completions').insert({
    quest_id: questId,
    user_id: user.id,
    xp_earned: xpReward,
    gold_earned: quest.gold_reward,
    attribute_xp_earned: attributeXpReward,
  });

  // Update character stats
  const newTotalXp = character.total_xp + xpReward;
  const newGold = character.gold + quest.gold_reward;

  await supabase
    .from('characters')
    .update({
      total_xp: newTotalXp,
      gold: newGold,
    })
    .eq('id', character.id);

  // Update attribute XP
  await supabase
    .from('character_attributes')
    .update({
      xp: supabase.rpc('increment_xp', {
        attr_xp: attributeXpReward,
      }),
    })
    .eq('character_id', character.id)
    .eq('attribute', quest.attribute);

  // Update daily activity and streak
  const today = new Date().toISOString().split('T')[0];

  // Upsert daily activity record
  const { error: activityError } = await supabase.from('daily_activity').upsert(
    {
      user_id: user.id,
      date: today,
    },
    { onConflict: 'user_id,date' }
  );

  revalidatePath('/dashboard');
  revalidatePath('/quests');

  return {
    xpEarned: xpReward,
    goldEarned: quest.gold_reward,
    attributeXpEarned: attributeXpReward,
  };
}

/**
 * Delete a quest (only if not completed)
 */
export async function deleteQuest(questId: string) {
  const user = await getUserFromSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = await getServerSupabaseClient();

  const { data: quest, error: fetchError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !quest) {
    throw new Error('Quest not found');
  }

  if (quest.is_completed) {
    throw new Error('Cannot delete completed quest');
  }

  const { error: deleteError } = await supabase.from('quests').delete().eq('id', questId);

  if (deleteError) {
    throw new Error('Failed to delete quest');
  }

  revalidatePath('/quests');

  return { success: true };
}
