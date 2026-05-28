import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMetCache,
  getWeather,
  MET_LOCATIONFORECAST_URL,
} from '../src/tools/met.ts';

const metHeaders = {
  'content-type': 'application/json',
  'last-modified': 'Thu, 28 May 2026 09:00:00 GMT',
  expires: 'Thu, 28 May 2026 09:30:00 GMT',
};

const fakeJsonFetch = (body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: metHeaders,
    });

// Minimal compact-locationforecast shape recorded from
// api.met.no/weatherapi/locationforecast/2.0/compact for Oslo (59.9114, 10.7412).
// Two timeseries entries deliberately included so the test can assert the
// adapter takes the first and drops the rest.
const metCompactBody = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [10.7412, 59.9114, 23] },
  properties: {
    meta: {
      updated_at: '2026-05-28T09:00:00Z',
      units: {
        air_temperature: 'celsius',
        precipitation_amount: 'mm',
      },
    },
    timeseries: [
      {
        time: '2026-05-28T10:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 13.4,
              relative_humidity: 62.1,
              wind_speed: 3.2,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'clearsky_day' },
            details: { precipitation_amount: 0 },
          },
          next_6_hours: {
            summary: { symbol_code: 'partlycloudy_day' },
            details: { precipitation_amount: 0.4 },
          },
          next_12_hours: {
            summary: { symbol_code: 'partlycloudy_day' },
          },
        },
      },
      {
        time: '2026-05-28T11:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 14.2,
              relative_humidity: 60.0,
              wind_speed: 3.5,
            },
          },
          next_6_hours: {
            summary: { symbol_code: 'cloudy' },
            details: { precipitation_amount: 1.1 },
          },
        },
      },
    ],
  },
};

test('adapter parses MET locationforecast response into Forecast (first datapoint only)', async () => {
  const fetchFn = fakeJsonFetch(metCompactBody);

  const forecast = await getWeather(59.9114, 10.7412, {
    fetch: fetchFn,
    cache: createMetCache(),
  });

  assert.equal(forecast.lat, 59.9114);
  assert.equal(forecast.lon, 10.7412);
  assert.equal(forecast.updatedAt, '2026-05-28T09:00:00Z');
  assert.equal(forecast.time, '2026-05-28T10:00:00Z');
  assert.equal(forecast.temperatureCelsius, 13.4);
  assert.equal(forecast.symbolCode, 'partlycloudy_day');
  assert.equal(forecast.precipitationMmNext6h, 0.4);
});

test('adapter GETs the MET compact endpoint with lat/lon query params', async () => {
  const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      init,
    });
    return new Response(JSON.stringify(metCompactBody), {
      status: 200,
      headers: metHeaders,
    });
  };

  await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache: createMetCache() });

  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(`${call.url.origin}${call.url.pathname}`, MET_LOCATIONFORECAST_URL);
  assert.equal(call.url.searchParams.get('lat'), '59.9114');
  assert.equal(call.url.searchParams.get('lon'), '10.7412');
});

test('adapter tolerates late timeseries entries that lack next_6_hours (only the first entry is validated strictly)', async () => {
  // Realistic MET response: later entries drop next_6_hours / next_12_hours
  // once the forecast horizon exceeds ~50 hours. The adapter must not reject
  // the whole response over the tail.
  const tailDropsNext6h = {
    properties: {
      meta: { updated_at: '2026-05-28T09:00:00Z' },
      timeseries: [
        {
          time: '2026-05-28T10:00:00Z',
          data: {
            instant: { details: { air_temperature: 13.4 } },
            next_6_hours: {
              summary: { symbol_code: 'clearsky_day' },
              details: { precipitation_amount: 0 },
            },
          },
        },
        {
          time: '2026-06-01T00:00:00Z',
          data: {
            instant: { details: { air_temperature: 9.1 } },
            // intentionally no next_6_hours
          },
        },
      ],
    },
  };
  const forecast = await getWeather(59.9, 10.7, {
    fetch: fakeJsonFetch(tailDropsNext6h),
    cache: createMetCache(),
  });
  assert.equal(forecast.temperatureCelsius, 13.4);
  assert.equal(forecast.symbolCode, 'clearsky_day');
});

test('adapter sends polite user-agent with contact info (MET 403s without one)', async () => {
  const calls: Array<{ init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (_input, init) => {
    calls.push({ init });
    return new Response(JSON.stringify(metCompactBody), {
      status: 200,
      headers: metHeaders,
    });
  };

  await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache: createMetCache() });

  const headers = new Headers(calls[0]!.init?.headers);
  const ua = headers.get('user-agent');
  assert.ok(ua, 'must send a user-agent header');
  assert.ok(/property-agent-demo/.test(ua!), `user-agent should identify the app, got: ${ua}`);
  assert.ok(/https?:\/\/|@/.test(ua!), `user-agent should include contact info, got: ${ua}`);
});

test('within the Expires window, subsequent calls return cached forecast without a second HTTP request', async () => {
  // MET's TOS asks clients to respect Expires before re-requesting, and to use
  // If-Modified-Since to revalidate after that.
  let calls = 0;
  const fetchFn: typeof fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(metCompactBody), {
      status: 200,
      headers: metHeaders,
    });
  };
  const cache = createMetCache();
  let nowMs = Date.parse('2026-05-28T09:00:00Z');
  const now = () => nowMs;

  const first = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  assert.equal(calls, 1, 'first call should fetch');

  // Advance 10 minutes — still inside the 09:30 Expires window.
  nowMs += 10 * 60 * 1000;

  const second = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  assert.equal(calls, 1, 'second call within Expires window should be served from cache');
  assert.deepEqual(second, first);
});

test('past Expires, revalidates with If-Modified-Since; on 304 returns cached forecast', async () => {
  const requests: Array<{ headers: Headers }> = [];
  let callIdx = 0;
  const fetchFn: typeof fetch = async (_input, init) => {
    requests.push({ headers: new Headers(init?.headers) });
    callIdx += 1;
    if (callIdx === 1) {
      return new Response(JSON.stringify(metCompactBody), {
        status: 200,
        headers: metHeaders,
      });
    }
    // Subsequent call: server says not modified, returns 304 with no body.
    return new Response(null, {
      status: 304,
      headers: {
        'last-modified': metHeaders['last-modified'],
        // Push the Expires window forward.
        expires: 'Thu, 28 May 2026 10:30:00 GMT',
      },
    });
  };
  const cache = createMetCache();
  let nowMs = Date.parse('2026-05-28T09:00:00Z');
  const now = () => nowMs;

  const first = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  assert.equal(requests.length, 1);

  // Advance past 09:30 Expires so the next call has to revalidate.
  nowMs = Date.parse('2026-05-28T09:45:00Z');

  const second = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });

  assert.equal(requests.length, 2, 'should revalidate once Expires has passed');
  assert.equal(
    requests[1]!.headers.get('if-modified-since'),
    metHeaders['last-modified'],
    'revalidation must send If-Modified-Since with the cached Last-Modified',
  );
  assert.deepEqual(second, first, 'on 304 the cached forecast is returned unchanged');
});

test('past Expires, revalidates with If-Modified-Since; on 200 replaces the cache with the new body', async () => {
  let callIdx = 0;
  const fetchFn: typeof fetch = async () => {
    callIdx += 1;
    if (callIdx === 1) {
      return new Response(JSON.stringify(metCompactBody), {
        status: 200,
        headers: metHeaders,
      });
    }
    // Server returns a fresh body with newer Last-Modified/Expires.
    const updated = structuredClone(metCompactBody);
    updated.properties.meta.updated_at = '2026-05-28T10:00:00Z';
    updated.properties.timeseries[0]!.data.instant.details.air_temperature = 17.8;
    updated.properties.timeseries[0]!.data.next_6_hours.summary.symbol_code = 'rain';
    updated.properties.timeseries[0]!.data.next_6_hours.details.precipitation_amount = 2.5;
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'last-modified': 'Thu, 28 May 2026 10:00:00 GMT',
        expires: 'Thu, 28 May 2026 10:30:00 GMT',
      },
    });
  };
  const cache = createMetCache();
  let nowMs = Date.parse('2026-05-28T09:00:00Z');
  const now = () => nowMs;

  await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  nowMs = Date.parse('2026-05-28T09:45:00Z');

  const second = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  assert.equal(second.temperatureCelsius, 17.8, 'returns the freshly fetched body');
  assert.equal(second.symbolCode, 'rain');
  assert.equal(second.precipitationMmNext6h, 2.5);

  // And the cache now holds the new entry: a third call within the new Expires
  // window must not hit the network.
  nowMs = Date.parse('2026-05-28T10:15:00Z');
  const third = await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  assert.equal(callIdx, 2, 'third call within the refreshed Expires window should be cached');
  assert.deepEqual(third, second);
});

test('cache is keyed on (lat, lon): different coordinates do not share entries', async () => {
  let calls = 0;
  const fetchFn: typeof fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(metCompactBody), {
      status: 200,
      headers: metHeaders,
    });
  };
  const cache = createMetCache();
  const now = () => Date.parse('2026-05-28T09:00:00Z');

  await getWeather(59.9114, 10.7412, { fetch: fetchFn, cache, now });
  await getWeather(60.3913, 5.3221, { fetch: fetchFn, cache, now });

  assert.equal(calls, 2, 'a second coordinate must trigger its own fetch');
});
