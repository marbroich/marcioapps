/**
 * Shared chart rendering helpers (planets/houses/aspects tables, snapshot grid).
 * Used by western.js and vedic.js.
 */

import { signOf, fmtDeg, PLANETS, SIGNS, SIGN_GLYPHS, SIGN_GLYPHS as _sg } from './ephemeris.js';
import { escapeHtml } from './astro-shell.js';

export function renderSnapshot(grid, chart, { variant = 'western' } = {}) {
  const cells = [];
  const sun = chart.positions.Sun;
  const moon = chart.positions.Moon;
  const asc = chart.angles?.ascendant;

  cells.push(stat('Sun', signWithGlyph(sun.longitude)));
  cells.push(stat('Moon', signWithGlyph(moon.longitude)));
  if (asc != null) cells.push(stat(variant === 'vedic' ? 'Lagna' : 'Ascendant', signWithGlyph(asc)));
  if (chart.angles?.midheaven != null) cells.push(stat('Midheaven', signWithGlyph(chart.angles.midheaven)));
  if (variant === 'vedic' && chart.nakshatra) {
    cells.push(stat('Moon Nakshatra', `${chart.nakshatra.name} · pada ${chart.nakshatra.pada}`));
  }
  if (variant === 'vedic' && chart.dasha?.current_md) {
    cells.push(stat('Mahadasha', `${chart.dasha.current_md.lord} · until ${chart.dasha.current_md.end.slice(0, 10)}`));
  }

  grid.innerHTML = cells.join('');
}

function stat(label, value, sub) {
  return `
    <div class="astro-stat">
      <p class="astro-stat-label">${escapeHtml(label)}</p>
      <p class="astro-stat-value">${value}</p>
      ${sub ? `<p class="astro-stat-sub">${escapeHtml(sub)}</p>` : ''}
    </div>
  `;
}

function signWithGlyph(lon) {
  const s = signOf(lon);
  const deg = Math.floor(s.degree);
  const min = Math.floor((s.degree - deg) * 60);
  return `<span class="astro-glyph">${s.glyph}</span> ${escapeHtml(s.name)} <span style="color:var(--color-aap-text-muted);font-size:0.85em">${deg}°${String(min).padStart(2, '0')}'</span>`;
}

export function renderPlanetsTable(tbody, chart, { variant = 'western' } = {}) {
  const houses = chart.houses?.cusps || null;
  const order = variant === 'vedic'
    ? ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto']
    : ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode', 'SouthNode'];

  tbody.innerHTML = order
    .filter(k => chart.positions[k])
    .map((k) => {
      const p = chart.positions[k];
      const house = houses ? houseOf(p.longitude, houses) : null;
      const meta = PLANETS.find(pl => pl.key === k);
      const glyph = meta?.glyph || '';
      const label = (variant === 'vedic' && meta?.vedic) ? meta.vedic : k.replace(/Node/, ' Node');
      const retro = p.retrograde ? '<span title="retrograde" style="color:var(--color-aap-text-muted)">℞</span>' : '';
      return `
        <tr>
          <td><span class="astro-glyph">${glyph}</span> ${escapeHtml(label)}</td>
          <td>${signWithGlyph(p.longitude)}</td>
          <td class="num">${escapeHtml(fmtDeg(p.longitude))}</td>
          <td>${house ?? '—'}</td>
          <td>${retro}</td>
        </tr>
      `;
    }).join('');
}

function houseOf(lon, cusps) {
  // whole-sign: house index = ((sign - asc_sign) mod 12) + 1
  const sign = Math.floor(((lon % 360) + 360) % 360 / 30);
  const ascSign = cusps[0].sign;
  return ((sign - ascSign + 12) % 12) + 1;
}

export function renderHousesTable(tbody, note, chart) {
  if (!chart.houses) {
    tbody.innerHTML = `<tr><td colspan="2" style="color:var(--color-aap-text-muted)">Houses unavailable — birth time or location missing.</td></tr>`;
    note.textContent = '';
    return;
  }
  tbody.innerHTML = chart.houses.cusps.map(h => `
    <tr>
      <td>${h.house}</td>
      <td><span class="astro-glyph">${SIGN_GLYPHS[h.sign]}</span> ${escapeHtml(h.sign_name)}</td>
    </tr>
  `).join('');
  if (chart.house_system_actual && chart.house_system && chart.house_system !== chart.house_system_actual) {
    note.textContent = `Whole-sign houses shown. ${chart.house_system} is in your prefs but is not yet implemented in v1.`;
  } else {
    note.textContent = '';
  }
}

export function renderAspectsTable(tbody, chart) {
  if (!chart.aspects?.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--color-aap-text-muted)">No aspects in orb.</td></tr>`;
    return;
  }
  // Sort by orb tightness (tightest first)
  const sorted = [...chart.aspects].sort((a, b) => a.orb - b.orb);
  tbody.innerHTML = sorted.map((a) => {
    return `
      <tr>
        <td>${prettyName(a.a)} <span class="astro-glyph">${aspectGlyph(a.aspect)}</span> ${prettyName(a.b)}</td>
        <td>${escapeHtml(a.aspect)}</td>
        <td class="num">${a.orb.toFixed(2)}°</td>
      </tr>
    `;
  }).join('');
}

function prettyName(k) {
  const meta = PLANETS.find(p => p.key === k);
  if (meta) return `<span class="astro-glyph">${meta.glyph}</span> ${escapeHtml(k)}`;
  if (k === 'NorthNode') return '☊ North Node';
  if (k === 'SouthNode') return '☋ South Node';
  if (k === 'Rahu') return '☊ Rahu';
  if (k === 'Ketu') return '☋ Ketu';
  return escapeHtml(k);
}

function aspectGlyph(name) {
  return ({
    Conjunction: '☌', Sextile: '⚹', Square: '□', Trine: '△', Opposition: '☍',
  })[name] || '·';
}
