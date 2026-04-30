/**
 * Ephemeris wrapper — Western (tropical) and Vedic (sidereal) charts.
 *
 * Uses astronomy-engine (pure JS, ~150 KB) lazy-loaded from a CDN. Computes:
 *   - Tropical longitudes for Sun, Moon, Mercury..Pluto
 *   - Mean Lunar North Node (analytic formula)
 *   - Ascendant + Midheaven (from local sidereal time + lat)
 *   - Whole-sign houses
 *   - Sidereal positions (Lahiri ayanamsa) for Vedic
 *   - Nakshatra + pada of Moon
 *   - Current + next Vimshottari Mahadasha + Antardasha
 *
 * House systems other than 'whole' fall back to whole sign in v1 with a flag in
 * the chart output (`houses.fallback: true`) — Placidus support is a TODO.
 */

const ASTRO_CDN = 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/esm/astronomy.js';

let _astroLib = null;
async function getLib() {
  if (_astroLib) return _astroLib;
  _astroLib = await import(/* @vite-ignore */ ASTRO_CDN);
  return _astroLib;
}

// =============================================
// Constants
// =============================================

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const PLANETS = [
  { key: 'Sun',     glyph: '☉', vedic: 'Surya' },
  { key: 'Moon',    glyph: '☽', vedic: 'Chandra' },
  { key: 'Mercury', glyph: '☿', vedic: 'Budha' },
  { key: 'Venus',   glyph: '♀', vedic: 'Shukra' },
  { key: 'Mars',    glyph: '♂', vedic: 'Mangala' },
  { key: 'Jupiter', glyph: '♃', vedic: 'Guru' },
  { key: 'Saturn',  glyph: '♄', vedic: 'Shani' },
  { key: 'Uranus',  glyph: '♅', vedic: null },
  { key: 'Neptune', glyph: '♆', vedic: null },
  { key: 'Pluto',   glyph: '♇', vedic: null },
];

// 27 Nakshatras
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Vimshottari dasha lord cycle, in years (totals 120)
export const VIMSHOTTARI_LORDS = [
  { lord: 'Ketu',    years: 7  },
  { lord: 'Venus',   years: 20 },
  { lord: 'Sun',     years: 6  },
  { lord: 'Moon',    years: 10 },
  { lord: 'Mars',    years: 7  },
  { lord: 'Rahu',    years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn',  years: 19 },
  { lord: 'Mercury', years: 17 },
];

// Each nakshatra is ruled by one of the 9 dasha lords, repeating every 9.
// Ashwini=Ketu, Bharani=Venus, Krittika=Sun, Rohini=Moon, Mrigashira=Mars,
// Ardra=Rahu, Punarvasu=Jupiter, Pushya=Saturn, Ashlesha=Mercury → repeat.
function nakshatraLordIndex(nakshatraIdx) {
  return nakshatraIdx % 9;
}

// =============================================
// Aspects
// =============================================

export const ASPECTS = [
  { name: 'Conjunction', angle: 0,   orb: 8, glyph: '☌' },
  { name: 'Sextile',     angle: 60,  orb: 4, glyph: '⚹' },
  { name: 'Square',      angle: 90,  orb: 7, glyph: '□' },
  { name: 'Trine',       angle: 120, orb: 7, glyph: '△' },
  { name: 'Opposition',  angle: 180, orb: 8, glyph: '☍' },
];

// =============================================
// Helpers
// =============================================

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

export function signOf(lon) {
  const idx = Math.floor(norm360(lon) / 30);
  return { index: idx, name: SIGNS[idx], glyph: SIGN_GLYPHS[idx], degree: norm360(lon) - idx * 30 };
}

export function fmtDeg(lon) {
  const s = signOf(lon);
  const deg = Math.floor(s.degree);
  const minF = (s.degree - deg) * 60;
  const min = Math.floor(minF);
  return `${deg}°${String(min).padStart(2, '0')}' ${s.glyph}`;
}

/**
 * Convert birth details → JS Date in UTC.
 * @param {string} birthDate - 'YYYY-MM-DD'
 * @param {string|null} birthTime - 'HH:MM' or 'HH:MM:SS' or null (uses 12:00 noon)
 * @param {string} tz - IANA timezone ('America/Sao_Paulo'); falls back to UTC
 */
export function birthToUTC(birthDate, birthTime, tz) {
  if (!birthDate) throw new Error('birth date required');
  const time = birthTime ? birthTime.slice(0, 5) : '12:00';
  // Build a "local" timestamp string and figure out its UTC equivalent for the given tz.
  // Trick: create a Date assuming UTC, then read what it would be in tz, compute offset, adjust.
  const naiveUTC = new Date(`${birthDate}T${time}:00Z`);
  if (!tz) return naiveUTC;

  // Determine offset (minutes) between tz and UTC for this instant.
  // Use the "wall clock in tz" method: format naiveUTC in tz to read its components,
  // construct a UTC timestamp from those components, diff with naiveUTC.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(naiveUTC).reduce((a, p) => (a[p.type] = p.value, a), {});
  const wallAsUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second)
  );
  const offsetMs = wallAsUTC - naiveUTC.getTime();
  return new Date(naiveUTC.getTime() - offsetMs);
}

/**
 * Lahiri ayanamsa — accurate enough for chart use.
 * Reference epoch: J2000.0 (2000-01-01 12:00 TT) ayanamsa = 23.85675° (Lahiri).
 * Annual precession rate ≈ 50.290966" per year on the ecliptic.
 */
export function lahiriAyanamsa(date) {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const yearsSinceJ2000 = (date.getTime() - J2000) / (365.25 * 86400 * 1000);
  const precessionDegPerYear = 50.290966 / 3600;
  return 23.85675 + yearsSinceJ2000 * precessionDegPerYear;
}

/**
 * Mean Lunar Node (North) — analytic formula based on T (Julian centuries since J2000).
 * Returns longitude in degrees (tropical).
 */
function meanNorthNode(date) {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const T = (date.getTime() - J2000) / (36525 * 86400 * 1000);
  // Meeus, Astronomical Algorithms — Chapter 47, mean longitude of ascending node:
  //   Ω = 125.04452 − 1934.136261 T + 0.0020708 T^2 + T^3/450000
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return norm360(omega);
}

/**
 * Ascendant + Midheaven from local sidereal time + observer latitude.
 * Returns tropical longitudes in degrees.
 */
function ascendantMC(date, lat, lon) {
  // Greenwich Mean Sidereal Time (Meeus 12.4)
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const jd = 2451545.0 + (date.getTime() - J2000) / (86400 * 1000);
  const T = (jd - 2451545.0) / 36525;
  const gmstDeg = norm360(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T - (T * T * T) / 38710000
  );
  const lstDeg = norm360(gmstDeg + lon); // Local Sidereal Time

  // Obliquity of the ecliptic (mean) — Meeus 22.2
  const eps = 23.43929111 - 0.0130041667 * T - 1.638e-7 * T * T + 5.036e-7 * T * T * T;

  // Midheaven (MC): tan MC = tan(LST) / cos(eps)
  const lstRad = lstDeg * DEG;
  const epsRad = eps * DEG;
  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad));
  const mc = norm360(mcRad * RAD);

  // Ascendant: tan Asc = -cos(LST) / (sin(eps)*tan(lat) + cos(eps)*sin(LST))
  const latRad = lat * DEG;
  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(epsRad) * Math.tan(latRad) + Math.cos(epsRad) * Math.sin(lstRad)
  );
  let asc = norm360(ascRad * RAD);
  // Ensure ascendant is in the 'rising' hemisphere (180° opposite MC roughly).
  // If asc differs from mc+90 by more than 180°, add 180.
  if (Math.abs(((asc - mc + 540) % 360) - 90) > 90) asc = norm360(asc + 180);

  return { ascendant: asc, midheaven: mc };
}

// =============================================
// Public: compute Western chart
// =============================================

export async function computeWesternChart(birth) {
  const { GeoVector, EclipticGeoMoon, Body, Ecliptic, AstroTime } = await getLib();

  if (!birth.birth_date) throw new Error('birth_date required');
  const date = birthToUTC(birth.birth_date, birth.birth_time, birth.birth_tz);
  const time = new AstroTime(date);

  const positions = {};
  for (const p of PLANETS) {
    if (p.key === 'Moon') {
      const eg = EclipticGeoMoon(time);
      positions[p.key] = {
        longitude: norm360(eg.lon),
        latitude: eg.lat,
        retrograde: false, // Moon never goes retrograde
      };
    } else {
      const vec = GeoVector(Body[p.key], time, true);
      const ecl = Ecliptic(vec);
      // Crude retrograde detection: compare longitude 1 day later
      const t2 = new AstroTime(new Date(date.getTime() + 86400000));
      const vec2 = GeoVector(Body[p.key], t2, true);
      const ecl2 = Ecliptic(vec2);
      const dLon = norm360(ecl2.elon - ecl.elon + 540) - 180;
      positions[p.key] = {
        longitude: norm360(ecl.elon),
        latitude: ecl.elat,
        retrograde: dLon < 0,
      };
    }
  }
  // Mean North Node (analytic)
  positions['NorthNode'] = { longitude: meanNorthNode(date), latitude: 0, retrograde: true };
  positions['SouthNode'] = { longitude: norm360(positions['NorthNode'].longitude + 180), latitude: 0, retrograde: true };

  // Ascendant + houses (only if exact birth time + lat available)
  const haveAngles = !!(birth.birth_time_known && birth.birth_lat != null && birth.birth_lon != null);
  let angles = null;
  let houses = null;
  if (haveAngles) {
    angles = ascendantMC(date, Number(birth.birth_lat), Number(birth.birth_lon));
    houses = wholeSignHouses(angles.ascendant);
  }

  const aspects = computeAspects(positions);

  return {
    system: 'western',
    zodiac: 'tropical',
    computed_at: new Date().toISOString(),
    birth: {
      date: birth.birth_date,
      time: birth.birth_time || null,
      time_known: !!birth.birth_time_known,
      lat: birth.birth_lat ?? null,
      lon: birth.birth_lon ?? null,
      tz: birth.birth_tz || null,
      utc: date.toISOString(),
    },
    positions,
    angles,
    houses,
    aspects,
    house_system: birth.prefs?.house_system || 'placidus',
    house_system_actual: 'whole', // v1 always whole sign
  };
}

// =============================================
// Public: compute Vedic chart (sidereal Lahiri)
// =============================================

export async function computeVedicChart(birth) {
  const western = await computeWesternChart(birth);
  const date = new Date(western.birth.utc);
  const ayanamsa = lahiriAyanamsa(date);

  // Subtract ayanamsa from each tropical longitude
  const sidPositions = {};
  for (const [k, p] of Object.entries(western.positions)) {
    sidPositions[k] = { ...p, longitude: norm360(p.longitude - ayanamsa) };
  }

  // Vedic uses Rahu/Ketu for nodes
  sidPositions.Rahu = sidPositions.NorthNode;
  sidPositions.Ketu = sidPositions.SouthNode;
  delete sidPositions.NorthNode;
  delete sidPositions.SouthNode;

  let sidAngles = null;
  let sidHouses = null;
  if (western.angles) {
    sidAngles = {
      ascendant: norm360(western.angles.ascendant - ayanamsa),
      midheaven: norm360(western.angles.midheaven - ayanamsa),
    };
    sidHouses = wholeSignHouses(sidAngles.ascendant);
  }

  // Nakshatra of Moon
  const moonLon = sidPositions.Moon.longitude;
  const nakIdx = Math.floor(moonLon / (360 / 27)); // 13°20' each
  const nakDeg = moonLon - nakIdx * (360 / 27);
  const pada = Math.floor(nakDeg / (360 / 108)) + 1; // each nak split into 4 padas of 3°20'
  const nakshatra = {
    index: nakIdx,
    name: NAKSHATRAS[nakIdx],
    pada,
    moon_deg_in_nak: nakDeg,
  };

  // Navamsa (D9) — each sign split into 9 parts of 3°20', mapping per cycle
  const navamsa = {};
  for (const [k, p] of Object.entries(sidPositions)) {
    navamsa[k] = navamsaSign(p.longitude);
  }

  // Vimshottari Mahadasha
  const dasha = vimshottariDasha(date, moonLon);

  return {
    system: 'vedic',
    zodiac: 'sidereal',
    ayanamsa_name: 'lahiri',
    ayanamsa_value: ayanamsa,
    computed_at: new Date().toISOString(),
    birth: western.birth,
    positions: sidPositions,
    angles: sidAngles,
    houses: sidHouses,
    nakshatra,
    navamsa,
    dasha,
  };
}

function navamsaSign(longitude) {
  const lon = norm360(longitude);
  const sign = Math.floor(lon / 30);
  const within = lon - sign * 30; // 0–30
  const navIdx = Math.floor(within / (30 / 9));
  // Movable signs (Aries 0, Cancer 3, Libra 6, Capricorn 9): start navamsa from same sign
  // Fixed signs (Taurus 1, Leo 4, Scorpio 7, Aquarius 10): start from 9th sign
  // Dual signs (Gemini 2, Virgo 5, Sag 8, Pisces 11): start from 5th sign
  const mod = sign % 3; // 0 movable, 1 fixed, 2 dual
  let startSign;
  if (mod === 0) startSign = sign;
  else if (mod === 1) startSign = (sign + 8) % 12;
  else startSign = (sign + 4) % 12;
  const navSign = (startSign + navIdx) % 12;
  return { sign: navSign, name: SIGNS[navSign], glyph: SIGN_GLYPHS[navSign] };
}

function vimshottariDasha(birthDate, moonLonSidereal) {
  // Find which nakshatra Moon is in and how far through it (fraction).
  const nakSize = 360 / 27;
  const nakIdx = Math.floor(moonLonSidereal / nakSize);
  const fracThrough = (moonLonSidereal - nakIdx * nakSize) / nakSize; // 0..1
  const startLordIdx = nakshatraLordIndex(nakIdx);

  // Build sequence of mahadashas starting from the lord whose nakshatra Moon is in.
  // The first MD's remaining duration = lord.years * (1 - fracThrough).
  const sequence = [];
  let cursor = new Date(birthDate);
  // First MD (partial)
  const firstLord = VIMSHOTTARI_LORDS[startLordIdx];
  const firstYears = firstLord.years * (1 - fracThrough);
  sequence.push({
    lord: firstLord.lord,
    start: new Date(cursor),
    end: new Date(cursor.getTime() + firstYears * 365.25 * 86400 * 1000),
    years: firstYears,
  });
  cursor = sequence[0].end;
  // Next 8 full MDs
  for (let i = 1; i < 9; i++) {
    const lord = VIMSHOTTARI_LORDS[(startLordIdx + i) % 9];
    const end = new Date(cursor.getTime() + lord.years * 365.25 * 86400 * 1000);
    sequence.push({ lord: lord.lord, start: new Date(cursor), end, years: lord.years });
    cursor = end;
  }

  // Find current MD
  const now = new Date();
  const current = sequence.find(md => now >= md.start && now < md.end) || null;
  const next = current ? sequence[sequence.indexOf(current) + 1] || null : null;

  // Antardasha within current MD
  let antar = null;
  if (current) {
    const antarLordIdx = VIMSHOTTARI_LORDS.findIndex(l => l.lord === current.lord);
    const mdYears = current.years; // possibly partial for first
    let aCursor = new Date(current.start);
    const antarList = [];
    for (let i = 0; i < 9; i++) {
      const aLord = VIMSHOTTARI_LORDS[(antarLordIdx + i) % 9];
      const aYears = (aLord.years / 120) * (current.lord === aLord.lord && i === 0
        ? mdYears
        : VIMSHOTTARI_LORDS.find(l => l.lord === current.lord).years);
      // Standard formula: antar duration = (md_lord_years * antar_lord_years) / 120
      // For partial first MD we scale.
      const fullMdYears = VIMSHOTTARI_LORDS.find(l => l.lord === current.lord).years;
      const aDur = (fullMdYears * aLord.years) / 120;
      const aEnd = new Date(aCursor.getTime() + aDur * 365.25 * 86400 * 1000);
      antarList.push({ lord: aLord.lord, start: new Date(aCursor), end: aEnd });
      aCursor = aEnd;
      if (aCursor > current.end) break;
    }
    antar = antarList.find(a => now >= a.start && now < a.end) || null;
  }

  return {
    sequence: sequence.map(md => ({
      lord: md.lord,
      start: md.start.toISOString(),
      end: md.end.toISOString(),
      years: md.years,
    })),
    current_md: current ? { lord: current.lord, start: current.start.toISOString(), end: current.end.toISOString() } : null,
    next_md: next ? { lord: next.lord, start: next.start.toISOString(), end: next.end.toISOString() } : null,
    current_ad: antar ? { lord: antar.lord, start: antar.start.toISOString(), end: antar.end.toISOString() } : null,
  };
}

// =============================================
// Houses
// =============================================

function wholeSignHouses(ascendantLon) {
  const ascSign = Math.floor(norm360(ascendantLon) / 30);
  const cusps = [];
  for (let i = 0; i < 12; i++) {
    const sign = (ascSign + i) % 12;
    cusps.push({
      house: i + 1,
      sign,
      sign_name: SIGNS[sign],
      cusp_degree: sign * 30, // whole sign: cusp is 0° of the sign
    });
  }
  return { system: 'whole', cusps };
}

// =============================================
// Aspects
// =============================================

function computeAspects(positions) {
  const keys = Object.keys(positions);
  const out = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i]; const b = keys[j];
      // Skip node-to-node (mathematically 180° always)
      if ((a === 'NorthNode' && b === 'SouthNode') || (a === 'SouthNode' && b === 'NorthNode')) continue;
      let diff = Math.abs(positions[a].longitude - positions[b].longitude);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          out.push({ a, b, aspect: asp.name, glyph: asp.glyph, exact: asp.angle, orb });
          break;
        }
      }
    }
  }
  return out;
}
