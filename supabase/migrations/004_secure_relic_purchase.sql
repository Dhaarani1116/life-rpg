-- 004_secure_relic_purchase.sql
-- Add unique constraint to inventory and create atomic purchase RPC

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_user_relic_unique'
  ) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_user_relic_unique UNIQUE (user_id, relic_id);
  END IF;
END$$;

DROP FUNCTION IF EXISTS public.purchase_relic(UUID);

CREATE OR REPLACE FUNCTION public.purchase_relic(
  p_relic_id UUID,
  OUT relic_id UUID,
  OUT gold_spent INT,
  OUT remaining_gold INT,
  OUT relic_name TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID := auth.uid();
  v_character RECORD;
  v_relic RECORD;
  v_new_gold INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated user';
  END IF;

  SELECT r.id, r.name, r.cost INTO v_relic FROM public.relics r WHERE r.id = p_relic_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relic not found';
  END IF;

  SELECT c.* INTO v_character FROM public.characters c WHERE c.user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.inventory inv WHERE inv.user_id = v_user_id AND inv.relic_id = p_relic_id) THEN
    RAISE EXCEPTION 'Relic already owned';
  END IF;

  IF v_character.gold < v_relic.cost THEN
    RAISE EXCEPTION 'Insufficient gold';
  END IF;

  v_new_gold := v_character.gold - v_relic.cost;
  UPDATE public.characters SET gold = v_new_gold WHERE id = v_character.id;
  INSERT INTO public.inventory (user_id, relic_id) VALUES (v_user_id, p_relic_id);

  relic_id := v_relic.id;
  gold_spent := v_relic.cost;
  remaining_gold := v_new_gold;
  relic_name := v_relic.name;
END;
$$;

ALTER FUNCTION public.purchase_relic(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.purchase_relic(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_relic(UUID) TO authenticated;
