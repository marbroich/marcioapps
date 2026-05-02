// Email handoff. In a real deployment this calls the Supabase send-email edge
// function (Resend). Here in the demo build we open a mailto: with the body
// pre-filled so the user can confirm and send themselves.
//
// To switch to Resend in production, set window.GREATGUIDE_USE_RESEND = true
// and configure SUPABASE_FUNCTIONS_URL in your env.

import { POIS } from './data/pois.js';
import { localize } from './i18n.js';

function plainItinerary(tour, lang) {
  const stopMap = new Map(POIS.map((p) => [p.id, p]));
  const lines = [];
  lines.push(`Tour ${tour.id}`);
  lines.push('');
  lines.push('Guests:');
  (tour.guests || []).forEach((g) => {
    lines.push(`  - ${g.name} <${g.email}> from ${g.homeCity}, party of ${g.partySize}, arriving ${g.arrival}`);
    const tops = Object.entries(g.interests || {})
      .sort(([, a], [, b]) => b - a).slice(0, 4)
      .map(([id, w]) => `${id} (${w}/5)`).join(', ');
    if (tops) lines.push(`    interests: ${tops}`);
  });
  lines.push('');
  lines.push(`Duration requested: ${tour.hours} hours`);
  lines.push('');
  lines.push('Itinerary:');
  tour.stopIds.forEach((id, i) => {
    const stop = stopMap.get(id);
    if (!stop) return;
    if (i > 0 && tour.segments?.[i]) {
      const seg = tour.segments[i];
      lines.push(`   → ${seg.minutes} min ${seg.mode} (${seg.km.toFixed(1)} km)`);
    }
    lines.push(`${i + 1}. ${localize(lang, stop.name)} — ${stop.dwellMin} min`);
    lines.push(`   ${stop.address}`);
  });
  return lines.join('\n');
}

export function emailGuideOnTourCreated(tour, lang, brand) {
  const body = plainItinerary(tour, lang);
  const subject = `[${brand?.name?.en || 'Great Guide'}] New tour ${tour.id}`;
  const recipients = (brand?.notifyOnTour || []).join(',');
  const url = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

// Build a mailto: invite for an additional guest. We embed the tour ID and
// flag in the URL so when the recipient opens the link they land on the
// interest form already linked to the tour.
export function emailGuestInvite({ tour, recipientEmail, recipientName, fromName, lang, brand }) {
  const link = `${window.location.origin}/apps/greatguide/?tour=${encodeURIComponent(tour.id)}&join=1${recipientName ? `&name=${encodeURIComponent(recipientName)}` : ''}&lang=${lang}`;
  const ptCopy = `Olá ${recipientName || ''},

${fromName} criou um tour particular de ${tour.hours}h em ${brand?.name?.pt || 'Caraguatatuba'} e gostaria que você participasse. Conte seus interesses para que o roteiro encaixe os dois:

${link}

— ${brand?.name?.pt || 'Hotel'}
`;
  const enCopy = `Hi ${recipientName || ''},

${fromName} put together a private ${tour.hours}-hour tour in ${brand?.name?.en || 'Caraguatatuba'} and wants you on it. Take a minute to tell us what you'd like to see, and the tour will balance both of your interests:

${link}

— ${brand?.name?.en || 'Hotel'}
`;
  const body = lang === 'pt' ? ptCopy : enCopy;
  const subject = lang === 'pt'
    ? `Convite para tour particular — ${brand?.name?.pt || 'Hotel'}`
    : `You're invited on a private tour — ${brand?.name?.en || 'Hotel'}`;
  const url = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
  return link;
}
