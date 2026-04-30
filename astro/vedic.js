/**
 * Vedic chart page — sidereal positions, navamsa, dasha.
 */

import { initAstroPage, showToast, escapeHtml } from './astro-shell.js';
import { computeVedicChart, SIGNS, SIGN_GLYPHS } from './ephemeris.js';
import { getOrComputeChart } from './chart-cache.js';
import { renderSnapshot, renderPlanetsTable, renderHousesTable } from './chart-render.js';

let appUser = null;
let astroProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('vedic', async (ctx) => {
    appUser = ctx.appUser;
    astroProfile = ctx.astroProfile;
    if (!astroProfile?.birth_date) {
      document.getElementById('missingData').classList.remove('hidden');
      return;
    }
    document.getElementById('chartArea').classList.remove('hidden');
    document.getElementById('recomputeBtn').addEventListener('click', () => loadChart(true));
    await loadChart(false);
  });
});

async function loadChart(force) {
  const errBox = document.getElementById('errorBox');
  errBox.classList.add('hidden');
  try {
    const { chart, fromCache } = await getOrComputeChart({
      userId: appUser.id,
      system: 'vedic',
      profile: astroProfile,
      computeFn: computeVedicChart,
      force,
    });
    renderChart(chart);
    if (!fromCache) showToast('Vedic chart computed.', 'success');
  } catch (err) {
    console.error(err);
    errBox.classList.remove('hidden');
    errBox.textContent = err.message || 'Could not compute chart.';
  }
}

function renderChart(chart) {
  renderSnapshot(document.getElementById('snapshotGrid'), chart, { variant: 'vedic' });
  renderPlanetsTable(document.getElementById('planetsBody'), chart, { variant: 'vedic' });
  renderHousesTable(document.getElementById('housesBody'), document.createElement('p'), chart);
  renderNavamsa(chart);
  renderDasha(chart);

  document.getElementById('ayanamsaNote').textContent =
    `Lahiri ayanamsa: ${chart.ayanamsa_value.toFixed(4)}° (subtracted from tropical longitudes).`;
}

function renderNavamsa(chart) {
  const tbody = document.getElementById('navamsaBody');
  if (!chart.navamsa) { tbody.innerHTML = ''; return; }
  const order = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto'];
  tbody.innerHTML = order.filter(k => chart.navamsa[k]).map((k) => {
    const n = chart.navamsa[k];
    return `<tr>
      <td>${escapeHtml(k)}</td>
      <td><span class="astro-glyph">${n.glyph}</span> ${escapeHtml(n.name)}</td>
    </tr>`;
  }).join('');
}

function renderDasha(chart) {
  const summary = document.getElementById('dashaSummary');
  const seqBody = document.getElementById('dashaSequence');
  if (!chart.dasha) {
    summary.innerHTML = '<p style="color:var(--color-aap-text-muted)">Dasha unavailable.</p>';
    seqBody.innerHTML = '';
    return;
  }
  const md = chart.dasha.current_md;
  const ad = chart.dasha.current_ad;
  const next = chart.dasha.next_md;
  summary.innerHTML = `
    ${md ? `<p><strong>Current Mahadasha:</strong> ${escapeHtml(md.lord)} <span style="color:var(--color-aap-text-muted)">(${md.start.slice(0,10)} → ${md.end.slice(0,10)})</span></p>` : ''}
    ${ad ? `<p><strong>Current Antardasha:</strong> ${escapeHtml(ad.lord)} <span style="color:var(--color-aap-text-muted)">(${ad.start.slice(0,10)} → ${ad.end.slice(0,10)})</span></p>` : ''}
    ${next ? `<p style="color:var(--color-aap-text-muted)"><strong>Next MD:</strong> ${escapeHtml(next.lord)} starts ${next.start.slice(0,10)}</p>` : ''}
  `;
  seqBody.innerHTML = chart.dasha.sequence.map((m) => {
    const isCurrent = md && m.lord === md.lord && m.start === md.start;
    return `<tr style="${isCurrent ? 'background:var(--color-aap-amber-light)' : ''}">
      <td>${escapeHtml(m.lord)}${isCurrent ? ' <span style="color:var(--color-aap-amber);font-size:0.75rem">(now)</span>' : ''}</td>
      <td>${m.start.slice(0,10)}</td>
      <td>${m.end.slice(0,10)}</td>
    </tr>`;
  }).join('');
}
