/**
 * Numerology page — wire numerology.js to user's name + birthday.
 */

import { initAstroPage, escapeHtml } from './astro-shell.js';
import { computeAll, NUMBER_INTERPRETATIONS } from './numerology.js';

let appUser = null;
let astroProfile = null;
let recomputeTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('numerology', async (ctx) => {
    appUser = ctx.appUser;
    astroProfile = ctx.astroProfile;
    setup();
  });
});

function setup() {
  const name = fullName();
  const birthDate = astroProfile?.birth_date || appUser?.birthday;
  const yearNow = new Date().getFullYear();

  document.getElementById('nameInput').value = name;
  document.getElementById('yearInput').value = yearNow;

  if (!birthDate) {
    document.getElementById('missingData').classList.remove('hidden');
    document.getElementById('numbersCard').classList.add('hidden');
    return;
  }

  document.getElementById('nameInput').addEventListener('input', schedule);
  document.getElementById('yearInput').addEventListener('input', schedule);

  render();
}

function fullName() {
  const u = appUser || {};
  const composed = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return composed || u.display_name || '';
}

function schedule() {
  clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(render, 200);
}

function render() {
  const name = document.getElementById('nameInput').value;
  const year = Number(document.getElementById('yearInput').value) || new Date().getFullYear();
  const birthDate = astroProfile?.birth_date || appUser?.birthday;

  const numbers = computeAll(name, birthDate, year);
  const list = document.getElementById('numbersList');

  const order = ['lifePath', 'expression', 'soulUrge', 'personality', 'birthdayNumber', 'personalYear', 'maturity'];

  list.innerHTML = order.map((key) => {
    const def = NUMBER_INTERPRETATIONS[key];
    const value = numbers[key];
    const interp = (value != null) ? (def.meanings[value] || `Number ${value}.`) : 'Need more data to compute.';
    return `
      <div class="astro-num-callout">
        <div class="astro-num-circle">${value ?? '—'}</div>
        <div>
          <p class="astro-num-name">${escapeHtml(def.title)}</p>
          <p class="astro-num-text"><strong>${escapeHtml(def.summary)}</strong></p>
          <p class="astro-num-text" style="margin-top:0.25rem;color:var(--color-aap-text-muted);">${escapeHtml(interp)}</p>
        </div>
      </div>
    `;
  }).join('');
}
