import type { Chunk } from '../domain/chunk.ts';
import type { Forecast } from '../domain/forecast.ts';
import type { Match } from '../domain/match.ts';
import type { QueryRequest, QueryResponse } from '../domain/query.ts';
import type { RoutingPlan } from '../domain/routing-plan.ts';
import type { StatPoint } from '../domain/stat-point.ts';

export type ResolveAddress = (query: string) => Promise<Match[]>;
export type GetMunicipalityStats = (
  kommunenr: string,
  metric: 'population',
) => Promise<StatPoint[]>;
export type SearchArticles = (query: string) => Promise<Chunk[]>;
export type GetWeather = (lat: number, lon: number) => Promise<Forecast>;
export type SearchPapers = (query: string) => Promise<Chunk[]>;
export type Route = (query: string, match: Match) => Promise<RoutingPlan>;

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';
const SSB_URL = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';
const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';

type Trace = QueryResponse['trace'];
type TraceStep = Trace[number];
type Citation = QueryResponse['citations'][number];

export async function handleQuery(
  input: QueryRequest,
  deps: {
    resolveAddress: ResolveAddress;
    getMunicipalityStats: GetMunicipalityStats;
    searchArticles: SearchArticles;
    getWeather: GetWeather;
    searchPapers: SearchPapers;
    route: Route;
  },
): Promise<QueryResponse> {
  const query = input.address ?? input.query;
  let matches: Match[];
  try {
    matches = await deps.resolveAddress(query);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      answer: `Address lookup is unavailable right now (${message}). Please try again.`,
      grounded: false,
      citations: [],
      trace: [{ step: 'resolve_address', tool: 'kartverket', input: { query }, ok: false }],
    };
  }

  if (matches.length === 0) {
    return {
      answer: `No match for address "${query}". Please refine and try again.`,
      grounded: false,
      citations: [],
      trace: [
        { step: 'resolve_address', tool: 'kartverket', input: { query }, ok: true, output: [] },
      ],
    };
  }

  if (matches.length > 1) {
    return {
      answer: `Address "${query}" matched ${matches.length} candidates — please disambiguate.`,
      grounded: false,
      citations: [],
      trace: [
        {
          step: 'resolve_address',
          tool: 'kartverket',
          input: { query },
          ok: true,
          output: matches,
        },
      ],
    };
  }

  const match = matches[0]!;
  const resolveStep: TraceStep = {
    step: 'resolve_address',
    tool: 'kartverket',
    input: { query },
    ok: true,
    output: match,
  };
  const kartverketCitation: Citation = {
    source: 'kartverket',
    url: KARTVERKET_URL,
    field: 'kommunenr',
  };

  let plan: RoutingPlan;
  try {
    plan = await deps.route(input.query, match);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      answer: `${match.address} is in kommune ${match.kommunenr}, but the router is unavailable right now (${message}).`,
      grounded: false,
      citations: [kartverketCitation],
      trace: [resolveStep],
    };
  }

  if (plan.outOfScope !== undefined) {
    return {
      answer: `${match.address} is in kommune ${match.kommunenr}, but ${plan.outOfScope.reason}.`,
      grounded: false,
      citations: [kartverketCitation],
      trace: [resolveStep],
      plan,
    };
  }

  const trace: Trace = [resolveStep];
  const citations: Citation[] = [kartverketCitation];

  let ssbInvoked = false;
  let ssbLatest: StatPoint | null = null;
  let ssbDegraded = false;
  let wikiTopChunk: Chunk | null = null;
  let metInvoked = false;
  let forecast: Forecast | null = null;
  let metDegraded = false;
  let arxivTopChunk: Chunk | null = null;

  for (const step of plan.steps) {
    if (step.tool === 'get_municipality_stats') {
      ssbInvoked = true;
      const ssbInput = { kommunenr: match.kommunenr, metric: step.metric };
      try {
        const stats = await deps.getMunicipalityStats(match.kommunenr, step.metric);
        trace.push({
          step: 'get_municipality_stats',
          tool: 'ssb',
          input: ssbInput,
          ok: true,
          output: stats,
        });
        const latest = stats.reduce<StatPoint | undefined>(
          (acc, p) => (acc === undefined || p.year > acc.year ? p : acc),
          undefined,
        );
        if (latest === undefined) {
          ssbDegraded = true;
        } else {
          ssbLatest = latest;
          citations.push({ source: 'ssb', url: SSB_URL, field: step.metric });
        }
      } catch {
        ssbDegraded = true;
        trace.push({
          step: 'get_municipality_stats',
          tool: 'ssb',
          input: ssbInput,
          ok: false,
        });
      }
    } else if (step.tool === 'search_articles') {
      const wikipediaInput = { query: step.query };
      try {
        const chunks = await deps.searchArticles(step.query);
        trace.push({
          step: 'search_articles',
          tool: 'wikipedia',
          input: wikipediaInput,
          ok: true,
          output: chunks,
        });
        const top = chunks[0];
        if (top !== undefined) {
          wikiTopChunk = top;
          citations.push({ source: 'wikipedia', url: top.url, field: top.title });
        }
      } catch {
        trace.push({
          step: 'search_articles',
          tool: 'wikipedia',
          input: wikipediaInput,
          ok: false,
        });
      }
    } else if (step.tool === 'get_weather') {
      metInvoked = true;
      const metInput = { lat: match.lat, lon: match.lon };
      try {
        const f = await deps.getWeather(match.lat, match.lon);
        trace.push({ step: 'get_weather', tool: 'met', input: metInput, ok: true, output: f });
        forecast = f;
        citations.push({ source: 'met', url: MET_URL, field: 'forecast' });
      } catch {
        metDegraded = true;
        trace.push({ step: 'get_weather', tool: 'met', input: metInput, ok: false });
      }
    } else if (step.tool === 'search_papers') {
      const arxivInput = { query: step.query };
      try {
        const chunks = await deps.searchPapers(step.query);
        trace.push({
          step: 'search_papers',
          tool: 'arxiv',
          input: arxivInput,
          ok: true,
          output: chunks,
        });
        const top = chunks[0];
        if (top !== undefined) {
          arxivTopChunk = top;
          citations.push({ source: 'arxiv', url: top.url, field: top.title });
        }
      } catch {
        trace.push({
          step: 'search_papers',
          tool: 'arxiv',
          input: arxivInput,
          ok: false,
        });
      }
    }
  }

  const sentences: string[] = [];
  let grounded = true;

  if (ssbInvoked && ssbLatest !== null) {
    sentences.push(
      `${match.address} is in kommune ${match.kommunenr}. Population in ${ssbLatest.year} was ${ssbLatest.value}.`,
    );
  } else if (ssbInvoked && ssbDegraded) {
    sentences.push(
      `${match.address} resolved to kommune ${match.kommunenr}, but population data wasn't available.`,
    );
    grounded = false;
  } else {
    sentences.push(`${match.address} is in kommune ${match.kommunenr}.`);
  }

  if (wikiTopChunk !== null) {
    sentences.push(`About ${match.kommunenavn}: ${wikiTopChunk.text}`);
  }

  if (metInvoked && forecast !== null) {
    sentences.push(
      `Current weather at the property: ${forecast.temperatureCelsius}°C, ${forecast.symbolCode}, ${forecast.precipitationMmNext6h} mm precipitation expected in the next 6 hours.`,
    );
  } else if (metInvoked && metDegraded) {
    sentences.push(`Weather forecast wasn't available.`);
    grounded = false;
  }

  if (arxivTopChunk !== null) {
    sentences.push(`Relevant research: "${arxivTopChunk.title}" — ${arxivTopChunk.text}`);
  }

  return {
    answer: sentences.join(' '),
    grounded,
    citations,
    trace,
    plan,
  };
}
