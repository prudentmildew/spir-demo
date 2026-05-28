import type { Chunk } from '../domain/chunk.ts';
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
export type Route = (query: string, match: Match) => Promise<RoutingPlan>;

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';
const SSB_URL = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';

type Trace = QueryResponse['trace'];
type TraceStep = Trace[number];
type Citation = QueryResponse['citations'][number];

export async function handleQuery(
  input: QueryRequest,
  deps: {
    resolveAddress: ResolveAddress;
    getMunicipalityStats: GetMunicipalityStats;
    searchArticles: SearchArticles;
    route: Route;
  },
): Promise<QueryResponse> {
  const query = input.address ?? input.query;
  const matches = await deps.resolveAddress(query);

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

  const plan = await deps.route(input.query, match);

  if (plan.outOfScope !== undefined) {
    return {
      answer: `${match.address} is in kommune ${match.kommunenr}, but ${plan.outOfScope.reason}.`,
      grounded: false,
      citations: [kartverketCitation],
      trace: [resolveStep],
    };
  }

  const trace: Trace = [resolveStep];
  const citations: Citation[] = [kartverketCitation];

  let ssbInvoked = false;
  let ssbLatest: StatPoint | null = null;
  let ssbDegraded = false;
  let wikiTopChunk: Chunk | null = null;

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

  return {
    answer: sentences.join(' '),
    grounded,
    citations,
    trace,
  };
}
