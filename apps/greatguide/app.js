// Great Guide — guest-facing controller.
//
// State machine:  welcome → profile → interests → generating → tour
// State persists in `state` object; rendered into #gg-app on each transition.

import { INTERESTS, POIS, CITY } from './data/pois.js';
import { STRINGS, SUPPORTED, getLang, setLang, t, localize } from './i18n.js';
import { getBrand, applyBrand } from './brand.js';
import { generateItinerary } from './itinerary.js';
import { createTour, getTour, addGuest } from './storage.js';
import { emailGuideOnTourCreated, emailGuestInvite } from './email.js';

const brand = getBrand();
applyBrand(brand);

let lang = getLang();
setLang(lang);

const state = {
  step: 'welcome',           // welcome | profile | interests | generating | tour
  tourId: null,              // existing tour id if joining as additional guest
  guest: emptyGuest(),       // guest currently being collected
  duration: 3,               // hours
  customInterests: [],       // user-added interests for THIS guest
  generatedTour: null,       // result of generateItinerary
  showAddGuest: false,
  addGuestStatus: null,      // null | 'sent'
};

function emptyGuest() {
  return {
    name: '',
    email: '',
    homeCity: '',
    arrival: defaultArrivalDate(),
    partySize: 2,
    interests: {},           // { interestId: 1..5 }
    customInterestNotes: [], // string list
  };
}

function defaultArrivalDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Detect "joining" mode from URL: ?tour=GG-...&join=1
function detectJoinMode() {
  const url = new URL(window.location.href);
  const tourId = url.searchParams.get('tour');
  const join = url.searchParams.get('join');
  const name = url.searchParams.get('name');
  if (tourId && join === '1') {
    state.tourId = tourId;
    state.guest.name = name || '';
    state.step = 'profile';
  }
}
detectJoinMode();

const root = document.getElementById('gg-app');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmt(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

function render() {
  if (!root) return;
  let html = '';
  if (state.step === 'welcome') html = renderWelcome();
  else if (state.step === 'profile') html = renderProfile();
  else if (state.step === 'interests') html = renderInterests();
  else if (state.step === 'generating') html = renderGenerating();
  else if (state.step === 'tour') html = renderTour();
  root.innerHTML = html;
  bind();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderHeader() {
  const langButtons = SUPPORTED.map((l) => `
    <button data-lang="${l.id}" aria-pressed="${l.id === lang}" ${l.enabled ? '' : 'disabled'} title="${escapeHtml(l.label)}">
      ${l.short}
    </button>
  `).join('');
  return `
    <header class="gg-header">
      <div class="gg-header__inner">
        <a href="/apps/greatguide/" class="gg-brand">
          <div class="gg-brand__mark">${brand.logoSvg}</div>
          <div>
            <div class="gg-brand__name">${escapeHtml(localize(lang, brand.name))}</div>
            <div class="gg-brand__tagline">${escapeHtml(localize(lang, brand.tagline))}</div>
          </div>
        </a>
        <div class="gg-header__actions">
          <div class="gg-lang" role="group" aria-label="${escapeHtml(t(lang,'common.language'))}">
            ${langButtons}
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderSteps(active) {
  const steps = [
    { id: 'profile',   label: t(lang, 'nav.step1') },
    { id: 'interests', label: t(lang, 'nav.step2') },
    { id: 'tour',      label: t(lang, 'nav.step3') },
  ];
  const order = ['profile', 'interests', 'tour'];
  const activeIdx = order.indexOf(active);
  return `
    <div class="gg-steps">
      ${steps.map((s, i) => {
        const cls = i === activeIdx ? 'gg-step--active'
                  : i < activeIdx ? 'gg-step--done'
                  : '';
        return `
          ${i > 0 ? '<div class="gg-steps__sep"></div>' : ''}
          <div class="gg-step ${cls}"><span class="gg-step__num">${i + 1}</span><span>${escapeHtml(s.label)}</span></div>
        `;
      }).join('')}
    </div>
  `;
}

function renderWelcome() {
  return `
    ${renderHeader()}
    <main class="gg-welcome">
      <div class="gg-welcome__card">
        <div class="gg-eyebrow">${escapeHtml(t(lang, 'welcome.eyebrow'))}</div>
        <h1 class="gg-h1">${escapeHtml(t(lang, 'welcome.title'))}</h1>
        <p class="gg-lede">${escapeHtml(t(lang, 'welcome.lede'))}</p>
        <button class="gg-button" data-action="start">
          ${escapeHtml(t(lang, 'welcome.cta'))}
          <span aria-hidden="true">→</span>
        </button>
        <div class="gg-welcome__meta">${escapeHtml(t(lang, 'welcome.duration'))}</div>
      </div>
    </main>
  `;
}

function renderProfile() {
  return `
    ${renderHeader()}
    <main class="gg-shell">
      ${renderSteps('profile')}
      <section class="gg-card">
        <h2 class="gg-card__title">${escapeHtml(t(lang, 'profile.title'))}</h2>
        <p class="gg-card__sub">${escapeHtml(t(lang, 'profile.sub'))}</p>

        <div class="gg-row">
          <div class="gg-field">
            <label class="gg-field__label" for="g-name">${escapeHtml(t(lang, 'profile.name'))}</label>
            <input class="gg-input" id="g-name" placeholder="${escapeHtml(t(lang, 'profile.namePh'))}" value="${escapeHtml(state.guest.name)}" required />
          </div>
          <div class="gg-field">
            <label class="gg-field__label" for="g-email">${escapeHtml(t(lang, 'profile.email'))}</label>
            <input class="gg-input" id="g-email" type="email" placeholder="${escapeHtml(t(lang, 'profile.emailPh'))}" value="${escapeHtml(state.guest.email)}" required />
          </div>
        </div>

        <div class="gg-field">
          <label class="gg-field__label" for="g-city">${escapeHtml(t(lang, 'profile.homeCity'))}</label>
          <input class="gg-input" id="g-city" placeholder="${escapeHtml(t(lang, 'profile.homeCityPh'))}" value="${escapeHtml(state.guest.homeCity)}" />
        </div>

        <div class="gg-row">
          <div class="gg-field">
            <label class="gg-field__label" for="g-arrival">${escapeHtml(t(lang, 'profile.arrival'))}</label>
            <input class="gg-input" id="g-arrival" type="date" value="${escapeHtml(state.guest.arrival)}" />
          </div>
          <div class="gg-field">
            <label class="gg-field__label" for="g-party">${escapeHtml(t(lang, 'profile.partySize'))}</label>
            <input class="gg-input" id="g-party" type="number" min="1" max="20" value="${state.guest.partySize}" />
          </div>
        </div>

        <div class="gg-actions">
          <span></span>
          <button class="gg-button" data-action="profile-next">${escapeHtml(t(lang, 'profile.next'))} →</button>
        </div>
        <div id="gg-error" class="gg-error" style="display:none"></div>
      </section>
    </main>
  `;
}

function renderInterests() {
  const interestCards = INTERESTS.map((it) => {
    const w = state.guest.interests[it.id] || 0;
    const fillPct = (w / 5) * 100;
    const label = w === 0 ? t(lang, 'interests.noInterest')
                : w <= 2  ? t(lang, 'interests.mild')
                : w <= 4  ? t(lang, 'interests.strong')
                :           t(lang, 'interests.mustDo');
    return `
      <div class="gg-interest ${w > 0 ? 'gg-interest--active' : ''}" data-interest="${it.id}" style="--gg-fill: ${fillPct}%">
        <div class="gg-interest__head">
          <span class="gg-interest__icon">${it.icon}</span>
          <span class="gg-interest__name">${escapeHtml(localize(lang, it))}</span>
          <span class="gg-interest__weight ${w >= 4 ? 'gg-interest__weight--hot' : ''}">${escapeHtml(label)}</span>
        </div>
        <input type="range" min="0" max="5" step="1" value="${w}" data-interest-slider="${it.id}" />
      </div>
    `;
  }).join('');

  const customList = state.guest.customInterestNotes.map((c, i) => `
    <span class="gg-guest-pill"><span class="gg-guest-pill__name">${escapeHtml(c)}</span> <button data-rm-custom="${i}" style="background:none;border:0;cursor:pointer;color:inherit;font-size:14px;margin-left:4px;" aria-label="remove">×</button></span>
  `).join('');

  const hours = state.duration;
  const hourPills = [1, 2, 3, 4, 5, 6, 8].map((h) => `
    <button class="gg-hour-pill ${h === hours ? 'gg-hour-pill--active' : ''}" data-hours="${h}">
      ${h} ${escapeHtml(h === 1 ? t(lang, 'interests.hour') : t(lang, 'interests.hours'))}
    </button>
  `).join('');

  return `
    ${renderHeader()}
    <main class="gg-shell">
      ${renderSteps('interests')}
      <section class="gg-card">
        <h2 class="gg-card__title">${escapeHtml(t(lang, 'interests.title'))}</h2>
        <p class="gg-card__sub">${escapeHtml(t(lang, 'interests.sub'))}</p>

        <div class="gg-interests">${interestCards}</div>

        <div class="gg-add-custom">
          <input class="gg-input" id="gg-custom-input" placeholder="${escapeHtml(t(lang, 'interests.addCustomPh'))}" />
          <button data-action="add-custom">${escapeHtml(t(lang, 'interests.addCustomBtn'))}</button>
        </div>
        ${customList ? `<div class="gg-guests-pills" style="margin-bottom:24px">${customList}</div>` : ''}

        <div class="gg-duration">
          <div class="gg-duration__label">${escapeHtml(t(lang, 'interests.duration'))}</div>
          <div class="gg-duration__hours">${hourPills}</div>
        </div>

        <div class="gg-actions">
          <button class="gg-button gg-button--ghost" data-action="back-to-profile">← ${escapeHtml(t(lang, 'interests.back'))}</button>
          <button class="gg-button" data-action="generate">${escapeHtml(t(lang, 'interests.next'))}</button>
        </div>
        <div id="gg-error" class="gg-error" style="display:none"></div>
      </section>
    </main>
  `;
}

function renderGenerating() {
  const interestCount = Object.values(state.guest.interests).filter((v) => v > 0).length;
  return `
    ${renderHeader()}
    <main class="gg-shell">
      ${renderSteps('tour')}
      <section class="gg-card gg-generating">
        <div class="gg-generating__spinner"></div>
        <div class="gg-generating__title">${escapeHtml(t(lang, 'tour.generating'))}</div>
        <div class="gg-generating__sub">${escapeHtml(t(lang, 'tour.generatingSub', { n: interestCount, m: POIS.length }))}</div>
      </section>
    </main>
  `;
}

function renderTour() {
  const tour = state.generatedTour;
  if (!tour) return renderWelcome();
  const stopMap = new Map(POIS.map((p) => [p.id, p]));
  const stops = tour.stopIds.map((id) => stopMap.get(id)).filter(Boolean);
  const stopsHtml = stops.map((stop, i) => {
    const driver = tour.drivers?.[i];
    const driverScript = driver && stop.script?.[driver] ? localize(lang, stop.script[driver]) : '';
    const seg = tour.segments?.[i];
    const segHtml = i > 0 && seg ? `
      <div class="gg-segment">
        <span>${escapeHtml(t(lang, 'transport.' + seg.mode))} • ${seg.minutes}m • ${seg.km.toFixed(1)} km</span>
        <span class="gg-segment__line"></span>
      </div>
    ` : '';
    return `
      ${segHtml}
      <details class="gg-stop">
        <summary class="gg-stop__head">
          <div class="gg-stop__num">${i + 1}</div>
          <div class="gg-stop__main">
            <div class="gg-stop__name">${escapeHtml(localize(lang, stop.name))}</div>
            <div class="gg-stop__blurb">${escapeHtml(localize(lang, stop.blurb))}</div>
            <div class="gg-stop__meta">
              <span class="gg-stop__meta-item">⏱ ${stop.dwellMin}m</span>
              <span class="gg-stop__meta-item">📍 ${escapeHtml(stop.address)}</span>
            </div>
          </div>
          <svg class="gg-stop__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </summary>
        <div class="gg-stop__body">
          ${driverScript ? `<p>${escapeHtml(driverScript)}</p>` : `<p>${escapeHtml(localize(lang, stop.blurb))}</p>`}
        </div>
      </details>
    `;
  }).join('');

  const arrivalDate = new Date(state.guest.arrival).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const subtitle = t(lang, 'tour.subtitle', {
    hours: `${tour.hours}h`,
    stops: stops.length,
    start: arrivalDate,
  });

  const addGuest = state.showAddGuest ? `
    <div class="gg-addguest">
      <h3>${escapeHtml(t(lang, 'tour.addGuest'))}</h3>
      <p>${escapeHtml(t(lang, 'tour.addGuestSub'))}</p>
      <div class="gg-row">
        <div class="gg-field">
          <label class="gg-field__label">${escapeHtml(t(lang, 'tour.addGuestName'))}</label>
          <input class="gg-input" id="add-guest-name" placeholder="${escapeHtml(t(lang, 'tour.addGuestNamePh'))}" />
        </div>
        <div class="gg-field">
          <label class="gg-field__label">${escapeHtml(t(lang, 'tour.addGuestEmail'))}</label>
          <input class="gg-input" id="add-guest-email" type="email" placeholder="${escapeHtml(t(lang, 'tour.addGuestEmailPh'))}" />
        </div>
      </div>
      <div class="gg-actions">
        <span></span>
        <button class="gg-button" data-action="send-invite">${escapeHtml(t(lang, 'tour.addGuestSend'))}</button>
      </div>
      ${state.addGuestStatus === 'sent' ? `<div class="gg-success">✓ ${escapeHtml(t(lang, 'tour.addGuestSent'))}</div>` : ''}
    </div>
  ` : `
    <div class="gg-addguest">
      <h3>${escapeHtml(t(lang, 'tour.addGuest'))}</h3>
      <p>${escapeHtml(t(lang, 'tour.addGuestSub'))}</p>
      <button class="gg-button gg-button--ghost" data-action="show-add-guest">${escapeHtml(t(lang, 'tour.addGuest'))} →</button>
    </div>
  `;

  return `
    ${renderHeader()}
    <main class="gg-shell">
      ${renderSteps('tour')}
      <section class="gg-tour-hero">
        <div class="gg-tour-hero__id">${escapeHtml(t(lang, 'tour.tourId'))} ${escapeHtml(tour.id)}</div>
        <h1>${escapeHtml(t(lang, 'tour.title'))}</h1>
        <div class="gg-tour-hero__sub">${escapeHtml(subtitle)}</div>
      </section>

      <div class="gg-stops">${stopsHtml}</div>

      <div class="gg-tour-foot">
        <div class="gg-guests-pills">
          ${(tour.guests || []).map((g) => `<span class="gg-guest-pill"><span class="gg-guest-pill__name">${escapeHtml(g.name || '?')}</span></span>`).join('')}
        </div>
        <div class="gg-tour-foot__actions">
          <button class="gg-button gg-button--ghost" data-action="copy-link">${escapeHtml(t(lang, 'tour.copyLink'))}</button>
          <button class="gg-button gg-button--ghost" data-action="email-guide">${escapeHtml(t(lang, 'tour.emailGuide'))}</button>
        </div>
      </div>

      ${addGuest}
    </main>
  `;
}

// ============ Bindings ============

function bind() {
  // Language switcher
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('click', () => {
      lang = el.getAttribute('data-lang');
      setLang(lang);
      render();
    });
  });

  document.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const action = el.getAttribute('data-action');
      handleAction(action);
    });
  });

  document.querySelectorAll('[data-interest-slider]').forEach((slider) => {
    slider.addEventListener('input', (e) => {
      const id = slider.getAttribute('data-interest-slider');
      const v = Number(slider.value);
      if (v === 0) delete state.guest.interests[id];
      else state.guest.interests[id] = v;
      // Light re-render of just this card to keep it snappy
      const card = slider.closest('.gg-interest');
      if (card) {
        card.style.setProperty('--gg-fill', `${(v / 5) * 100}%`);
        card.classList.toggle('gg-interest--active', v > 0);
        const label = v === 0 ? t(lang, 'interests.noInterest')
                    : v <= 2  ? t(lang, 'interests.mild')
                    : v <= 4  ? t(lang, 'interests.strong')
                    :           t(lang, 'interests.mustDo');
        const labelEl = card.querySelector('.gg-interest__weight');
        if (labelEl) {
          labelEl.textContent = label;
          labelEl.classList.toggle('gg-interest__weight--hot', v >= 4);
        }
      }
    });
  });

  document.querySelectorAll('[data-hours]').forEach((el) => {
    el.addEventListener('click', () => {
      state.duration = Number(el.getAttribute('data-hours'));
      render();
    });
  });

  document.querySelectorAll('[data-rm-custom]').forEach((el) => {
    el.addEventListener('click', () => {
      const i = Number(el.getAttribute('data-rm-custom'));
      state.guest.customInterestNotes.splice(i, 1);
      render();
    });
  });
}

function readProfileForm() {
  state.guest.name = document.getElementById('g-name')?.value.trim() || '';
  state.guest.email = document.getElementById('g-email')?.value.trim() || '';
  state.guest.homeCity = document.getElementById('g-city')?.value.trim() || '';
  state.guest.arrival = document.getElementById('g-arrival')?.value || state.guest.arrival;
  state.guest.partySize = Number(document.getElementById('g-party')?.value || 1);
}

function showError(msg) {
  const el = document.getElementById('gg-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleAction(action) {
  if (action === 'start') {
    state.step = 'profile';
    render();
    return;
  }

  if (action === 'profile-next') {
    readProfileForm();
    if (!state.guest.name) return showError(t(lang, 'common.required') + ': ' + t(lang, 'profile.name'));
    if (!state.guest.email || !/.+@.+\..+/.test(state.guest.email)) return showError(t(lang, 'common.required') + ': ' + t(lang, 'profile.email'));
    state.step = 'interests';
    render();
    return;
  }

  if (action === 'back-to-profile') {
    state.step = 'profile';
    render();
    return;
  }

  if (action === 'add-custom') {
    const input = document.getElementById('gg-custom-input');
    const v = (input?.value || '').trim();
    if (!v) return;
    state.guest.customInterestNotes.push(v);
    if (input) input.value = '';
    render();
    return;
  }

  if (action === 'generate') {
    const hasInterest = Object.values(state.guest.interests).some((v) => v > 0);
    if (!hasInterest && state.guest.customInterestNotes.length === 0) {
      return showError(t(lang, 'interests.validateAtLeastOne'));
    }
    state.step = 'generating';
    render();

    // Run the generator with a small async delay so the spinner is visible.
    setTimeout(() => {
      let guests;
      if (state.tourId) {
        // Joining an existing tour as an extra guest
        const existing = getTour(state.tourId);
        if (existing) {
          guests = [...(existing.guests || []), state.guest];
        } else {
          guests = [state.guest];
        }
      } else {
        guests = [state.guest];
      }
      const itin = generateItinerary({ guests, hours: state.duration });
      let tour;
      if (state.tourId) {
        tour = addGuest(state.tourId, state.guest);
        // Re-generate and update the persisted tour with the new itinerary
        const fresh = createTour({ guests, hours: state.duration, itinerary: itin, brand, lang });
        // Keep the original tour ID for share links
        tour = { ...fresh, id: state.tourId };
      } else {
        tour = createTour({ guests, hours: state.duration, itinerary: itin, brand, lang });
      }
      state.generatedTour = tour;
      state.step = 'tour';
      render();
      // Email the guide
      try {
        // Soft notification — opens mailto in a new window. We don't want to
        // hijack on first load, so we only open if user explicitly clicks.
        // The button is always available in the tour-foot.
      } catch (e) { console.warn(e); }
    }, 700);
    return;
  }

  if (action === 'show-add-guest') {
    state.showAddGuest = true;
    render();
    return;
  }

  if (action === 'send-invite') {
    const name = document.getElementById('add-guest-name')?.value.trim() || '';
    const email = document.getElementById('add-guest-email')?.value.trim() || '';
    if (!email || !/.+@.+\..+/.test(email)) {
      alert(t(lang, 'common.required') + ': ' + t(lang, 'tour.addGuestEmail'));
      return;
    }
    emailGuestInvite({
      tour: state.generatedTour,
      recipientEmail: email,
      recipientName: name,
      fromName: state.guest.name,
      lang,
      brand,
    });
    state.addGuestStatus = 'sent';
    render();
    return;
  }

  if (action === 'copy-link') {
    const url = `${window.location.origin}/apps/greatguide/?tour=${encodeURIComponent(state.generatedTour.id)}&view=1&lang=${lang}`;
    navigator.clipboard?.writeText(url).then(() => {
      alert(t(lang, 'tour.copied') + ': ' + url);
    });
    return;
  }

  if (action === 'email-guide') {
    emailGuideOnTourCreated(state.generatedTour, lang, brand);
    return;
  }
}

// If URL has ?tour=...&view=1, load that tour in the read-only view (used by share links).
function tryLoadExistingTour() {
  const url = new URL(window.location.href);
  const tourId = url.searchParams.get('tour');
  const view = url.searchParams.get('view');
  if (tourId && view === '1') {
    const t = getTour(tourId);
    if (t) {
      state.generatedTour = t;
      state.duration = t.hours;
      state.guest = (t.guests && t.guests[0]) || emptyGuest();
      state.step = 'tour';
      return true;
    }
  }
  return false;
}

if (!tryLoadExistingTour()) {
  // Default first render
}

render();

// Listen for language changes from elsewhere
window.addEventListener('greatguide:lang', (e) => {
  lang = e.detail.lang;
  render();
});
