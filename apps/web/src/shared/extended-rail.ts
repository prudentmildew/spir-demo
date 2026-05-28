import type { ScenarioKey } from './types.ts';

// A richer prompt library used by registers F (playful) and G (minimal).
// Structured to make the future-API expansion path obvious: every group is
// labelled by the source(s) it leans on, and "coming soon" items name the
// specific API a future PR would wire in.
//
// Distinct from shared/rail.ts (which is the PRD §6 six-item curated rail
// used by registers A/B/C). Registers F and G imagine themselves as
// consumer-search surfaces, so the prompt set is broader and more thematic
// than the demo-script rail of A/B/C.

export type RailGroupKey = 'omradet' | 'folkene' | 'bygningen' | 'klima' | 'tilkomst';

export type RailGroup = {
  key: RailGroupKey;
  title: string;
  subtitle: string;
  sources: string; // human-readable list of APIs this group draws from
  glyph: string; // single character; F renders chunky, G renders quiet
  tint: 'coral' | 'mint' | 'cobalt' | 'lemon' | 'plum'; // F uses tints; G ignores
};

export type ExtendedRailItem = {
  id: string;
  label: string;
  question: string;
  group: RailGroupKey;
  // null = not yet wired; the prototype shows a "coming soon" badge naming
  // the future source. Non-null = mapped to an existing fixture.
  scenarioKey: ScenarioKey | null;
  futureSource?: string;
  norwegian?: boolean;
};

export const RAIL_GROUPS: RailGroup[] = [
  {
    key: 'omradet',
    title: 'Området',
    subtitle: 'Nabolaget',
    sources: 'Nettsøk · Kartverket · OpenStreetMap',
    glyph: '◐',
    tint: 'mint',
  },
  {
    key: 'folkene',
    title: 'Folkene',
    subtitle: 'De som bor her',
    sources: 'SSB',
    glyph: '◍',
    tint: 'cobalt',
  },
  {
    key: 'bygningen',
    title: 'Bygningen',
    subtitle: 'Selve bygget',
    sources: 'Matrikkel · Riksantikvaren · PBE',
    glyph: '◰',
    tint: 'plum',
  },
  {
    key: 'klima',
    title: 'Klima & vær',
    subtitle: 'Vær og klima',
    sources: 'MET · NILU · NVE',
    glyph: '◌',
    tint: 'coral',
  },
  {
    key: 'tilkomst',
    title: 'Tilkomst',
    subtitle: 'Komme seg rundt',
    sources: 'Entur · Skoleporten · OpenStreetMap',
    glyph: '◇',
    tint: 'lemon',
  },
];

export const EXTENDED_RAIL: ExtendedRailItem[] = [
  // ── Området ────────────────────────────────────────────────
  {
    id: 'omradet-neighborhood',
    label: 'Fortell meg om nabolaget',
    question: 'Fortell meg om nabolaget.',
    group: 'omradet',
    scenarioKey: 'neighborhood',
  },
  {
    id: 'omradet-both',
    label: 'Folketall og hva området er kjent for',
    question: 'Folketall og hva området er kjent for.',
    group: 'omradet',
    scenarioKey: 'both',
  },
  {
    id: 'omradet-nearby',
    label: 'Hva ligger innen 500 meters gange?',
    question: 'Hva finnes innen 500 m fra denne adressen?',
    group: 'omradet',
    scenarioKey: null,
    futureSource: 'OpenStreetMap',
  },

  // ── Folkene ────────────────────────────────────────────────
  {
    id: 'folkene-pop',
    label: 'Hva er folketallet i denne kommunen?',
    question: 'Hva er folketallet i denne kommunen?',
    group: 'folkene',
    scenarioKey: 'population',
  },
  {
    id: 'folkene-pop-trend',
    label: 'Befolkningsutvikling siste år',
    question: 'Hvordan har folketallet utviklet seg her?',
    group: 'folkene',
    scenarioKey: 'population',
  },
  {
    id: 'folkene-age',
    label: 'Aldersfordeling i denne kommunen',
    question: 'Hvordan er aldersfordelingen i denne kommunen?',
    group: 'folkene',
    scenarioKey: null,
    futureSource: 'SSB · tabell 07459',
  },
  {
    id: 'folkene-income',
    label: 'Gjennomsnittsinntekt i denne kommunen',
    question: 'Hva er gjennomsnittsinntekten i denne kommunen?',
    group: 'folkene',
    scenarioKey: null,
    futureSource: 'SSB · tabell 06944',
  },

  // ── Bygningen ──────────────────────────────────────────────
  {
    id: 'bygningen-owner',
    label: 'Hvem eier denne eiendommen?',
    question: 'Hvem eier denne eiendommen?',
    group: 'bygningen',
    scenarioKey: 'refusal',
  },
  {
    id: 'bygningen-built',
    label: 'Når ble bygget oppført?',
    question: 'Når ble dette bygget oppført?',
    group: 'bygningen',
    scenarioKey: null,
    futureSource: 'matrikkel · byggeår',
  },
  {
    id: 'bygningen-heritage',
    label: 'Vernestatus',
    question: 'Er dette bygget vernet eller fredet?',
    group: 'bygningen',
    scenarioKey: null,
    futureSource: 'Riksantikvaren',
  },

  // ── Klima & vær ───────────────────────────────────────────
  {
    id: 'klima-weather',
    label: 'Hvordan er været her akkurat nå?',
    question: 'Hvordan er været på denne adressen akkurat nå?',
    group: 'klima',
    scenarioKey: 'weather',
  },
  {
    id: 'klima-air',
    label: 'Luftkvalitet i dag',
    question: 'Hvordan er luftkvaliteten på denne adressen i dag?',
    group: 'klima',
    scenarioKey: null,
    futureSource: 'NILU',
  },
  {
    id: 'klima-flood',
    label: 'Flom- og havnivårisiko',
    question: 'Hva er flom- og havnivårisikoen for denne adressen?',
    group: 'klima',
    scenarioKey: null,
    futureSource: 'NVE',
  },

  // ── Tilkomst ──────────────────────────────────────────────
  {
    id: 'tilkomst-transit',
    label: 'Nærmeste kollektivtransport',
    question: 'Hvor er nærmeste kollektivtransport fra denne adressen?',
    group: 'tilkomst',
    scenarioKey: null,
    futureSource: 'Entur',
  },
  {
    id: 'tilkomst-schools',
    label: 'Skoler som dekker denne adressen',
    question: 'Hvilke skoler dekker denne adressen?',
    group: 'tilkomst',
    scenarioKey: null,
    futureSource: 'Skoleporten',
  },
  {
    id: 'tilkomst-walk',
    label: 'Gå- og sykkelvennlighet',
    question: 'Hvor gå- og sykkelvennlig er denne adressen?',
    group: 'tilkomst',
    scenarioKey: null,
    futureSource: 'OpenStreetMap',
  },
];

export const itemsForGroup = (key: RailGroupKey): ExtendedRailItem[] =>
  EXTENDED_RAIL.filter((it) => it.group === key);

export const groupForKey = (key: RailGroupKey): RailGroup => {
  const g = RAIL_GROUPS.find((it) => it.key === key);
  if (!g) throw new Error(`No rail group for key: ${key}`);
  return g;
};
