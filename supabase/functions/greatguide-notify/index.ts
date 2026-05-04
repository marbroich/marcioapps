// Edge function — send the "new tour created" email to the guide via Resend.
//
// Trigger from the browser after createTour() completes. Body: { tourId }.
// The function looks up the tour + guests + stop list and sends a formatted
// itinerary email to the guide(s).
//
// Not deployed by default — wire up only after the project's RESEND_API_KEY
// secret is set. Mirrors the pattern in supabase/functions/send-email/.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = Deno.env.get('GREATGUIDE_FROM') || 'noreply@example.com';
const GUIDE_TO = (Deno.env.get('GREATGUIDE_GUIDE_EMAILS') || '').split(',').map((s) => s.trim()).filter(Boolean);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { tourId } = await req.json();
    if (!tourId) return json({ error: 'tourId required' }, 400);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: tour, error: tErr } = await sb.from('greatguide_tours').select('*').eq('id', tourId).single();
    if (tErr || !tour) return json({ error: 'tour not found' }, 404);
    const { data: guests } = await sb.from('greatguide_guests').select('*').eq('tour_id', tourId);

    const subject = `[Great Guide] New tour ${tourId}`;
    const lines: string[] = [];
    lines.push(`Tour ${tourId}`);
    lines.push(`Created: ${tour.created_at}`);
    lines.push('');
    lines.push('Guests:');
    (guests || []).forEach((g: any) => {
      lines.push(`  - ${g.name} <${g.email}> from ${g.home_city || '?'}, party of ${g.party_size}, arriving ${g.arrival}`);
      const tops = Object.entries(g.interests || {})
        .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
        .slice(0, 4)
        .map(([id, w]) => `${id} (${w}/5)`).join(', ');
      if (tops) lines.push(`    interests: ${tops}`);
    });
    lines.push('');
    lines.push(`Duration: ${tour.hours}h · ${tour.stop_ids.length} stops`);
    lines.push('');
    lines.push('Itinerary:');
    tour.stop_ids.forEach((sid: string, i: number) => {
      if (i > 0 && tour.segments?.[i]) {
        const seg = tour.segments[i];
        lines.push(`   → ${seg.minutes}m ${seg.mode} (${seg.km.toFixed(1)} km)`);
      }
      lines.push(`${i + 1}. ${sid}`);
    });

    const body = lines.join('\n');

    const recipients = GUIDE_TO.length ? GUIDE_TO : ['guide@example.com'];

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: recipients,
        subject,
        text: body,
      }),
    });
    const j = await r.json();
    return json({ ok: r.ok, resend: j });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, 'content-type': 'application/json' } });
}
