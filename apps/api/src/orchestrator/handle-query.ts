import type { Chunk } from '../domain/chunk.ts';
import type { Match } from '../domain/match.ts';
import type { QueryRequest, QueryResponse } from '../domain/query.ts';
import type { StatPoint } from '../domain/stat-point.ts';

export type ResolveAddress = (query: string) => Promise<Match[]>;
export type GetMunicipalityStats = (
  kommunenr: string,
  metric: 'population',
) => Promise<StatPoint[]>;
export type SearchArticles = (query: string) => Promise<Chunk[]>;

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';
const SSB_URL = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';

export async function handleQuery(
  input: QueryRequest,
  deps: {
    resolveAddress: ResolveAddress;
    getMunicipalityStats: GetMunicipalityStats;
    searchArticles: SearchArticles;
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
        { step: 'resolve_address', tool: 'kartverket', input: { query }, ok: true, output: matches },
      ],
    };
  }

  const match = matches[0]!;
  const resolveStep = {
    step: 'resolve_address',
    tool: 'kartverket',
    input: { query },
    ok: true as const,
    output: match,
  };
  const kartverketCitation = { source: 'kartverket', url: KARTVERKET_URL, field: 'kommunenr' };

  const ssbInput = { kommunenr: match.kommunenr, metric: 'population' as const };

  let ssbSentence: string;
  let ssbCitations: QueryResponse['citations'];
  let ssbTraceStep: QueryResponse['trace'][number];
  let ssbGrounded: boolean;
  try {
    const stats = await deps.getMunicipalityStats(match.kommunenr, 'population');
    const latest = stats.reduce<StatPoint | undefined>(
      (acc, p) => (acc === undefined || p.year > acc.year ? p : acc),
      undefined,
    );
    ssbTraceStep = {
      step: 'get_municipality_stats',
      tool: 'ssb',
      input: ssbInput,
      ok: true,
      output: stats,
    };
    if (latest === undefined) {
      ssbSentence = `${match.address} resolved to kommune ${match.kommunenr}, but population data wasn't available.`;
      ssbCitations = [];
      ssbGrounded = false;
    } else {
      ssbSentence = `${match.address} is in kommune ${match.kommunenr}. Population in ${latest.year} was ${latest.value}.`;
      ssbCitations = [{ source: 'ssb', url: SSB_URL, field: 'population' }];
      ssbGrounded = true;
    }
  } catch {
    ssbSentence = `${match.address} resolved to kommune ${match.kommunenr}, but population data wasn't available.`;
    ssbCitations = [];
    ssbGrounded = false;
    ssbTraceStep = {
      step: 'get_municipality_stats',
      tool: 'ssb',
      input: ssbInput,
      ok: false,
    };
  }

  const wikipediaInput = { query: match.kommunenavn };
  let chunks: Chunk[] = [];
  let wikipediaOk = true;
  try {
    chunks = await deps.searchArticles(match.kommunenavn);
  } catch {
    wikipediaOk = false;
  }

  const wikipediaTraceStep: QueryResponse['trace'][number] = wikipediaOk
    ? {
        step: 'search_articles',
        tool: 'wikipedia',
        input: wikipediaInput,
        ok: true,
        output: chunks,
      }
    : {
        step: 'search_articles',
        tool: 'wikipedia',
        input: wikipediaInput,
        ok: false,
      };

  const topChunk = chunks[0];
  const answer =
    topChunk !== undefined
      ? `${ssbSentence} About ${match.kommunenavn}: ${topChunk.text}`
      : ssbSentence;
  const citations: QueryResponse['citations'] = [kartverketCitation, ...ssbCitations];
  if (topChunk !== undefined) {
    citations.push({ source: 'wikipedia', url: topChunk.url, field: topChunk.title });
  }

  return {
    answer,
    grounded: ssbGrounded,
    citations,
    trace: [resolveStep, ssbTraceStep, wikipediaTraceStep],
  };
}
