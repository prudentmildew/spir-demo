import type { Match } from '../domain/match.ts';
import type { QueryRequest, QueryResponse } from '../domain/query.ts';

export type ResolveAddress = (query: string) => Promise<Match[]>;

const KARTVERKET_URL = 'https://ws.geonorge.no/adresser/v1/sok';

export async function handleQuery(
  input: QueryRequest,
  deps: { resolveAddress: ResolveAddress },
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

  return {
    answer: '',
    grounded: false,
    citations: [{ source: 'kartverket', url: KARTVERKET_URL }],
    trace: [
      {
        step: 'resolve_address',
        tool: 'kartverket',
        input: { query },
        ok: true,
        output: matches[0],
      },
    ],
  };
}
