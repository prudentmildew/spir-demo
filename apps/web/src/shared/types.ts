// Local mirror of apps/api/src/domain/{query,routing-plan,match}.ts response shape.
// Duplicated for prototype isolation; the chosen register's v1 wiring will import
// from the api workspace directly via `import type`.

export type Matrikkel = {
  knr: string;
  gnr: number;
  bnr: number;
  snr?: number;
};

export type Match = {
  address: string;
  matrikkel: Matrikkel;
  kommunenr: string;
  kommunenavn: string;
  lat: number;
  lon: number;
};

export type Citation = {
  source: string;
  url: string;
  field?: string;
};

export type TraceStep = {
  step: string;
  tool: string;
  input: Record<string, unknown>;
  ok: boolean;
  output?: unknown;
};

export type GetMunicipalityStatsStep = {
  tool: 'get_municipality_stats';
  metric: 'population';
};
export type SearchArticlesStep = { tool: 'search_articles'; query: string };
export type GetWeatherStep = { tool: 'get_weather' };
export type SearchPapersStep = { tool: 'search_papers'; query: string };

export type RoutingStep =
  | GetMunicipalityStatsStep
  | SearchArticlesStep
  | GetWeatherStep
  | SearchPapersStep;

export type RoutingPlan = {
  steps: RoutingStep[];
  outOfScope?: { reason: string };
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
  trace: TraceStep[];
  grounded: boolean;
  plan?: RoutingPlan;
};

export type Turn = {
  id: string;
  question: string;
  scenarioKey: ScenarioKey;
  response: QueryResponse;
  totalMs: number;
  startedAt: number;
};

export type ScenarioKey = 'refusal' | 'population' | 'weather' | 'neighborhood' | 'both';

export type RailItem = {
  label: string;
  question: string;
  scenarioKey: ScenarioKey | null; // null = wired in v1 but not in prototype fixtures
  norwegian?: boolean;
};

// Stable content-derived keys so React lists don't lean on array index.
// Trace-step keys disambiguate steps with the same tool name (e.g. multiple
// search_articles calls) by appending the JSON of `input`.
export const traceStepKey = (s: TraceStep): string =>
  `${s.step}:${s.tool}:${JSON.stringify(s.input)}`;

export const routingStepKey = (s: RoutingStep): string => {
  if (s.tool === 'get_municipality_stats') return `gms:${s.metric}`;
  if (s.tool === 'search_articles') return `sa:${s.query}`;
  if (s.tool === 'get_weather') return 'gw';
  if (s.tool === 'search_papers') return `sp:${s.query}`;
  return JSON.stringify(s);
};

export const citationKey = (c: Citation): string => `${c.source}:${c.field ?? ''}:${c.url}`;
