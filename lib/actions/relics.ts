import { getServerSupabaseClient } from '@/lib/supabase/server';
import { Relic } from '@/types';

/**
 * Calls the secure RPC `purchase_relic` to atomically purchase a relic.
 * The client only provides the relic id; all other data is resolved on the server.
 *
 * @param relicId UUID of the relic to purchase
 * @returns The RPC result containing relic_id, gold_spent, remaining_gold, relic_name
 * @throws Error with a friendly message if the RPC fails.
 */
export async function purchaseRelic(relicId: string) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.rpc('purchase_relic', { p_relic_id: relicId });
  if (error) {
    // Translate DB error messages to user‑friendly messages
    const msg = error.message.includes('Unauthenticated')
      ? 'You need to be logged in to purchase relics.'
      : error.message.includes('Relic not found')
      ? 'This relic does not exist.'
      : error.message.includes('Insufficient gold')
      ? 'Not enough gold to buy this relic.'
      : error.message.includes('Relic already owned')
      ? 'You already own this relic.'
      : 'Failed to purchase relic.';
    throw new Error(msg);
  }
  return data;
}
