/**
 * Synastry page — partner picker + Western inter-aspects + numerology overlap.
 * Privacy: partner's profile is NEVER fetched directly. We only read what
 * `get_synastry_partner_chart` exposes (chart positions + display name).
 */

import { supabase } from '../shared/supabase.js';
import { initAstroPage, showToast, escapeHtml } from './astro-shell.js';
import {
  computeWesternChart, ASPECTS, PLANETS, fmtDeg, signOf,
} from './ephemeris.js';
import { getOrComputeChart } from './chart-cache.js';
import { computeAll, NUMBER_INTERPRETATIONS } from './numerology.js';

let appUser = null;
let astroProfile = null;
let myWestern = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('synastry', async (ctx) => {
    appUser = ctx.appUser;
    astroProfile = ctx.astroProfile;

    if (!astroProfile?.birth_date) {
      document.getElementById('missingData').classList.remove('hidden');
      return;
    }

    await Promise.all([loadMyChart(), loadPartners()]);
    bindEvents();
  });
});

async function loadMyChart() {
  const { chart } = await getOrComputeChart({
    userId: appUser.id,
    system: 'western',
    profile: astroProfile,
    computeFn: computeWesternChart,
  });
  myWestern = chart;
}

async function loadPartners() {
  const { data, error } = await supabase.rpc('list_astro_partners');
  if (error) {
    showToast('Could not load partners.', 'error');
    return;
  }
  const sel = document.getElementById('partnerSelect');
  sel.innerHTML = '<option value="">Select someone…</option>' +
    (data || []).map(r => `<option value="${r.user_id}">${escapeHtml(r.display_name || '(unnamed)')}</option>`).join('');
}

function bindEvents() {
  document.getElementById('partnerSelect').addEventListener('change', () => {
    document.getElementById('runBtn').disabled = !document.getElementById('partnerSelect').value;
  });
  document.getElementById('runBtn').addEventListener('click', runSynastry);
}

async function runSynastry() {
  const errBox = document.getElementById('errorBox');
  errBox.classList.add('hidden');
  const partnerId = document.getElementById('partnerSelect').value;
  if (!partnerId) return;

  const btn = document.getElementById('runBtn');
  btn.disabled = true; btn.textContent = 'Running…';

  try {
    const { data, error } = await supabase.rpc('get_synastry_partner_chart', { partner_user_id: partnerId });
    if (error) throw error;
    const partner = Array.isArray(data) ? data[0] : data;
    if (!partner) throw new Error('Partner data unavailable.');

    // Use cached western chart if present, else compute fresh from partner's birth data.
    let partnerWestern = partner.western_chart;
    if (!partnerWestern) {
      partnerWestern = await computeWesternChart({
        birth_date: partner.birth_date,
        birth_time: partner.birth_time,
        birth_time_known: partner.birth_time_known,
        birth_lat: partner.birth_lat,
        birth_lon: partner.birth_lon,
        birth_tz: partner.birth_tz,
      });
    }

    renderSnapshot(partner, partnerWestern);
    renderInterAspects(myWestern, partnerWestern);
    renderNumOverlap(partner);

    document.getElementById('resultArea').classList.remove('hidden');
  } catch (err) {
    console.error(err);
    errBox.classList.remove('hidden');
    errBox.textContent = err.message || 'Synastry failed.';
  } finally {
    btn.disabled = false; btn.textContent = 'Run synastry';
  }
}

function renderSnapshot(partner, partnerChart) {
  const grid = document.getElementById('snapshotGrid');
  const yourSun = signOf(myWestern.positions.Sun.longitude).name;
  const yourMoon = signOf(myWestern.positions.Moon.longitude).name;
  const theirSun = signOf(partnerChart.positions.Sun.longitude).name;
  const theirMoon = signOf(partnerChart.positions.Moon.longitude).name;

  grid.innerHTML = `
    <div class="astro-stat">
      <p class="astro-stat-label">You</p>
      <p class="astro-stat-value">${escapeHtml(yourSun)} ☉ · ${escapeHtml(yourMoon)} ☽</p>
    </div>
    <div class="astro-stat">
      <p class="astro-stat-label">${escapeHtml(partner.display_name || 'Them')}</p>
      <p class="astro-stat-value">${escapeHtml(theirSun)} ☉ · ${escapeHtml(theirMoon)} ☽</p>
    </div>
    <div class="astro-stat">
      <p class="astro-stat-label">Sun↔Sun element</p>
      <p class="astro-stat-value">${elementCompat(yourSun, theirSun)}</p>
    </div>
    <div class="astro-stat">
      <p class="astro-stat-label">Moon↔Moon element</p>
      <p class="astro-stat-value">${elementCompat(yourMoon, theirMoon)}</p>
    </div>
  `;
}

const ELEMENTS = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};
function elementCompat(a, b) {
  const ea = ELEMENTS[a]; const eb = ELEMENTS[b];
  if (!ea || !eb) return '—';
  if (ea === eb) return `${ea} · ${ea} (resonant)`;
  const friendly = {
    Fire: ['Air'], Air: ['Fire'], Earth: ['Water'], Water: ['Earth'],
  };
  if (friendly[ea]?.includes(eb)) return `${ea} · ${eb} (complementary)`;
  return `${ea} · ${eb} (frictional)`;
}

function renderInterAspects(a, b) {
  const tbody = document.getElementById('interBody');
  const planetKeys = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const rows = [];
  for (const ka of planetKeys) {
    for (const kb of planetKeys) {
      const la = a.positions[ka]?.longitude;
      const lb = b.positions[kb]?.longitude;
      if (la == null || lb == null) continue;
      let diff = Math.abs(la - lb);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          rows.push({ a: ka, b: kb, aspect: asp.name, glyph: asp.glyph, orb });
          break;
        }
      }
    }
  }
  rows.sort((x, y) => x.orb - y.orb);
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--color-aap-text-muted)">No major inter-aspects in orb.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => {
    const ag = PLANETS.find(p => p.key === r.a)?.glyph || '';
    const bg = PLANETS.find(p => p.key === r.b)?.glyph || '';
    return `<tr>
      <td><span class="astro-glyph">${ag}</span> ${escapeHtml(r.a)}</td>
      <td>${escapeHtml(r.aspect)} <span class="astro-glyph">${r.glyph}</span></td>
      <td><span class="astro-glyph">${bg}</span> ${escapeHtml(r.b)}</td>
      <td class="num">${r.orb.toFixed(2)}°</td>
    </tr>`;
  }).join('');
}

function renderNumOverlap(partner) {
  const tbody = document.getElementById('numOverlapBody');
  const myName = [appUser.first_name, appUser.last_name].filter(Boolean).join(' ') || appUser.display_name || '';
  const theirName = document.getElementById('partnerName').value.trim() || partner.display_name || '';
  const myDate = astroProfile.birth_date;
  const myNums = computeAll(myName, myDate);
  const theirNums = (theirName && partner.birth_date) ? computeAll(theirName, partner.birth_date) : null;

  const keys = ['lifePath', 'expression', 'soulUrge', 'birthdayNumber'];
  tbody.innerHTML = keys.map((k) => {
    const my = myNums[k];
    const th = theirNums ? theirNums[k] : null;
    let read;
    if (th == null) read = '—';
    else if (my === th) read = '<strong>Match</strong> — same theme; can amplify or echo each other.';
    else if (Math.abs(my - th) === 0) read = 'Match.';
    else if ((my + th) % 9 === 0 && my !== th) read = 'Complementary.';
    else read = 'Different — varied perspectives.';
    return `<tr>
      <td>${escapeHtml(NUMBER_INTERPRETATIONS[k].title)}</td>
      <td>${my ?? '—'}</td>
      <td>${th ?? '—'}</td>
      <td>${read}</td>
    </tr>`;
  }).join('');
}
