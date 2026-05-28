import { z } from 'zod';
import type { Metric, StatPoint } from '../domain/stat-point.ts';

// SSB PxWebApi v2-beta, table 11342 (Areal og befolkning i kommuner) — picked
// over 07459 because it has no age/sex dimensions, so a population time series
// for one kommune is Region × ContentsCode × Tid with no aggregation.
export const SSB_TABLE_11342_URL =
  'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data';

const METRIC_TO_CONTENTS_CODE: Record<Metric, string> = {
  population: 'Folkemengde',
};

const SsbJsonStat2 = z.object({
  dimension: z.object({
    Tid: z.object({
      category: z.object({
        index: z.record(z.string(), z.number().int()),
      }),
    }),
  }),
  value: z.array(z.number()),
});

export async function getMunicipalityStats(
  kommunenr: string,
  metric: Metric,
  deps: { fetch: typeof fetch },
): Promise<StatPoint[]> {
  const url = new URL(SSB_TABLE_11342_URL);
  url.searchParams.set('lang', 'no');
  url.searchParams.set('outputFormat', 'json-stat2');

  const res = await deps.fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      selection: [
        { variableCode: 'Region', valueCodes: [kommunenr] },
        { variableCode: 'ContentsCode', valueCodes: [METRIC_TO_CONTENTS_CODE[metric]] },
        { variableCode: 'Tid', valueCodes: ['*'] },
      ],
    }),
  });

  const body = SsbJsonStat2.parse(await res.json());

  // For a single-Region, single-ContentsCode query the value array is indexed
  // by Tid position; pair each year code with its value.
  const yearByPosition = new Map<number, string>();
  for (const [year, position] of Object.entries(body.dimension.Tid.category.index)) {
    yearByPosition.set(position, year);
  }

  return body.value.map((value, position) => ({
    metric,
    kommunenr,
    year: Number(yearByPosition.get(position)),
    value,
  }));
}
