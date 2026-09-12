import { z } from 'zod';
import { Attribute, Difficulty } from '@/types';

export const createQuestSchema = z.object({
  title: z.string().min(1, 'Quest title required').max(100),
  description: z.string().max(500).optional().default(''),
  attribute: z.enum(['intellect', 'strength', 'focus', 'vitality'] as const),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic'] as const),
});

export const updateQuestSchema = createQuestSchema.partial();

export const completeQuestSchema = z.object({
  questId: z.string().uuid('Invalid quest ID'),
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;
export type CompleteQuestInput = z.infer<typeof completeQuestSchema>;
