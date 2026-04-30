/**
 * Astro dashboard — overview cards + at-a-glance computed snapshot.
 */

import { initAstroPage, escapeHtml } from './astro-shell.js';
import { computeWesternChart, computeVedicChart, signOf } from './ephemeris.js';
import { computeAll } from './numerology.js';
import { getOrComputeChart } from './chart-cache.js';

let appUser = null;
let astroProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('dashboard', async (ctx) => {
    appUser = ctx.appUser;
    astroProfile = ctx.astroProfile;

    document.getElementById('greeting').textContent =
      `Hi ${appUser.first_name || appUser.display_name || 'there'}.`;
    document.getElementById('subtitle').textContent =
      'Your astrological + numerological dashboard.';

    if (appUser.role === 'admin') {
      document.getElementById('adminArea').classList.remove('hidden');
    }

    if (!astroProfile?.birth_date) {
      document.getElementById('setupNotice').classList.remove('hidden');
      document.getElementById('snapshotGrid').innerHTML =
        '<div class="astro-stat" style="grid-column:1/-1"><p class="astro-stat-label">Setup needed</p><p class="astro-stat-value" style="font-size:1rem">Add birth date on profile</p></div>';
      return;
    }

    await renderSnapshot();
  });
});

async function renderSnapshot() {
  const grid = document.getElementById('snapshotGrid');
  grid.innerHTML = '<div class="astro-stat" style="grid-column:1/-1"><p class="astro-stat-label">Computing…</p></div>';

  try {
    // Numerology (instant)
    const fullName = [appUser.first_name, appUser.last_name].filter(Boolean).join(' ') || appUser.display_name || '';
    const nums = computeAll(fullName, astroProfile.birth_date);

    // Charts (lazy / cached)
    const [westRes, vedRes] = await Promise.all([
      getOrComputeChart({ userId: appUser.id, system: 'western', profile: astroProfile, computeFn: computeWesternChart }),
      getOrComputeChart({ userId: appUser.id, system: 'vedic',   profile: astroProfile, computeFn: computeVedicChart }),
    ]);
    const w = westRes.chart;
    const v = vedRes.chart;

    grid.innerHTML = [
      stat('Sun', signOf(w.positions.Sun.longitude).name, w.positions.Sun.retrograde ? '℞' : null),
      stat('Moon', signOf(w.positions.Moon.longitude).name),
      w.angles ? stat('Rising', signOf(w.angles.ascendant).name) : stat('Rising', '—', 'birth time needed'),
      stat('Vedic Sun', signOf(v.positions.Sun.longitude).name, 'sidereal'),
      stat('Nakshatra', v.nakshatra ? v.nakshatra.name : '—', v.nakshatra ? `pada ${v.nakshatra.pada}` : null),
      stat('Mahadasha', v.dasha?.current_md ? v.dasha.current_md.lord : '—', v.dasha?.current_md ? `until ${v.dasha.current_md.end.slice(0,10)}` : null),
      stat('Life Path', String(nums.lifePath ?? '—')),
      stat('Personal Year', String(nums.personalYear ?? '—'), `for ${new Date().getFullYear()}`),
    ].join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="astro-stat" style="grid-column:1/-1"><p class="astro-stat-label">Error</p><p class="astro-stat-value" style="font-size:0.95rem;color:var(--color-aap-error)">${escapeHtml(err.message || 'Could not compute')}</p></div>`;
  }
}

function stat(label, value, sub) {
  return `<div class="astro-stat">
    <p class="astro-stat-label">${escapeHtml(label)}</p>
    <p class="astro-stat-value">${escapeHtml(value)}</p>
    ${sub ? `<p class="astro-stat-sub">${escapeHtml(sub)}</p>` : ''}
  </div>`;
}
