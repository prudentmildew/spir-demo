import type { Match } from '../domain/match.ts';
import type { QueryRequest, QueryResponse } from '../domain/query.ts';
import type { StatPoint } from '../domain/stat-point.ts';

export type ResolveAddress = (query: string) => Promise<Match[]>;
export type GetMunicipalityStats = (
  kommunenr: string,
  metric: 'population',
) => Promise<StatPoint[]>;

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';
const SSB_URL = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';

export async function handleQuery(
  input: QueryRequest,
  deps: { resolveAddress: ResolveAddress; getMunicipalityStats: GetMunicipalityStats },
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

  let stats: StatPoint[];
  try {
    stats = await deps.getMunicipalityStats(match.kommunenr, 'population');
  } catch {
    return {
      answer: `${match.address} resolved to kommune ${match.kommunenr}, but population data wasn't available.`,
      grounded: false,
      citations: [kartverketCitation],
      trace: [
        resolveStep,
        {
          step: 'get_municipality_stats',
          tool: 'ssb',
          input: ssbInput,
          ok: false,
        },
      ],
    };
  }

  const latest = stats.reduce<StatPoint | undefined>(
    (acc, p) => (acc === undefined || p.year > acc.year ? p : acc),
    undefined,
  );

  if (latest === undefined) {
    return {
      answer: `${match.address} resolved to kommune ${match.kommunenr}, but population data wasn't available.`,
      grounded: false,
      citations: [kartverketCitation],
      trace: [
        resolveStep,
        {
          step: 'get_municipality_stats',
          tool: 'ssb',
          input: ssbInput,
          ok: true,
          output: stats,
        },
      ],
    };
  }

  return {
    answer: `${match.address} is in kommune ${match.kommunenr}. Population in ${latest.year} was ${latest.value}.`,
    grounded: true,
    citations: [
      kartverketCitation,
      { source: 'ssb', url: SSB_URL, field: 'population' },
    ],
    trace: [
      resolveStep,
      {
        step: 'get_municipality_stats',
        tool: 'ssb',
        input: ssbInput,
        ok: true,
        output: stats,
      },
    ],
  };
}
