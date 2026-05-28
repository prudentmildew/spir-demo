import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuery } from '../src/orchestrator/handle-query.ts';
import type { Match } from '../src/domain/match.ts';
import type { StatPoint } from '../src/domain/stat-point.ts';

const neverCalledStats = async (): Promise<StatPoint[]> => {
  throw new Error('getMunicipalityStats should not be called in this branch');
};

const sampleMatch: Match = {
  address: 'Karl Johans gate 5, 0154 Oslo',
  matrikkel: { knr: '0301', gnr: 207, bnr: 264 },
  kommunenr: '0301',
  lat: 59.911491,
  lon: 10.741234,
};

test('single match + SSB returns one StatPoint: grounded answer from both sources', async () => {
  const resolveAddress = async () => [sampleMatch];
  const statPoint: StatPoint = {
    metric: 'population',
    kommunenr: '0301',
    year: 2024,
    value: 717710,
  };
  const calls: Array<{ kommunenr: string; metric: 'population' }> = [];
  const getMunicipalityStats = async (kommunenr: string, metric: 'population') => {
    calls.push({ kommunenr, metric });
    return [statPoint];
  };

  const response = await handleQuery(
    { query: 'tell me about this place', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats },
  );

  assert.deepEqual(calls, [{ kommunenr: '0301', metric: 'population' }]);
  assert.equal(response.grounded, true);
  assert.equal(
    response.answer,
    'Karl Johans gate 5, 0154 Oslo is in kommune 0301. Population in 2024 was 717710.',
  );
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[0]?.field, 'kommunenr');
  assert.equal(response.citations[1]?.source, 'ssb');
  assert.equal(response.citations[1]?.field, 'population');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[0]?.step, 'resolve_address');
  assert.equal(response.trace[0]?.tool, 'kartverket');
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.output, sampleMatch);
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.tool, 'ssb');
  assert.equal(response.trace[1]?.ok, true);
  assert.deepEqual(response.trace[1]?.input, { kommunenr: '0301', metric: 'population' });
  assert.deepEqual(response.trace[1]?.output, [statPoint]);
});

test('single match + SSB returns multiple StatPoints: answer uses latest year', async () => {
  const resolveAddress = async () => [sampleMatch];
  const points: StatPoint[] = [
    { metric: 'population', kommunenr: '0301', year: 2022, value: 699827 },
    { metric: 'population', kommunenr: '0301', year: 2024, value: 717710 },
    { metric: 'population', kommunenr: '0301', year: 2023, value: 709037 },
  ];
  const getMunicipalityStats = async () => points;

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats },
  );

  assert.equal(response.grounded, true);
  assert.match(response.answer, /2024/);
  assert.match(response.answer, /717710/);
  assert.doesNotMatch(response.answer, /2022|2023/);
});

test('single match + SSB returns empty: degrades to grounded:false, kartverket-only citation', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => [];

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /population/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.tool, 'ssb');
  assert.equal(response.trace[1]?.ok, true);
  assert.deepEqual(response.trace[1]?.output, []);
});

test('single match + SSB throws: degrades to grounded:false, SSB trace step ok:false', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => {
    throw new Error('SSB unreachable');
  };

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /population/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.tool, 'ssb');
  assert.equal(response.trace[1]?.ok, false);
  assert.deepEqual(response.trace[1]?.input, { kommunenr: '0301', metric: 'population' });
});

test('zero matches: handler returns grounded:false clarification', async () => {
  const resolveAddress = async () => [];

  const response = await handleQuery(
    { query: 'q', address: 'Nonexistent vei 999, Nowhere' },
    { resolveAddress, getMunicipalityStats: neverCalledStats },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /address/i);
  assert.equal(response.citations.length, 0);
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.step, 'resolve_address');
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.output, []);
});

test('multiple matches: handler returns clarification with candidates in trace', async () => {
  const other: Match = {
    ...sampleMatch,
    address: 'Karl Johans gate 5, 9999 Other',
    kommunenr: '5001',
    matrikkel: { knr: '5001', gnr: 1, bnr: 2 },
  };
  const resolveAddress = async () => [sampleMatch, other];

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5' },
    { resolveAddress, getMunicipalityStats: neverCalledStats },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /candidates|multiple|ambiguous|disambiguate/i);
  assert.equal(response.citations.length, 0);
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.output, [sampleMatch, other]);
});
