export type Attribute = 'intellect' | 'strength' | 'focus' | 'vitality';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Database models
export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Character {
  id: string;
  user_id: string;
  level: number;
  total_xp: number;
  gold: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  created_at: string;
}

export interface CharacterAttribute {
  id: string;
  character_id: string;
  attribute: Attribute;
  xp: number;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  attribute: Attribute;
  difficulty: Difficulty;
  xp_reward: number;
  gold_reward: number;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface QuestCompletion {
  id: string;
  quest_id: string;
  user_id: string;
  xp_earned: number;
  gold_earned: number;
  attribute_xp_earned: number;
  completed_at: string;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  icon: string;
  rarity: RelicRarity;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  relic_id: string;
  acquired_at: string;
  relic: Relic;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  date: string;
}

// UI types
export interface CharacterStats {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  attributes: Record<Attribute, number>;
}

export interface QuestWithCompletion extends Quest {
  completions_count?: number;
}
