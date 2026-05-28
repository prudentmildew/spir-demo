import type { Match } from './types.ts';

// Seeded Dronning Mauds gate 10, 0250 Oslo (Hydroparken area).
// Matrikkel values are plausible placeholders for prototype rendering;
// v1 will replace with the actual Kartverket resolution.
export const SEEDED_MATCH: Match = {
  address: 'Dronning Mauds gate 10, 0250 Oslo',
  matrikkel: { knr: '0301', gnr: 208, bnr: 456, snr: 12 },
  kommunenr: '0301',
  kommunenavn: 'Oslo',
  lat: 59.9118,
  lon: 10.7261,
};

export const formatMatrikkel = (m: Match['matrikkel']): string => {
  const base = `${m.knr}-${String(m.gnr).padStart(3, '0')}-${String(m.bnr).padStart(3, '0')}`;
  return m.snr !== undefined ? `${base}-${String(m.snr).padStart(2, '0')}` : base;
};

export const formatLatLon = (lat: number, lon: number): string =>
  `${lat.toFixed(4)}° N · ${lon.toFixed(4)}° E`;
