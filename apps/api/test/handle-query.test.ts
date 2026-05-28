import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuery } from '../src/orchestrator/handle-query.ts';
import type { Match } from '../src/domain/match.ts';

const sampleMatch: Match = {
  address: 'Karl Johans gate 5, 0154 Oslo',
  matrikkel: { knr: '0301', gnr: 207, bnr: 264 },
  kommunenr: '0301',
  lat: 59.911491,
  lon: 10.741234,
};

test('single match: handler returns §4 response with match surfaced in trace', async () => {
  const resolveAddress = async () => [sampleMatch];

  const response = await handleQuery(
    { query: 'tell me about this place', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress },
  );

  assert.equal(response.grounded, false);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.step, 'resolve_address');
  assert.equal(response.trace[0]?.tool, 'kartverket');
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.input, { query: 'Karl Johans gate 5, Oslo' });
  assert.deepEqual(response.trace[0]?.output, sampleMatch);
});

test('zero matches: handler returns grounded:false clarification', async () => {
  const resolveAddress = async () => [];

  const response = await handleQuery(
    { query: 'q', address: 'Nonexistent vei 999, Nowhere' },
    { resolveAddress },
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
    { resolveAddress },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /candidates|multiple|ambiguous|disambiguate/i);
  assert.equal(response.citations.length, 0);
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.output, [sampleMatch, other]);
});
