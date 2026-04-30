/**
 * Chart cache helper: read/write `astro_charts_cache` keyed by user_id+system.
 * Recomputes (lazy) when stored hash differs from current birth-input hash.
 */

import { supabase } from '../shared/supabase.js';
import { hashBirthInputs } from './astro-shell.js';

export async function getOrComputeChart({ userId, system, profile, computeFn, force = false }) {
  const currentHash = await hashBirthInputs(profile);

  if (!force) {
    const { data, error } = await supabase
      .from('astro_charts_cache')
      .select('chart_data, source_hash, computed_at')
      .eq('user_id', userId)
      .eq('system', system)
      .maybeSingle();
    if (!error && data && data.source_hash === currentHash) {
      return { chart: data.chart_data, fromCache: true, computedAt: data.computed_at };
    }
  }

  const chart = await computeFn(profile);

  // Write-back; ignore failures (RLS will block in some cases — chart still works in-memory).
  const { error: writeErr } = await supabase
    .from('astro_charts_cache')
    .upsert({
      user_id: userId,
      system,
      chart_data: chart,
      source_hash: currentHash,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,system' });
  if (writeErr) console.warn('chart cache write failed', writeErr);

  return { chart, fromCache: false, computedAt: new Date().toISOString() };
}
