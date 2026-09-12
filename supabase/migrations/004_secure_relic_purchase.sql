-- 004_secure_relic_purchase.sql
-- Add unique constraint to inventory and create atomic purchase RPC

-- Ensure idempotency: only add constraint if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_user_relic_unique'
  ) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_user_relic_unique UNIQUE (user_id, relic_id);
  END IF;
END$$;

-- Create the purchase_relic function
CREATE OR REPLACE FUNCTION public.purchase_relic(p_relic_id UUID)
RETURNS TABLE (
  relic_id UUID,
  gold_spent INT,
  remaining_gold INT,
  relic_name TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_character RECORD;
  v_relic RECORD;
  v_new_gold INT;
BEGIN
  -- Authentication check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated user';
  END IF;

  -- Load relic
  SELECT id, name, cost INTO v_relic FROM public.relics WHERE id = p_relic_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relic not found';
  END IF;

  -- Load character with row lock
  SELECT * INTO v_character FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  -- Ownership check
  IF EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND relic_id = p_relic_id) THEN
    RAISE EXCEPTION 'Relic already owned';
  END IF;

  -- Gold check
  IF v_character.gold < v_relic.cost THEN
    RAISE EXCEPTION 'Insufficient gold';
  END IF;

  -- Perform deduction and insert
  v_new_gold := v_character.gold - v_relic.cost;
  UPDATE public.characters SET gold = v_new_gold WHERE id = v_character.id;
  INSERT INTO public.inventory (user_id, relic_id) VALUES (v_user_id, p_relic_id);

  -- Return result
  RETURN QUERY SELECT v_relic.id, v_relic.cost, v_new_gold, v_relic.name;
END;
$$;

-- Ensure the function runs with explicit search_path
ALTER FUNCTION public.purchase_relic(UUID) SET search_path = public;

-- Permissions: revoke from public, grant to authenticated role
REVOKE EXECUTE ON FUNCTION public.purchase_relic(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_relic(UUID) TO authenticated;
