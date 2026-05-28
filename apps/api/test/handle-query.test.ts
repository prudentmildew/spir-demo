import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuery, type Route } from '../src/orchestrator/handle-query.ts';
import type { Match } from '../src/domain/match.ts';
import type { StatPoint } from '../src/domain/stat-point.ts';
import type { Chunk } from '../src/domain/chunk.ts';
import type { Forecast } from '../src/domain/forecast.ts';

const neverCalledStats = async (): Promise<StatPoint[]> => {
  throw new Error('getMunicipalityStats should not be called in this branch');
};

const neverCalledArticles = async (): Promise<Chunk[]> => {
  throw new Error('searchArticles should not be called in this branch');
};

const neverCalledWeather = async (): Promise<Forecast> => {
  throw new Error('getWeather should not be called in this branch');
};

const neverCalledPapers = async (): Promise<Chunk[]> => {
  throw new Error('searchPapers should not be called in this branch');
};

const neverCalledRoute: Route = async () => {
  throw new Error('route should not be called when resolution does not produce a single match');
};

const noArticles = async (): Promise<Chunk[]> => [];

const routeAll: Route = async (_query, match) => ({
  steps: [
    { tool: 'get_municipality_stats', metric: 'population' },
    { tool: 'search_articles', query: match.kommunenavn },
  ],
});

const sampleMatch: Match = {
  address: 'Karl Johans gate 5, 0154 Oslo',
  matrikkel: { knr: '0301', gnr: 207, bnr: 264 },
  kommunenr: '0301',
  kommunenavn: 'Oslo',
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
    { resolveAddress, getMunicipalityStats, searchArticles: noArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
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
  assert.equal(response.trace.length, 3);
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
    { resolveAddress, getMunicipalityStats, searchArticles: noArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
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
    { resolveAddress, getMunicipalityStats, searchArticles: noArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /population/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 3);
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
    { resolveAddress, getMunicipalityStats, searchArticles: noArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /population/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.tool, 'ssb');
  assert.equal(response.trace[1]?.ok, false);
  assert.deepEqual(response.trace[1]?.input, { kommunenr: '0301', metric: 'population' });
});

test('zero matches: handler returns grounded:false clarification', async () => {
  const resolveAddress = async () => [];

  const response = await handleQuery(
    { query: 'q', address: 'Nonexistent vei 999, Nowhere' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather: neverCalledWeather,
      searchPapers: neverCalledPapers,
      route: neverCalledRoute,
    },
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
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather: neverCalledWeather,
      searchPapers: neverCalledPapers,
      route: neverCalledRoute,
    },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /candidates|multiple|ambiguous|disambiguate/i);
  assert.equal(response.citations.length, 0);
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.ok, true);
  assert.deepEqual(response.trace[0]?.output, [sampleMatch, other]);
});

test('single match + SSB OK + Wikipedia returns one chunk: grounded answer weaves Wikipedia in', async () => {
  const resolveAddress = async () => [sampleMatch];
  const statPoint: StatPoint = {
    metric: 'population',
    kommunenr: '0301',
    year: 2024,
    value: 717710,
  };
  const getMunicipalityStats = async () => [statPoint];
  const chunk: Chunk = {
    text: 'Oslo is the capital and most populous city of Norway.',
    title: 'Oslo',
    url: 'https://en.wikipedia.org/wiki/Oslo',
    score: 0.95,
  };
  const searchCalls: string[] = [];
  const searchArticles = async (query: string): Promise<Chunk[]> => {
    searchCalls.push(query);
    return [chunk];
  };

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.deepEqual(searchCalls, ['Oslo']);
  assert.equal(response.grounded, true);
  assert.match(response.answer, /kommune 0301/);
  assert.match(response.answer, /Population in 2024 was 717710/);
  assert.match(response.answer, /Oslo is the capital and most populous city of Norway\./);
  assert.equal(response.citations.length, 3);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'ssb');
  assert.equal(response.citations[2]?.source, 'wikipedia');
  assert.equal(response.citations[2]?.url, 'https://en.wikipedia.org/wiki/Oslo');
  assert.equal(response.citations[2]?.field, 'Oslo');
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[2]?.step, 'search_articles');
  assert.equal(response.trace[2]?.tool, 'wikipedia');
  assert.deepEqual(response.trace[2]?.input, { query: 'Oslo' });
  assert.equal(response.trace[2]?.ok, true);
  assert.deepEqual(response.trace[2]?.output, [chunk]);
});

test('single match + SSB OK + Wikipedia returns multiple chunks: answer uses top (first) chunk only', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => [
    { metric: 'population', kommunenr: '0301', year: 2024, value: 717710 },
  ];
  const chunks: Chunk[] = [
    {
      text: 'TOP CHUNK TEXT about Oslo.',
      title: 'Oslo',
      url: 'https://en.wikipedia.org/wiki/Oslo',
      score: 0.95,
    },
    {
      text: 'SECOND CHUNK TEXT about Oslo history.',
      title: 'History of Oslo',
      url: 'https://en.wikipedia.org/wiki/History_of_Oslo',
      score: 0.7,
    },
    {
      text: 'THIRD CHUNK TEXT.',
      title: 'Oslo Cathedral',
      url: 'https://en.wikipedia.org/wiki/Oslo_Cathedral',
      score: 0.4,
    },
  ];
  const searchArticles = async (): Promise<Chunk[]> => chunks;

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.match(response.answer, /TOP CHUNK TEXT about Oslo\./);
  assert.doesNotMatch(response.answer, /SECOND CHUNK TEXT/);
  assert.doesNotMatch(response.answer, /THIRD CHUNK TEXT/);
  assert.equal(response.citations.length, 3);
  assert.equal(response.citations[2]?.url, 'https://en.wikipedia.org/wiki/Oslo');
  assert.equal(response.citations[2]?.field, 'Oslo');
  assert.deepEqual(response.trace[2]?.output, chunks);
});

test('single match + SSB OK + Wikipedia returns empty: no Wikipedia sentence, ssb-only citations, wikipedia trace step ok:true output:[]', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => [
    { metric: 'population', kommunenr: '0301', year: 2024, value: 717710 },
  ];
  const searchArticles = async (): Promise<Chunk[]> => [];

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.equal(response.grounded, true);
  assert.equal(
    response.answer,
    'Karl Johans gate 5, 0154 Oslo is in kommune 0301. Population in 2024 was 717710.',
  );
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'ssb');
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[2]?.step, 'search_articles');
  assert.equal(response.trace[2]?.tool, 'wikipedia');
  assert.deepEqual(response.trace[2]?.input, { query: 'Oslo' });
  assert.equal(response.trace[2]?.ok, true);
  assert.deepEqual(response.trace[2]?.output, []);
});

test('single match + SSB OK + Wikipedia throws: no Wikipedia sentence, ssb-only citations, wikipedia trace step ok:false no output', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => [
    { metric: 'population', kommunenr: '0301', year: 2024, value: 717710 },
  ];
  const searchArticles = async (): Promise<Chunk[]> => {
    throw new Error('Wikipedia unreachable');
  };

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.equal(response.grounded, true);
  assert.equal(
    response.answer,
    'Karl Johans gate 5, 0154 Oslo is in kommune 0301. Population in 2024 was 717710.',
  );
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'ssb');
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[2]?.step, 'search_articles');
  assert.equal(response.trace[2]?.tool, 'wikipedia');
  assert.deepEqual(response.trace[2]?.input, { query: 'Oslo' });
  assert.equal(response.trace[2]?.ok, false);
  assert.equal(response.trace[2]?.output, undefined);
});

test('single match + SSB degraded (empty) + Wikipedia returns chunk: degraded SSB sentence + Wikipedia sentence, grounded:false', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getMunicipalityStats = async (): Promise<StatPoint[]> => [];
  const chunk: Chunk = {
    text: 'Oslo is the capital of Norway.',
    title: 'Oslo',
    url: 'https://en.wikipedia.org/wiki/Oslo',
    score: 0.95,
  };
  const searchArticles = async (): Promise<Chunk[]> => [chunk];

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route: routeAll },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /population/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.match(response.answer, /Oslo is the capital of Norway\./);
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'wikipedia');
  assert.equal(response.citations[1]?.url, 'https://en.wikipedia.org/wiki/Oslo');
  assert.equal(response.citations[1]?.field, 'Oslo');
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.ok, true);
  assert.deepEqual(response.trace[1]?.output, []);
  assert.equal(response.trace[2]?.step, 'search_articles');
  assert.equal(response.trace[2]?.tool, 'wikipedia');
  assert.deepEqual(response.trace[2]?.input, { query: 'Oslo' });
  assert.equal(response.trace[2]?.ok, true);
  assert.deepEqual(response.trace[2]?.output, [chunk]);
});

test('route picks search_articles with a focused query distinct from kommunenavn', async () => {
  const resolveAddress = async () => [sampleMatch];
  const chunk: Chunk = {
    text: 'Grünerløkka is a borough of Oslo known for its café culture.',
    title: 'Grünerløkka',
    url: 'https://no.wikipedia.org/wiki/Gr%C3%BCnerl%C3%B8kka',
    score: 0.9,
  };
  const searchCalls: string[] = [];
  const searchArticles = async (q: string): Promise<Chunk[]> => {
    searchCalls.push(q);
    return [chunk];
  };
  const route: Route = async () => ({
    steps: [{ tool: 'search_articles', query: 'Grünerløkka' }],
  });

  const response = await handleQuery(
    { query: 'tell me about Grünerløkka', address: 'Markveien 1, Oslo' },
    { resolveAddress, getMunicipalityStats: neverCalledStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route },
  );

  assert.deepEqual(searchCalls, ['Grünerløkka']);
  assert.match(response.answer, /Grünerløkka is a borough of Oslo/);
  assert.equal(response.trace[1]?.step, 'search_articles');
  assert.deepEqual(response.trace[1]?.input, { query: 'Grünerløkka' });
  assert.equal(response.citations[1]?.source, 'wikipedia');
  assert.equal(response.citations[1]?.field, 'Grünerløkka');
});

test('route is empty: neither tool called, kartverket-only locator answer, grounded:true', async () => {
  const resolveAddress = async () => [sampleMatch];
  const route: Route = async () => ({ steps: [] });

  const response = await handleQuery(
    { query: "what's the matrikkel?", address: 'Karl Johans gate 5, Oslo' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather: neverCalledWeather,
      searchPapers: neverCalledPapers,
      route,
    },
  );

  assert.equal(response.grounded, true);
  assert.equal(response.answer, 'Karl Johans gate 5, 0154 Oslo is in kommune 0301.');
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.step, 'resolve_address');
});

test('route returns out_of_scope: no tools called, grounded:false, answer mentions the reason, kartverket citation only', async () => {
  const resolveAddress = async () => [sampleMatch];
  const route: Route = async () => ({
    steps: [],
    outOfScope: { reason: 'building-level history is not in this agent’s sources' },
  });

  const response = await handleQuery(
    { query: 'When was this building built?', address: 'Karl Johans gate 5, Oslo' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather: neverCalledWeather,
      searchPapers: neverCalledPapers,
      route,
    },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /building-level history is not in this agent’s sources/);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 1);
  assert.equal(response.trace[0]?.step, 'resolve_address');
});

test('route omits get_municipality_stats: getMunicipalityStats not called, no ssb citation or trace step', async () => {
  const resolveAddress = async () => [sampleMatch];
  const chunk: Chunk = {
    text: 'Oslo is the capital and most populous city of Norway.',
    title: 'Oslo',
    url: 'https://en.wikipedia.org/wiki/Oslo',
    score: 0.95,
  };
  const searchCalls: string[] = [];
  const searchArticles = async (q: string): Promise<Chunk[]> => {
    searchCalls.push(q);
    return [chunk];
  };
  const route: Route = async () => ({
    steps: [{ tool: 'search_articles', query: 'Oslo' }],
  });

  const response = await handleQuery(
    { query: "what's the area like?", address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats: neverCalledStats, searchArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route },
  );

  assert.deepEqual(searchCalls, ['Oslo']);
  assert.equal(response.grounded, true);
  assert.equal(
    response.answer,
    'Karl Johans gate 5, 0154 Oslo is in kommune 0301. About Oslo: Oslo is the capital and most populous city of Norway.',
  );
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'wikipedia');
  assert.equal(response.citations[1]?.url, 'https://en.wikipedia.org/wiki/Oslo');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[0]?.step, 'resolve_address');
  assert.equal(response.trace[1]?.step, 'search_articles');
  assert.equal(response.trace[1]?.tool, 'wikipedia');
  assert.deepEqual(response.trace[1]?.input, { query: 'Oslo' });
});

test('route picks get_weather: getWeather called with match lat/lon, met citation, weather sentence, grounded:true', async () => {
  const resolveAddress = async () => [sampleMatch];
  const forecast: Forecast = {
    lat: 59.911491,
    lon: 10.741234,
    updatedAt: '2026-05-28T07:28:48Z',
    time: '2026-05-28T08:00:00Z',
    temperatureCelsius: 13.4,
    symbolCode: 'clearsky_day',
    precipitationMmNext6h: 0,
  };
  const calls: Array<{ lat: number; lon: number }> = [];
  const getWeather = async (lat: number, lon: number) => {
    calls.push({ lat, lon });
    return forecast;
  };
  const route: Route = async () => ({ steps: [{ tool: 'get_weather' }] });

  const response = await handleQuery(
    { query: "what's the weather like?", address: 'Karl Johans gate 5, Oslo' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather,
      searchPapers: neverCalledPapers,
      route,
    },
  );

  assert.deepEqual(calls, [{ lat: 59.911491, lon: 10.741234 }]);
  assert.equal(response.grounded, true);
  assert.match(response.answer, /13\.4°C/);
  assert.match(response.answer, /clearsky_day/);
  assert.match(response.answer, /0 mm/);
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'met');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[1]?.step, 'get_weather');
  assert.equal(response.trace[1]?.tool, 'met');
  assert.deepEqual(response.trace[1]?.input, { lat: 59.911491, lon: 10.741234 });
  assert.equal(response.trace[1]?.ok, true);
  assert.deepEqual(response.trace[1]?.output, forecast);
});

test('route picks get_weather but MET throws: degraded sentence, no met citation, grounded:false, trace ok:false', async () => {
  const resolveAddress = async () => [sampleMatch];
  const getWeather = async (): Promise<Forecast> => {
    throw new Error('MET unreachable');
  };
  const route: Route = async () => ({ steps: [{ tool: 'get_weather' }] });

  const response = await handleQuery(
    { query: 'q', address: 'Karl Johans gate 5, Oslo' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather,
      searchPapers: neverCalledPapers,
      route,
    },
  );

  assert.equal(response.grounded, false);
  assert.match(response.answer, /weather/i);
  assert.match(response.answer, /not available|wasn't available|unavailable/i);
  assert.equal(response.citations.length, 1);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[1]?.step, 'get_weather');
  assert.equal(response.trace[1]?.tool, 'met');
  assert.equal(response.trace[1]?.ok, false);
});

test('route picks search_papers: searchPapers called, arxiv citation, research sentence using top chunk', async () => {
  const resolveAddress = async () => [sampleMatch];
  const chunk: Chunk = {
    text: 'We analyse housing-price dynamics in Oslo.',
    title: 'Oslo Housing Dynamics',
    url: 'http://arxiv.org/abs/2104.01234v1',
    score: 1,
  };
  const calls: string[] = [];
  const searchPapers = async (q: string): Promise<Chunk[]> => {
    calls.push(q);
    return [chunk];
  };
  const route: Route = async () => ({
    steps: [{ tool: 'search_papers', query: 'Oslo housing' }],
  });

  const response = await handleQuery(
    { query: 'any research about Oslo housing?', address: 'Karl Johans gate 5, Oslo' },
    {
      resolveAddress,
      getMunicipalityStats: neverCalledStats,
      searchArticles: neverCalledArticles,
      getWeather: neverCalledWeather,
      searchPapers,
      route,
    },
  );

  assert.deepEqual(calls, ['Oslo housing']);
  assert.equal(response.grounded, true);
  assert.match(response.answer, /Oslo Housing Dynamics/);
  assert.match(response.answer, /housing-price dynamics in Oslo/);
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'arxiv');
  assert.equal(response.citations[1]?.url, 'http://arxiv.org/abs/2104.01234v1');
  assert.equal(response.citations[1]?.field, 'Oslo Housing Dynamics');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[1]?.step, 'search_papers');
  assert.equal(response.trace[1]?.tool, 'arxiv');
  assert.deepEqual(response.trace[1]?.input, { query: 'Oslo housing' });
  assert.equal(response.trace[1]?.ok, true);
  assert.deepEqual(response.trace[1]?.output, [chunk]);
});

test('route omits search_articles: searchArticles not called, no wikipedia citation or trace step', async () => {
  const resolveAddress = async () => [sampleMatch];
  const statPoint: StatPoint = {
    metric: 'population',
    kommunenr: '0301',
    year: 2024,
    value: 717710,
  };
  const getMunicipalityStats = async () => [statPoint];
  const route: Route = async () => ({
    steps: [{ tool: 'get_municipality_stats', metric: 'population' }],
  });

  const response = await handleQuery(
    { query: 'how many people live there?', address: 'Karl Johans gate 5, Oslo' },
    { resolveAddress, getMunicipalityStats, searchArticles: neverCalledArticles, getWeather: neverCalledWeather, searchPapers: neverCalledPapers, route },
  );

  assert.equal(response.grounded, true);
  assert.equal(
    response.answer,
    'Karl Johans gate 5, 0154 Oslo is in kommune 0301. Population in 2024 was 717710.',
  );
  assert.equal(response.citations.length, 2);
  assert.equal(response.citations[0]?.source, 'kartverket');
  assert.equal(response.citations[1]?.source, 'ssb');
  assert.equal(response.trace.length, 2);
  assert.equal(response.trace[0]?.step, 'resolve_address');
  assert.equal(response.trace[1]?.step, 'get_municipality_stats');
  assert.equal(response.trace[1]?.tool, 'ssb');
});
