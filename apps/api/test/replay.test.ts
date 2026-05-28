import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReplayDeps, replayCase } from '../src/evals/replay.ts';
import { handleQuery } from '../src/orchestrator/handle-query.ts';
import type { QueryResponse } from '../src/domain/query.ts';
import type { Match } from '../src/domain/match.ts';
import type { StatPoint } from '../src/domain/stat-point.ts';
import type { Chunk } from '../src/domain/chunk.ts';
import type { Forecast } from '../src/domain/forecast.ts';

const sampleMatch: Match = {
  address: 'Karl Johans gate 5, 0154 Oslo',
  matrikkel: { knr: '0301', gnr: 207, bnr: 264 },
  kommunenr: '0301',
  kommunenavn: 'Oslo',
  lat: 59.911491,
  lon: 10.741234,
};

const statPoint: StatPoint = {
  metric: 'population',
  kommunenr: '0301',
  year: 2024,
  value: 717710,
};

const recordedBothSources: QueryResponse = {
  answer:
    'Karl Johans gate 5, 0154 Oslo ligger i kommune 0301. Folketallet i 2024 var 717 710. Fra «Oslo»: Oslo is the capital and most populous city of Norway.',
  grounded: true,
  citations: [
    { source: 'kartverket', url: 'https://ws.geonorge.no/adresser/v1/sok', field: 'kommunenr' },
    { source: 'ssb', url: 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/11342/data', field: 'population' },
    { source: 'web', url: 'https://en.wikipedia.org/wiki/Oslo', field: 'Oslo' },
  ],
  trace: [
    { step: 'resolve_address', tool: 'kartverket', input: { query: 'Karl Johans gate 5, Oslo' }, ok: true, output: sampleMatch },
    { step: 'get_municipality_stats', tool: 'ssb', input: { kommunenr: '0301', metric: 'population' }, ok: true, output: [statPoint] },
    { step: 'search_web', tool: 'web', input: { query: 'Oslo' }, ok: true, output: [
      { text: 'Oslo is the capital and most populous city of Norway.', title: 'Oslo', url: 'https://en.wikipedia.org/wiki/Oslo', score: 0.95 },
    ] },
  ],
  plan: {
    steps: [
      { tool: 'get_municipality_stats', metric: 'population' },
      { tool: 'search_web', query: 'Oslo' },
    ],
  },
};

const recordedSsbThrew: QueryResponse = {
  answer: 'Karl Johans gate 5, 0154 Oslo ligger i kommune 0301, men folketall var ikke tilgjengelig.',
  grounded: false,
  citations: [
    { source: 'kartverket', url: 'https://ws.geonorge.no/adresser/v1/sok', field: 'kommunenr' },
  ],
  trace: [
    { step: 'resolve_address', tool: 'kartverket', input: { query: 'q' }, ok: true, output: sampleMatch },
    { step: 'get_municipality_stats', tool: 'ssb', input: { kommunenr: '0301', metric: 'population' }, ok: false },
  ],
  plan: { steps: [{ tool: 'get_municipality_stats', metric: 'population' }] },
};

test('replay adapter throws when the recorded step was ok:false (so the orchestrator takes the same degraded path)', async () => {
  const deps = buildReplayDeps(recordedSsbThrew);

  await assert.rejects(deps.getMunicipalityStats('0301', 'population'), /ssb|ok:?false|recorded failure/i);
});

test('replayCase reproduces the recorded answer/grounded/citations end-to-end', async () => {
  const replayed = await replayCase(recordedBothSources, {
    query: 'q',
    address: 'Karl Johans gate 5, Oslo',
  });

  assert.equal(replayed.answer, recordedBothSources.answer);
  assert.equal(replayed.grounded, recordedBothSources.grounded);
  assert.deepEqual(replayed.citations, recordedBothSources.citations);
  assert.deepEqual(replayed.plan, recordedBothSources.plan);
});

test('replay adapter throws with a clear message when the orchestrator calls a tool that has no recorded step', async () => {
  // recordedBothSources covers SSB + web search; MET was never called. If replay
  // wires MET regardless, calling it should be loud, not return undefined.
  const deps = buildReplayDeps(recordedBothSources);

  await assert.rejects(deps.getWeather(59.9, 10.7), /get_weather.*not.*recorded|no recorded step/i);
});

test('buildReplayDeps yields the recorded routing plan and recorded tool outputs', async () => {
  const deps = buildReplayDeps(recordedBothSources);

  const matches = await deps.resolveAddress('any query — replay ignores it');
  assert.deepEqual(matches, [sampleMatch], 'resolveAddress should yield the recorded match wrapped as an array');

  const plan = await deps.route('any', sampleMatch);
  assert.deepEqual(plan, recordedBothSources.plan);

  const stats = await deps.getMunicipalityStats('0301', 'population');
  assert.deepEqual(stats, [statPoint]);

  const chunks = await deps.searchWeb('Oslo');
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]?.title, 'Oslo');
});
