// Persistence layer.
//
// In this build everything is kept in localStorage so the app can ship without
// real backend infra. The shape is identical to the Supabase schema in
// supabase/migrations/2026XXXX_greatguide.sql, so swapping in Supabase later is
// a matter of replacing the body of these functions with `await supabase.from(...).insert(...)`.

const KEY = 'greatguide.tours.v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(tours) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tours));
  } catch (e) {
    console.warn('greatguide: storage write failed', e);
  }
}

// Generate a short, human-readable, sortable tour ID.
// Format: GG-YYMMDD-XXXX where XXXX is base36-random.
function newTourId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GG-${yy}${mm}${dd}-${rand}`;
}

export function createTour({ guests, hours, itinerary, brand, lang }) {
  const tours = readAll();
  const tour = {
    id: newTourId(),
    createdAt: new Date().toISOString(),
    brand: brand?.id || 'litoral',
    lang: lang || 'en',
    hours,
    guests,
    // Persist only enough about the itinerary to reconstruct it (POI ids).
    stopIds: itinerary.stops.map((s) => s.id),
    segments: itinerary.segments,
    drivers: itinerary.drivers,
  };
  tours.unshift(tour);
  writeAll(tours);
  return tour;
}

export function listTours() {
  return readAll();
}

export function getTour(id) {
  return readAll().find((t) => t.id === id) || null;
}

export function updateTour(id, patch) {
  const tours = readAll();
  const idx = tours.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  tours[idx] = { ...tours[idx], ...patch };
  writeAll(tours);
  return tours[idx];
}

// Add a guest to an existing tour.
export function addGuest(tourId, guest) {
  const tour = getTour(tourId);
  if (!tour) return null;
  tour.guests = [...(tour.guests || []), guest];
  return updateTour(tourId, { guests: tour.guests });
}
