import type { QueryResponse, ScenarioKey } from './types.ts';

// Canned QueryResponse fixtures. Shapes mirror the orchestrator's real
// output for Dronning Mauds gate 10. Used by every prototype so the
// render problem is judged independently of the API integration.

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';
const SSB_URL = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';
const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const OSLO_WEB_URL = 'https://www.oslo.kommune.no/om-oslo-kommune/';
const FROGNER_WEB_URL = 'https://www.oslo.kommune.no/bydeler/bydel-frogner/';

const KARTVERKET_CITATION = {
  source: 'kartverket',
  url: KARTVERKET_URL,
  field: 'kommunenr',
};

const RESOLVE_STEP = {
  step: 'resolve_address',
  tool: 'kartverket',
  input: { query: 'Dronning Mauds gate 10, 0250 Oslo' },
  ok: true,
  output: {
    address: 'Dronning Mauds gate 10, 0250 Oslo',
    kommunenr: '0301',
    kommunenavn: 'Oslo',
    lat: 59.9118,
    lon: 10.7261,
  },
};

export const REFUSAL: QueryResponse = {
  answer:
    'Dronning Mauds gate 10, 0250 Oslo ligger i kommune 0301, men eierskap (hjemmelshaver) registreres i matrikkelregisteret, som denne demoen ikke leser.',
  citations: [KARTVERKET_CITATION],
  trace: [RESOLVE_STEP],
  grounded: false,
  plan: {
    steps: [],
    outOfScope: {
      reason:
        'eierskap (hjemmelshaver) registreres i matrikkelregisteret, som denne demoen ikke leser',
    },
  },
};

export const POPULATION: QueryResponse = {
  answer:
    'Dronning Mauds gate 10, 0250 Oslo ligger i kommune 0301. Folketallet i 2024 var 717 710.',
  citations: [KARTVERKET_CITATION, { source: 'ssb', url: SSB_URL, field: 'population' }],
  trace: [
    RESOLVE_STEP,
    {
      step: 'get_municipality_stats',
      tool: 'ssb',
      input: { kommunenr: '0301', metric: 'population' },
      ok: true,
      output: [
        { year: 2022, value: 699_827 },
        { year: 2023, value: 709_037 },
        { year: 2024, value: 717_710 },
      ],
    },
  ],
  grounded: true,
  plan: {
    steps: [{ tool: 'get_municipality_stats', metric: 'population' }],
  },
};

export const WEATHER: QueryResponse = {
  answer:
    'Dronning Mauds gate 10, 0250 Oslo ligger i kommune 0301. Aktuelt vær ved eiendommen: 9 °C, delvis skyet, 0,4 mm nedbør ventet de neste 6 timene.',
  citations: [KARTVERKET_CITATION, { source: 'met', url: MET_URL, field: 'forecast' }],
  trace: [
    RESOLVE_STEP,
    {
      step: 'get_weather',
      tool: 'met',
      input: { lat: 59.9118, lon: 10.7261 },
      ok: true,
      output: {
        temperatureCelsius: 9,
        symbolCode: 'partlycloudy_day',
        precipitationMmNext6h: 0.4,
      },
    },
  ],
  grounded: true,
  plan: {
    steps: [{ tool: 'get_weather' }],
  },
};

export const NEIGHBORHOOD: QueryResponse = {
  answer:
    'Dronning Mauds gate 10, 0250 Oslo ligger i kommune 0301. Fra «Frogner»: Frogner er en velstående bydel vest i Oslo sentrum, kjent for skulpturparken, ambassadestrøket og 1800-talls­arkitekturen langs Bygdøy allé.',
  citations: [
    KARTVERKET_CITATION,
    { source: 'web', url: FROGNER_WEB_URL, field: 'Frogner' },
  ],
  trace: [
    RESOLVE_STEP,
    {
      step: 'search_web',
      tool: 'web',
      input: { query: 'Frogner Oslo bydel' },
      ok: true,
      output: [
        {
          title: 'Frogner',
          url: FROGNER_WEB_URL,
          text: 'Frogner er en velstående bydel vest i Oslo sentrum, kjent for skulpturparken, ambassadestrøket og 1800-talls­arkitekturen langs Bygdøy allé.',
        },
      ],
    },
  ],
  grounded: true,
  plan: {
    steps: [{ tool: 'search_web', query: 'Frogner Oslo bydel' }],
  },
};

export const BOTH: QueryResponse = {
  answer:
    'Dronning Mauds gate 10, 0250 Oslo ligger i kommune 0301. Folketallet i 2024 var 717 710. Fra «Oslo»: Oslo er Norges hovedstad og største by, innerst i Oslofjorden — et levende politisk, økonomisk og kulturelt sentrum.',
  citations: [
    KARTVERKET_CITATION,
    { source: 'ssb', url: SSB_URL, field: 'population' },
    { source: 'web', url: OSLO_WEB_URL, field: 'Oslo' },
  ],
  trace: [
    RESOLVE_STEP,
    {
      step: 'get_municipality_stats',
      tool: 'ssb',
      input: { kommunenr: '0301', metric: 'population' },
      ok: true,
      output: [{ year: 2024, value: 717_710 }],
    },
    {
      step: 'search_web',
      tool: 'web',
      input: { query: 'Oslo' },
      ok: true,
      output: [
        {
          title: 'Oslo',
          url: OSLO_WEB_URL,
          text: 'Oslo er Norges hovedstad og største by, innerst i Oslofjorden — et levende politisk, økonomisk og kulturelt sentrum.',
        },
      ],
    },
  ],
  grounded: true,
  plan: {
    steps: [
      { tool: 'get_municipality_stats', metric: 'population' },
      { tool: 'search_web', query: 'Oslo' },
    ],
  },
};

export const FIXTURES: Record<ScenarioKey, QueryResponse> = {
  refusal: REFUSAL,
  population: POPULATION,
  weather: WEATHER,
  neighborhood: NEIGHBORHOOD,
  both: BOTH,
};

// Plausible per-scenario wall-times for the demo. Real v1 measures client-side.
export const FAKE_LATENCY_MS: Record<ScenarioKey, number> = {
  refusal: 412,
  population: 1_247,
  weather: 880,
  neighborhood: 1_120,
  both: 1_640,
};
