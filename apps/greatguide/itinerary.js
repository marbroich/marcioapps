// Itinerary generator — turns a list of guests (each with weighted interests
// and a desired tour duration) into an ordered sequence of stops with travel
// segments between them.
//
// Multi-guest balancing strategy:
//   1. Aggregate interest weights across guests, but cap each guest's total
//      contribution so one heavy-handed guest doesn't dominate.
//   2. Score each POI = Σ over interests it satisfies (interest_weight ×
//      poi_intensity_for_that_interest) — matched against the aggregated
//      weights.
//   3. Take a "must-include" pass: for each guest, ensure their single
//      highest-weighted interest gets at least one stop in the itinerary.
//   4. Fill remaining time by greedy descending score, skipping POIs that
//      duplicate an interest profile we've already covered well.
//   5. Order chosen stops by the shortest-distance nearest-neighbor tour from
//      the starting point.
//   6. Compute transport between consecutive stops by distance + kind
//      heuristics.

import { POIS, INTERESTS } from './data/pois.js';

// Distance in km between two lat/lng points (Haversine).
function distanceKm(a, b) {
  if (!a || !b) return 0;
  const toRad = (d) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Travel time (minutes) for a segment of a given distance (km) and mode.
function travelMinutes(km, mode) {
  // Speeds tuned for a small Brazilian coastal city.
  const speeds = { foot: 4.5, bike: 14, taxi: 35, car: 35, boat: 18 };
  const v = speeds[mode] || 30;
  // Add a small fixed overhead per segment for boarding/parking.
  const overhead = mode === 'foot' ? 0 : (mode === 'boat' ? 8 : 3);
  return Math.round((km / v) * 60 + overhead);
}

// Pick a transport mode between two stops based on distance and kinds.
function pickTransport(from, to) {
  const km = distanceKm(from.coords, to.coords);
  // Boat-required: schooner-style stop
  if (from.kind === 'boat' || to.kind === 'boat') {
    return { mode: 'boat', km, minutes: travelMinutes(km, 'boat') };
  }
  // Walking distance — under 800m and both in a walkable kind
  const walkable = ['walk', 'church', 'museum', 'shop', 'restaurant', 'view'];
  if (km < 0.8 && walkable.includes(from.kind) && walkable.includes(to.kind)) {
    return { mode: 'foot', km, minutes: travelMinutes(km, 'foot') };
  }
  // Short taxi for short cross-town hops
  if (km < 4) {
    return { mode: 'taxi', km, minutes: travelMinutes(km, 'taxi') };
  }
  // Anything longer = private car
  return { mode: 'car', km, minutes: travelMinutes(km, 'car') };
}

// Aggregate interest weights across guests, cap-balanced.
function aggregateInterests(guests) {
  // Each guest's weights are normalized so that their sum is at most CAP.
  // This prevents one guest's stack of fives from drowning out everyone else.
  const CAP = 25;
  const agg = {};
  const mustHave = []; // guest -> top interest id

  guests.forEach((g) => {
    const total = Object.values(g.interests || {}).reduce((s, v) => s + (v || 0), 0);
    const scale = total > CAP ? CAP / total : 1;
    Object.entries(g.interests || {}).forEach(([id, w]) => {
      const weighted = w * scale;
      agg[id] = (agg[id] || 0) + weighted;
    });
    // Find guest's top interest (for must-have pass)
    let top = null;
    let topW = 0;
    Object.entries(g.interests || {}).forEach(([id, w]) => {
      if (w > topW) { topW = w; top = id; }
    });
    if (top) mustHave.push({ guest: g, interestId: top });
  });

  return { weights: agg, mustHave };
}

// Score a POI against aggregated interest weights.
function scorePoi(poi, weights) {
  let score = 0;
  poi.tags.forEach((tag) => {
    const w = weights[tag] || 0;
    const intensity = poi.intensity?.[tag] || 0;
    score += w * intensity;
  });
  return score;
}

// Greedy nearest-neighbor ordering starting from the city center.
function orderStops(stops, start) {
  if (stops.length === 0) return [];
  const remaining = [...stops];
  const ordered = [];
  let cursor = { coords: start };
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = distanceKm(cursor.coords, s.coords);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

// Determine which interest "drove" the inclusion of each stop — used by the
// guide view to pick the right script section.
function tagDrivers(stops, weights) {
  return stops.map((stop) => {
    let bestTag = null;
    let bestVal = 0;
    stop.tags.forEach((tag) => {
      const v = (weights[tag] || 0) * (stop.intensity?.[tag] || 0);
      if (v > bestVal) { bestVal = v; bestTag = tag; }
    });
    // Fall back to the stop's strongest tag if no interest matched.
    if (!bestTag) {
      let strongest = 0;
      stop.tags.forEach((tag) => {
        const v = stop.intensity?.[tag] || 0;
        if (v > strongest) { strongest = v; bestTag = tag; }
      });
    }
    return bestTag;
  });
}

/**
 * Generate an itinerary.
 * @param {Object} input
 * @param {Array}  input.guests   - list of guests, each with .interests {tag: 1..5}
 * @param {Number} input.hours    - tour duration in hours
 * @param {Object} [input.start]  - {lat, lng} start point (defaults to city center)
 * @returns {{stops, segments, totalMinutes, drivers, weights}}
 */
export function generateItinerary({ guests, hours, start }) {
  const totalMin = Math.round(hours * 60);
  const startPoint = start || { lat: -23.6205, lng: -45.4128 };

  const { weights, mustHave } = aggregateInterests(guests);

  // Score and sort all POIs.
  const scored = POIS
    .map((p) => ({ poi: p, score: scorePoi(p, weights) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  const chosenIds = new Set();
  const usedKindCount = {}; // avoid 4 beaches in a row
  let timeUsed = 0;

  // Estimate average travel between stops — we'll subtract dwell time and
  // reserve buffer for travel as we add stops.
  const TRAVEL_RESERVE_PER_STOP = 18; // minutes, average

  function tryAdd(scoredPoi) {
    if (chosenIds.has(scoredPoi.poi.id)) return false;
    const dwell = scoredPoi.poi.dwellMin || 30;
    const cost = dwell + TRAVEL_RESERVE_PER_STOP;
    if (timeUsed + cost > totalMin) return false;
    // Avoid stacking too many of the same kind
    const k = scoredPoi.poi.kind;
    if ((usedKindCount[k] || 0) >= Math.max(2, Math.ceil(hours / 2))) return false;
    chosen.push(scoredPoi.poi);
    chosenIds.add(scoredPoi.poi.id);
    usedKindCount[k] = (usedKindCount[k] || 0) + 1;
    timeUsed += cost;
    return true;
  }

  // Pass 1 — must-have for each guest (their top interest).
  mustHave.forEach(({ interestId }) => {
    const candidates = scored.filter((s) => s.poi.tags.includes(interestId) && !chosenIds.has(s.poi.id));
    for (const c of candidates) {
      if (tryAdd(c)) break;
    }
  });

  // Pass 2 — fill greedy by score.
  for (const c of scored) {
    if (timeUsed >= totalMin - 20) break;
    tryAdd(c);
  }

  // Pass 3 — for very short tours we may have nothing yet (no interests
  // matched anything). Backfill with the highest-scoring POIs ignoring time.
  if (chosen.length === 0 && scored.length) {
    chosen.push(scored[0].poi);
    chosenIds.add(scored[0].poi.id);
  }

  // Order them
  const ordered = orderStops(chosen, startPoint);

  // Build travel segments
  const segments = [];
  let cursor = { coords: startPoint, kind: 'walk' };
  ordered.forEach((stop) => {
    segments.push(pickTransport(cursor, stop));
    cursor = stop;
  });

  // Total realized time
  const totalTravelMin = segments.reduce((s, seg) => s + seg.minutes, 0);
  const totalDwellMin = ordered.reduce((s, p) => s + (p.dwellMin || 0), 0);

  const drivers = tagDrivers(ordered, weights);

  return {
    stops: ordered,
    segments,
    drivers,
    totalMinutes: totalTravelMin + totalDwellMin,
    requestedMinutes: totalMin,
    weights,
  };
}

// Get a friendly transport label for the i18n layer.
export function transportKey(mode) {
  // Maps internal mode -> i18n string key under transport.*
  return mode || 'foot';
}

export { distanceKm };
