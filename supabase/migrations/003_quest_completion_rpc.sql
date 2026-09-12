-- Migration 003: Atomic Quest Completion RPC (Secure version)

-- Drop the old insecure version if it exists
DROP FUNCTION IF EXISTS commit_quest_completion(UUID, UUID, INT, INT, INT, INT, INT, INT, DATE);

CREATE OR REPLACE FUNCTION commit_quest_completion(
  p_quest_id UUID,
  OUT xp_earned INT,
  OUT gold_earned INT,
  OUT attribute_xp_earned INT
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_quest RECORD;
  v_character RECORD;
  v_today DATE := current_date;
  v_base_xp INT;
  v_streak_multiplier NUMERIC;
  v_new_streak INT;
  v_new_longest_streak INT;
  v_new_total_xp INT;
  v_new_level INT;
  v_next_level_total_xp INT;
  v_i INT;
BEGIN
  -- 1. Identify authenticated user safely (TRUST BOUNDARY)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Lock the quest row to prevent race conditions
  SELECT * INTO v_quest
  FROM quests
  WHERE id = p_quest_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found or unauthorized';
  END IF;

  -- 3. Enforce single completion
  IF v_quest.is_completed THEN
    RAISE EXCEPTION 'Quest already completed';
  END IF;

  -- 4. Lock and fetch character
  SELECT * INTO v_character
  FROM characters
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  -- 5. Calculate streak (authoritative)
  IF v_character.last_active_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_character.last_active_date = v_today THEN
    v_new_streak := v_character.current_streak;
  ELSIF v_character.last_active_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_character.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_longest_streak := GREATEST(v_character.longest_streak, v_new_streak);

  -- 6. Calculate base rewards based on difficulty (authoritative)
  CASE v_quest.difficulty
    WHEN 'trivial' THEN v_base_xp := 25; gold_earned := 5;
    WHEN 'easy' THEN v_base_xp := 50; gold_earned := 10;
    WHEN 'medium' THEN v_base_xp := 100; gold_earned := 25;
    WHEN 'hard' THEN v_base_xp := 200; gold_earned := 50;
    WHEN 'epic' THEN v_base_xp := 500; gold_earned := 150;
    ELSE RAISE EXCEPTION 'Invalid difficulty';
  END CASE;

  -- 7. Apply streak multiplier (max 50% bonus) (authoritative)
  v_streak_multiplier := 1.0 + LEAST(v_new_streak * 0.1, 0.5);
  xp_earned := FLOOR(v_base_xp * v_streak_multiplier);
  attribute_xp_earned := FLOOR(xp_earned * 0.2);

  -- 8. Calculate new level (authoritative)
  v_new_total_xp := v_character.total_xp + xp_earned;
  v_new_level := v_character.level;

  LOOP
    -- Calculate total XP required for next level
    v_next_level_total_xp := 0;
    FOR v_i IN 1..v_new_level LOOP
      v_next_level_total_xp := v_next_level_total_xp + FLOOR(100 * POWER(v_i, 1.5));
    END LOOP;

    IF v_new_total_xp >= v_next_level_total_xp THEN
      v_new_level := v_new_level + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 9. Mark quest completed
  UPDATE quests
  SET is_completed = true, completed_at = now()
  WHERE id = p_quest_id;

  -- 10. Record completion audit trail
  INSERT INTO quest_completions (quest_id, user_id, xp_earned, gold_earned, attribute_xp_earned)
  VALUES (p_quest_id, v_user_id, xp_earned, gold_earned, attribute_xp_earned);

  -- 11. Update character
  UPDATE characters
  SET total_xp = v_new_total_xp,
      gold = gold + gold_earned,
      level = v_new_level,
      current_streak = v_new_streak,
      longest_streak = v_new_longest_streak,
      last_active_date = v_today
  WHERE id = v_character.id;

  -- 12. Upsert attribute XP
  INSERT INTO character_attributes (character_id, attribute, xp)
  VALUES (v_character.id, v_quest.attribute, attribute_xp_earned)
  ON CONFLICT (character_id, attribute)
  DO UPDATE SET xp = character_attributes.xp + EXCLUDED.xp;

  -- 13. Upsert daily activity
  INSERT INTO daily_activity (user_id, date)
  VALUES (v_user_id, v_today)
  ON CONFLICT (user_id, date) DO NOTHING;

END;
$$;

-- Secure the function permissions
REVOKE EXECUTE ON FUNCTION commit_quest_completion FROM PUBLIC;
GRANT EXECUTE ON FUNCTION commit_quest_completion TO authenticated;
