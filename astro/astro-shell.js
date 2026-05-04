/**
 * Astro Shell - lightweight auth gate + chrome for the /astro/ section.
 *
 * Each astro page imports `initAstroPage(activeId, onReady)` and wraps its
 * setup in the onReady callback. The shell:
 *  - waits for Supabase to be available
 *  - confirms there's an authenticated session, else redirects to /login/
 *  - loads the current app_user record
 *  - calls `ensure_astro_profile()` so the user has a row to read/write
 *  - renders the astro section header + sub-nav into #astroHeader
 *  - reveals #appContent and hides #loadingOverlay
 *  - exposes `showToast(msg, type)` for page code
 */

import { supabase } from '../shared/supabase.js';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  href: 'index.html' },
  { id: 'profile',    label: 'Profile',    href: 'profile.html' },
  { id: 'numerology', label: 'Numerology', href: 'numerology.html' },
  { id: 'western',    label: 'Western',    href: 'western.html' },
  { id: 'vedic',      label: 'Vedic',      href: 'vedic.html' },
  { id: 'synastry',   label: 'Synastry',   href: 'synastry.html' },
];

let _appUser = null;
let _astroProfile = null;

export function getAppUser() { return _appUser; }
export function getAstroProfile() { return _astroProfile; }

/**
 * Initialize an astro page. Call from DOMContentLoaded.
 * @param {string} activeId - one of NAV_ITEMS ids (dashboard|profile|...)
 * @param {(ctx: {appUser, astroProfile}) => Promise<void>} onReady
 */
export async function initAstroPage(activeId, onReady) {
  try {
    // 1. Session check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    // 2. Load app_user record
    const { data: appUser, error: userErr } = await supabase
      .from('app_users')
      .select('id, display_name, first_name, last_name, email, avatar_url, bio, pronouns, birthday, role, links')
      .eq('id', session.user.id)
      .single();

    if (userErr || !appUser) {
      showFatal('Could not load your profile.');
      return;
    }
    _appUser = appUser;

    // 3. Ensure an astro_profiles row exists for this user
    const { data: ensured, error: ensureErr } = await supabase.rpc('ensure_astro_profile');
    if (ensureErr) {
      console.warn('ensure_astro_profile failed:', ensureErr);
    }
    _astroProfile = Array.isArray(ensured) ? ensured[0] : ensured;

    // 4. Render header
    renderHeader(activeId);

    // 5. Reveal content
    document.getElementById('loadingOverlay')?.classList.add('hidden');
    document.getElementById('appContent')?.classList.remove('hidden');

    // 6. Run page setup
    await onReady({ appUser: _appUser, astroProfile: _astroProfile });
  } catch (err) {
    console.error('Astro shell init failed:', err);
    showFatal('Something went wrong loading the page.');
  }
}

function renderHeader(activeId) {
  const host = document.getElementById('astroHeader');
  if (!host) return;

  const navHtml = NAV_ITEMS.map(item => {
    const active = item.id === activeId;
    const cls = active
      ? 'astro-nav-link astro-nav-link--active'
      : 'astro-nav-link';
    return `<a href="${item.href}" class="${cls}">${item.label}</a>`;
  }).join('');

  host.innerHTML = `
    <div class="astro-header-bar">
      <div class="astro-header-inner">
        <img src="/branding/esoyou-logo.svg" alt="EsoYou" class="astro-header-logo">
        <h1 class="astro-header-title">EsoYou</h1>
        <div class="astro-header-user">
          ${_appUser?.avatar_url
            ? `<img src="${_appUser.avatar_url}" alt="" class="astro-header-avatar">`
            : `<div class="astro-header-avatar astro-header-avatar--placeholder">${(_appUser?.display_name || '?').charAt(0).toUpperCase()}</div>`}
          <span class="astro-header-name">${escapeHtml(_appUser?.display_name || _appUser?.email || '')}</span>
        </div>
      </div>
      <nav class="astro-nav" aria-label="Astro section">
        ${navHtml}
      </nav>
    </div>
  `;
}

function showFatal(msg) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.innerHTML = `<div class="astro-fatal"><p>${escapeHtml(msg)}</p><a href="/residents/profile.html" class="astro-btn">Back</a></div>`;
  }
}

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `astro-toast astro-toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('astro-toast--in'));
  setTimeout(() => {
    toast.classList.remove('astro-toast--in');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Hash birth inputs to detect when chart cache is stale. Stable order matters.
 */
export async function hashBirthInputs(profile) {
  const key = JSON.stringify({
    d: profile?.birth_date || null,
    t: profile?.birth_time || null,
    tk: !!profile?.birth_time_known,
    lat: profile?.birth_lat ?? null,
    lon: profile?.birth_lon ?? null,
    tz: profile?.birth_tz || null,
    hs: profile?.prefs?.house_system || 'placidus',
    ay: profile?.prefs?.ayanamsa || 'lahiri',
  });
  const buf = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
