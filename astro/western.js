/**
 * Western chart page — load profile, compute (or read cached) tropical chart, render.
 */

import { initAstroPage, showToast, escapeHtml } from './astro-shell.js';
import { computeWesternChart } from './ephemeris.js';
import { getOrComputeChart } from './chart-cache.js';
import { renderSnapshot, renderPlanetsTable, renderHousesTable, renderAspectsTable } from './chart-render.js';

let appUser = null;
let astroProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('western', async (ctx) => {
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
      system: 'western',
      profile: astroProfile,
      computeFn: computeWesternChart,
      force,
    });
    renderChart(chart);
    if (!fromCache) showToast('Chart computed.', 'success');
  } catch (err) {
    console.error(err);
    errBox.classList.remove('hidden');
    errBox.textContent = err.message || 'Could not compute chart.';
  }
}

function renderChart(chart) {
  renderSnapshot(document.getElementById('snapshotGrid'), chart, { variant: 'western' });
  renderPlanetsTable(document.getElementById('planetsBody'), chart, { variant: 'western' });
  renderHousesTable(document.getElementById('housesBody'), document.getElementById('housesNote'), chart);
  renderAspectsTable(document.getElementById('aspectsBody'), chart);
}
