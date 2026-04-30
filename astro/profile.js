/**
 * Astro Profile - load + save birth data, prefs, personal/professional/personality fields.
 *
 * Birth data is stored on astro_profiles. Bio + pronouns + birthday are shared with
 * app_users (so they stay in sync with the residents profile).
 */

import { supabase } from '../shared/supabase.js';
import { initAstroPage, showToast, escapeHtml } from './astro-shell.js';

const LOVE_LANGUAGES = [
  'Words of affirmation',
  'Acts of service',
  'Receiving gifts',
  'Quality time',
  'Physical touch',
];

let appUser = null;
let astroProfile = null;
let placeAbortCtrl = null;
let placeDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('profile', async (ctx) => {
    appUser = ctx.appUser;
    astroProfile = ctx.astroProfile;
    renderLoveLanguageChips();
    populateForm();
    bindEvents();
  });
});

function renderLoveLanguageChips() {
  const host = document.getElementById('loveLanguagesChips');
  host.innerHTML = LOVE_LANGUAGES.map((lang) => `
    <label class="astro-chip">
      <input type="checkbox" name="love_languages" value="${escapeHtml(lang)}">
      <span>${escapeHtml(lang)}</span>
    </label>
  `).join('');
}

function populateForm() {
  const ap = astroProfile || {};
  const u = appUser || {};

  // Birth — prefer astro_profiles.birth_date; fall back to app_users.birthday
  setVal('birthDate', ap.birth_date || u.birthday || '');
  setVal('birthTime', ap.birth_time ? ap.birth_time.slice(0, 5) : '');
  document.getElementById('birthTimeUnknown').checked = !ap.birth_time_known;

  setVal('birthPlace', ap.birth_place_name || '');
  setVal('birthTz', ap.birth_tz || guessTz());
  setVal('birthLat', ap.birth_lat ?? '');
  setVal('birthLon', ap.birth_lon ?? '');

  // Prefs
  const prefs = ap.prefs || {};
  setVal('houseSystem', prefs.house_system || 'placidus');
  setVal('ayanamsa', prefs.ayanamsa || 'lahiri');

  // Personal
  setVal('pronouns', u.pronouns || '');
  setVal('relationshipStatus', ap.relationship_status || '');
  setVal('bio', u.bio || '');

  // Professional
  setVal('jobTitle', ap.job_title || '');
  setVal('company', ap.company || '');
  setVal('industry', ap.industry || '');
  setVal('linkedinUrl', ap.linkedin_url || '');
  setVal('skills', (ap.skills || []).join(', '));
  setVal('professionalBio', ap.professional_bio || '');
  setVal('careerGoals', ap.career_goals || '');

  // Personality
  setVal('mbti', ap.mbti || '');
  setVal('enneagram', ap.enneagram || '');
  setVal('hobbies', (ap.hobbies || []).join(', '));
  setVal('personalValues', (ap.personal_values || []).join(', '));

  // Love language chips
  const selected = new Set(ap.love_languages || []);
  document.querySelectorAll('input[name="love_languages"]').forEach((cb) => {
    cb.checked = selected.has(cb.value);
  });
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

function guessTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

function bindEvents() {
  document.getElementById('profileForm').addEventListener('submit', handleSave);
  document.getElementById('resetBtn').addEventListener('click', () => populateForm());

  document.getElementById('birthPlace').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(placeDebounceTimer);
    if (q.length < 3) { hidePlaceResults(); return; }
    placeDebounceTimer = setTimeout(() => searchPlaces(q), 350);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#placeResults') && e.target.id !== 'birthPlace') {
      hidePlaceResults();
    }
  });
}

// =============================================
// Place search — Open-Meteo geocoding (no key required)
// =============================================

async function searchPlaces(query) {
  if (placeAbortCtrl) placeAbortCtrl.abort();
  placeAbortCtrl = new AbortController();
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url, { signal: placeAbortCtrl.signal });
    if (!res.ok) return;
    const data = await res.json();
    showPlaceResults(data.results || []);
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('place search error', err);
  }
}

function showPlaceResults(results) {
  const host = document.getElementById('placeResults');
  if (!results.length) { hidePlaceResults(); return; }
  host.style.display = 'block';
  host.style.cssText += 'display:block;border:1px solid var(--color-aap-border);border-radius:var(--radius-aap);background:#fff;box-shadow:var(--shadow-aap);max-height:240px;overflow:auto;margin-top:0.4rem;';
  host.innerHTML = results.map((r) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
    return `<button type="button" class="astro-place-result" data-lat="${r.latitude}" data-lon="${r.longitude}" data-tz="${r.timezone || ''}" data-label="${escapeHtml(label)}" style="display:block;width:100%;text-align:left;padding:0.5rem 0.75rem;border:none;border-bottom:1px solid var(--color-aap-border);background:transparent;cursor:pointer;font:inherit;color:var(--color-aap-text);">${escapeHtml(label)}</button>`;
  }).join('');
  host.querySelectorAll('.astro-place-result').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('birthPlace').value = btn.dataset.label;
      document.getElementById('birthLat').value = btn.dataset.lat;
      document.getElementById('birthLon').value = btn.dataset.lon;
      document.getElementById('birthTz').value = btn.dataset.tz;
      hidePlaceResults();
    });
    btn.addEventListener('mouseenter', () => btn.style.background = 'var(--color-aap-cream-muted)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
  });
}

function hidePlaceResults() {
  const host = document.getElementById('placeResults');
  if (host) host.style.display = 'none';
}

// =============================================
// Save
// =============================================

async function handleSave(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const f = (id) => document.getElementById(id).value.trim();
    const fNum = (id) => {
      const v = f(id);
      return v === '' ? null : Number(v);
    };
    const csv = (id) => f(id).split(',').map(s => s.trim()).filter(Boolean);

    const loveLanguages = Array.from(
      document.querySelectorAll('input[name="love_languages"]:checked')
    ).map(cb => cb.value);

    const birthDate = f('birthDate') || null;
    const birthTime = f('birthTime') || null;
    const birthTimeKnown = !document.getElementById('birthTimeUnknown').checked && !!birthTime;

    if (!birthDate) {
      showToast('Birth date is required.', 'error');
      return;
    }

    const astroPayload = {
      user_id: appUser.id,
      birth_date: birthDate,
      birth_time: birthTimeKnown ? (birthTime + ':00') : null,
      birth_time_known: birthTimeKnown,
      birth_place_name: f('birthPlace') || null,
      birth_lat: fNum('birthLat'),
      birth_lon: fNum('birthLon'),
      birth_tz: f('birthTz') || null,
      relationship_status: f('relationshipStatus') || null,
      job_title: f('jobTitle') || null,
      company: f('company') || null,
      industry: f('industry') || null,
      skills: csv('skills'),
      linkedin_url: f('linkedinUrl') || null,
      professional_bio: f('professionalBio') || null,
      career_goals: f('careerGoals') || null,
      mbti: f('mbti').toUpperCase() || null,
      enneagram: f('enneagram') || null,
      love_languages: loveLanguages,
      hobbies: csv('hobbies'),
      personal_values: csv('personalValues'),
      prefs: {
        house_system: f('houseSystem') || 'placidus',
        ayanamsa: f('ayanamsa') || 'lahiri',
      },
    };

    const userPayload = {
      pronouns: f('pronouns') || null,
      bio: f('bio') || null,
      birthday: birthDate,
    };

    // Upsert astro_profiles, update app_users in parallel — and invalidate any cached charts
    const [astroRes, userRes, deleteCacheRes] = await Promise.all([
      supabase.from('astro_profiles').upsert(astroPayload, { onConflict: 'user_id' }).select().single(),
      supabase.from('app_users').update(userPayload).eq('id', appUser.id),
      supabase.from('astro_charts_cache').delete().eq('user_id', appUser.id),
    ]);

    if (astroRes.error) throw astroRes.error;
    if (userRes.error) throw userRes.error;
    if (deleteCacheRes.error) console.warn('cache invalidate failed', deleteCacheRes.error);

    astroProfile = astroRes.data;
    showToast('Profile saved. Charts will recompute on next view.', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Save failed', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save profile';
  }
}
