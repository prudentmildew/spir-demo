import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWeather, MET_LOCATIONFORECAST_URL } from '../src/tools/met.ts';

const fakeJsonFetch = (body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
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

  const forecast = await getWeather(59.9114, 10.7412, { fetch: fetchFn });

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
      headers: { 'content-type': 'application/json' },
    });
  };

  await getWeather(59.9114, 10.7412, { fetch: fetchFn });

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
  const forecast = await getWeather(59.9, 10.7, { fetch: fakeJsonFetch(tailDropsNext6h) });
  assert.equal(forecast.temperatureCelsius, 13.4);
  assert.equal(forecast.symbolCode, 'clearsky_day');
});

test('adapter sends polite user-agent with contact info (MET 403s without one)', async () => {
  const calls: Array<{ init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (_input, init) => {
    calls.push({ init });
    return new Response(JSON.stringify(metCompactBody), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  await getWeather(59.9114, 10.7412, { fetch: fetchFn });

  const headers = new Headers(calls[0]!.init?.headers);
  const ua = headers.get('user-agent');
  assert.ok(ua, 'must send a user-agent header');
  assert.ok(/property-agent-demo/.test(ua!), `user-agent should identify the app, got: ${ua}`);
  assert.ok(/https?:\/\/|@/.test(ua!), `user-agent should include contact info, got: ${ua}`);
});
