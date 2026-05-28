import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMunicipalityStats, SSB_TABLE_11342_URL } from '../src/tools/ssb.ts';

const fakeJsonFetch = (body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

// Minimal JSON-stat2 shape recorded from SSB table 11342 (population by kommune)
// for kommunenr 0301 (Oslo), year 2025.
const ssbSingleYearBody = {
  version: '2.0',
  class: 'dataset',
  id: ['Region', 'ContentsCode', 'Tid'],
  size: [1, 1, 1],
  dimension: {
    Region: {
      label: 'region',
      category: { index: { '0301': 0 }, label: { '0301': 'Oslo' } },
    },
    ContentsCode: {
      label: 'statistikkvariabel',
      category: {
        index: { Folkemengde: 0 },
        label: { Folkemengde: 'Befolkning per 1.1. (personer)' },
      },
    },
    Tid: {
      label: 'år',
      category: { index: { '2025': 0 }, label: { '2025': '2025' } },
    },
  },
  value: [724290],
};

test('adapter parses SSB population response into StatPoint[] for one year', async () => {
  const fetchFn = fakeJsonFetch(ssbSingleYearBody);

  const points = await getMunicipalityStats('0301', 'population', { fetch: fetchFn });

  assert.equal(points.length, 1);
  const p = points[0]!;
  assert.equal(p.metric, 'population');
  assert.equal(p.kommunenr, '0301');
  assert.equal(p.year, 2025);
  assert.equal(p.value, 724290);
});

test('adapter parses multi-year SSB response into one StatPoint per year', async () => {
  // Tid.category.index intentionally out of order; the adapter must pair each
  // value with its declared position, not assume sort order.
  const ssbMultiYearBody = {
    version: '2.0',
    class: 'dataset',
    id: ['Region', 'ContentsCode', 'Tid'],
    size: [1, 1, 3],
    dimension: {
      Region: {
        label: 'region',
        category: { index: { '0301': 0 }, label: { '0301': 'Oslo' } },
      },
      ContentsCode: {
        label: 'statistikkvariabel',
        category: {
          index: { Folkemengde: 0 },
          label: { Folkemengde: 'Befolkning per 1.1. (personer)' },
        },
      },
      Tid: {
        label: 'år',
        category: {
          index: { '2024': 1, '2023': 0, '2025': 2 },
          label: { '2023': '2023', '2024': '2024', '2025': '2025' },
        },
      },
    },
    value: [709037, 717710, 724290],
  };
  const fetchFn = fakeJsonFetch(ssbMultiYearBody);

  const points = await getMunicipalityStats('0301', 'population', { fetch: fetchFn });

  const byYear = new Map(points.map((p) => [p.year, p.value]));
  assert.equal(points.length, 3);
  assert.equal(byYear.get(2023), 709037);
  assert.equal(byYear.get(2024), 717710);
  assert.equal(byYear.get(2025), 724290);
  for (const p of points) {
    assert.equal(p.metric, 'population');
    assert.equal(p.kommunenr, '0301');
  }
});

test('adapter POSTs to the SSB table 11342 endpoint with the kommunenr and Folkemengde selection', async () => {
  const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      init,
    });
    return new Response(JSON.stringify(ssbSingleYearBody), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  await getMunicipalityStats('0301', 'population', { fetch: fetchFn });

  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(`${call.url.origin}${call.url.pathname}`, SSB_TABLE_11342_URL);
  assert.equal(call.url.searchParams.get('outputFormat'), 'json-stat2');
  assert.equal(call.init?.method, 'POST');

  const body = JSON.parse(String(call.init?.body));
  const byVar = new Map<string, string[]>(
    (body.selection as Array<{ variableCode: string; valueCodes: string[] }>).map(
      (s) => [s.variableCode, s.valueCodes],
    ),
  );
  assert.deepEqual(byVar.get('Region'), ['0301']);
  assert.deepEqual(byVar.get('ContentsCode'), ['Folkemengde']);
  assert.ok(byVar.has('Tid'), 'selection must include a Tid clause');
});
