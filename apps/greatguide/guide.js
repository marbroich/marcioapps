// Great Guide — guide-facing controller.
//
// Routes:
//  /apps/greatguide/guide.html             → tour list (after login)
//  /apps/greatguide/guide.html?tour=GG-... → script view for one tour
//
// Login is a soft password gate suitable for a single-guide demo. For real
// multi-guide auth, swap this for the project's Supabase Auth helpers.

import { POIS, INTERESTS } from './data/pois.js';
import { STRINGS, SUPPORTED, getLang, setLang, t, localize } from './i18n.js';
import { getBrand, applyBrand } from './brand.js';
import { listTours, getTour } from './storage.js';

const brand = getBrand();
applyBrand(brand);

let lang = getLang();
setLang(lang);

// Default access code. In production this is replaced by Supabase Auth or env.
const DEFAULT_GUIDE_PASSWORD = 'guide';

const SESSION_KEY = 'greatguide.guide.session.v1';

const root = document.getElementById('gg-app');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function isAuthed() {
  try { return localStorage.getItem(SESSION_KEY) === 'ok'; } catch { return false; }
}

function setAuthed(v) {
  try {
    if (v) localStorage.setItem(SESSION_KEY, 'ok');
    else   localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function renderHeader() {
  const langButtons = SUPPORTED.map((l) => `
    <button data-lang="${l.id}" aria-pressed="${l.id === lang}" ${l.enabled ? '' : 'disabled'} title="${escapeHtml(l.label)}">
      ${l.short}
    </button>
  `).join('');
  const logoutBtn = isAuthed() ? `<button class="gg-button gg-button--ghost" data-action="logout" style="padding:8px 16px;font-size:13px">${escapeHtml(t(lang, 'guide.logout'))}</button>` : '';
  return `
    <header class="gg-header">
      <div class="gg-header__inner">
        <a href="/apps/greatguide/" class="gg-brand">
          <div class="gg-brand__mark">${brand.logoSvg}</div>
          <div>
            <div class="gg-brand__name">${escapeHtml(localize(lang, brand.name))}</div>
            <div class="gg-brand__tagline">${escapeHtml(localize(lang, brand.tagline))} · ${escapeHtml(t(lang, 'guide.login'))}</div>
          </div>
        </a>
        <div class="gg-header__actions">
          ${logoutBtn}
          <div class="gg-lang" role="group">${langButtons}</div>
        </div>
      </div>
    </header>
  `;
}

function renderLogin(error) {
  return `
    ${renderHeader()}
    <main class="gg-shell">
      <section class="gg-card gg-guide-login">
        <h2 class="gg-card__title">${escapeHtml(t(lang, 'guide.login'))}</h2>
        <p class="gg-card__sub" style="text-align:center">Default password: <code>guide</code></p>
        <div class="gg-field">
          <label class="gg-field__label" for="g-pw">${escapeHtml(t(lang, 'guide.password'))}</label>
          <input class="gg-input" id="g-pw" type="password" placeholder="${escapeHtml(t(lang, 'guide.passwordPh'))}" autofocus />
        </div>
        ${error ? `<div class="gg-error" style="display:block">${escapeHtml(error)}</div>` : ''}
        <div class="gg-actions" style="justify-content:center">
          <button class="gg-button" data-action="login">${escapeHtml(t(lang, 'guide.signIn'))}</button>
        </div>
      </section>
    </main>
  `;
}

function renderList() {
  const tours = listTours();
  const langCode = lang === 'pt' ? 'pt-BR' : 'en-US';
  const items = tours.map((t) => {
    const guests = (t.guests || []).map((g) => g.name || '?').join(', ');
    const created = new Date(t.createdAt).toLocaleString(langCode, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <a href="?tour=${encodeURIComponent(t.id)}" class="gg-guide-tour" data-go="${escapeHtml(t.id)}">
        <span class="gg-guide-tour__id">${escapeHtml(t.id)}</span>
        <div class="gg-guide-tour__main">
          <div class="gg-guide-tour__guests">${escapeHtml(guests)}</div>
          <div class="gg-guide-tour__meta">
            ${t.hours}h · ${(t.stopIds || []).length} ${escapeHtml(STRINGS[lang]?.tour?.stops || 'stops').toLowerCase()} · ${escapeHtml(created)}
          </div>
        </div>
        <span class="gg-guide-tour__chev">→</span>
      </a>
    `;
  }).join('');
  return `
    ${renderHeader()}
    <main class="gg-shell">
      <h1 style="font-size:32px;margin-bottom:24px">${escapeHtml(t(lang, 'guide.tours'))}</h1>
      ${tours.length === 0 ? `<div class="gg-card" style="text-align:center;color:var(--gg-ink-soft)">${escapeHtml(t(lang, 'guide.noTours'))}</div>` : items}
    </main>
  `;
}

function renderTour(tourId) {
  const tour = getTour(tourId);
  if (!tour) {
    return `
      ${renderHeader()}
      <main class="gg-shell">
        <a href="?" class="gg-button gg-button--ghost" style="margin-bottom:16px;display:inline-block">${escapeHtml(t(lang, 'guide.backToTours'))}</a>
        <div class="gg-card">Tour ${escapeHtml(tourId)} not found.</div>
      </main>
    `;
  }
  const stopMap = new Map(POIS.map((p) => [p.id, p]));
  const interestMap = new Map(INTERESTS.map((i) => [i.id, i]));
  const stops = tour.stopIds.map((id) => stopMap.get(id)).filter(Boolean);
  const langCode = tour.lang === 'pt' ? 'pt-BR' : 'en-US';

  // Guest cards with their interest profile
  const guestPills = (tour.guests || []).map((g) => {
    const tops = Object.entries(g.interests || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id, w]) => {
        const it = interestMap.get(id);
        const name = it ? localize(lang, it) : id;
        return `${name} (${w}/5)`;
      }).join(' · ');
    const customs = (g.customInterestNotes || []).join(' · ');
    return `
      <div style="background:var(--gg-sand);padding:14px 18px;border-radius:12px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:2px">${escapeHtml(g.name)} <span style="color:var(--gg-ink-soft);font-weight:400;font-size:13px">· ${escapeHtml(g.email)}</span></div>
        <div style="font-size:13px;color:var(--gg-ink-soft);margin-bottom:6px">
          ${escapeHtml(g.homeCity || '?')} · ${escapeHtml(t(lang, 'profile.partySize'))}: ${g.partySize} · ${escapeHtml(t(lang, 'profile.arrival'))}: ${escapeHtml(new Date(g.arrival).toLocaleDateString(langCode, { weekday: 'short', month: 'short', day: 'numeric' }))}
        </div>
        <div style="font-size:13px"><strong>${escapeHtml(t(lang, 'nav.step2'))}:</strong> ${escapeHtml(tops)}</div>
        ${customs ? `<div style="font-size:13px;margin-top:4px"><strong>+</strong> ${escapeHtml(customs)}</div>` : ''}
      </div>
    `;
  }).join('');

  // Itinerary overview
  const overview = stops.map((stop, i) => {
    const seg = tour.segments?.[i];
    const segLine = i > 0 && seg ? `
      <div class="gg-script-segment">→ ${escapeHtml(t(lang, 'transport.' + seg.mode))} · ${seg.minutes}m · ${seg.km.toFixed(1)} km</div>
    ` : '';
    return `
      ${segLine}
      <div style="display:flex;gap:12px;align-items:baseline;padding:6px 0">
        <div style="background:var(--gg-accent);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${i + 1}</div>
        <div>
          <div style="font-weight:600">${escapeHtml(localize(lang, stop.name))}</div>
          <div style="font-size:13px;color:var(--gg-ink-soft)">${stop.dwellMin}m · ${escapeHtml(stop.address)}</div>
        </div>
      </div>
    `;
  }).join('');

  // Storytelling script — full text per stop
  const scriptParts = stops.map((stop, i) => {
    const driver = tour.drivers?.[i];
    const seg = tour.segments?.[i];
    const segHtml = i > 0 && seg ? `<div class="gg-script-segment">→ ${escapeHtml(t(lang, 'transport.' + seg.mode))} · ${seg.minutes}m · ${seg.km.toFixed(1)} km</div>` : '';
    let scriptText = '';
    if (driver && stop.script?.[driver]) {
      scriptText = localize(lang, stop.script[driver]);
    } else if (stop.script) {
      // No driver matched — pick the strongest script for this stop
      const first = Object.values(stop.script)[0];
      if (first) scriptText = localize(lang, first);
    }
    if (!scriptText) scriptText = localize(lang, stop.blurb);

    const driverLabel = driver ? localize(lang, interestMap.get(driver) || { en: driver, pt: driver }) : '';
    return `
      ${segHtml}
      <div class="gg-script-stop">
        <div class="gg-script-stop__head">
          <div class="gg-script-stop__num">${escapeHtml(t(lang, 'guide.stopOf', { n: i + 1, total: stops.length }))}</div>
        </div>
        <div class="gg-script-stop__name">${escapeHtml(localize(lang, stop.name))}</div>
        <div class="gg-script-stop__addr">📍 ${escapeHtml(stop.address)} · ⏱ ${stop.dwellMin}m</div>
        ${driverLabel ? `<div class="gg-script-stop__driver">${escapeHtml(driverLabel)}</div>` : ''}
        <div class="gg-script-stop__text">${escapeHtml(scriptText)}</div>
      </div>
    `;
  }).join('');

  return `
    ${renderHeader()}
    <main class="gg-shell">
      <a href="?" class="gg-button gg-button--ghost" style="margin-bottom:16px;display:inline-block">${escapeHtml(t(lang, 'guide.backToTours'))}</a>
      <button class="gg-button gg-button--ghost" data-action="print" style="margin-bottom:16px;display:inline-block;margin-left:8px">${escapeHtml(t(lang, 'guide.printItinerary'))}</button>

      <h1 style="font-size:32px;margin-bottom:4px">${escapeHtml(localize(lang, brand.name))} · ${escapeHtml(tour.id)}</h1>
      <p style="color:var(--gg-ink-soft);margin-top:0">${tour.hours}h · ${stops.length} ${escapeHtml(STRINGS[lang]?.tour?.stops || 'stops').toLowerCase()} · ${escapeHtml(t(lang, 'guide.created'))} ${escapeHtml(new Date(tour.createdAt).toLocaleString(langCode))}</p>

      <section class="gg-guide-section">
        <h2>${escapeHtml(t(lang, 'guide.guests'))}</h2>
        ${guestPills}
      </section>

      <section class="gg-guide-section">
        <h2>${escapeHtml(t(lang, 'guide.itinerary'))}</h2>
        ${overview}
      </section>

      <section class="gg-guide-section">
        <h2>${escapeHtml(t(lang, 'guide.script'))}</h2>
        ${scriptParts}
      </section>
    </main>
  `;
}

function bind() {
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('click', () => {
      lang = el.getAttribute('data-lang');
      setLang(lang);
      render();
    });
  });
  document.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const action = el.getAttribute('data-action');
      if (action === 'login') {
        e.preventDefault();
        const pw = document.getElementById('g-pw')?.value || '';
        if (pw === DEFAULT_GUIDE_PASSWORD) {
          setAuthed(true);
          render();
        } else {
          render(t(lang, 'guide.wrongPassword'));
        }
      } else if (action === 'logout') {
        setAuthed(false);
        location.href = '?';
      } else if (action === 'print') {
        window.print();
      }
    });
  });
}

function render(error) {
  if (!root) return;
  if (!isAuthed()) {
    root.innerHTML = renderLogin(error);
    bind();
    return;
  }
  const url = new URL(window.location.href);
  const tourId = url.searchParams.get('tour');
  root.innerHTML = tourId ? renderTour(tourId) : renderList();
  bind();
}

render();

window.addEventListener('greatguide:lang', (e) => {
  lang = e.detail.lang;
  render();
});
