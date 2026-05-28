import { z } from 'zod';
import type { Forecast } from '../domain/forecast.ts';

// MET Norway locationforecast/2.0/compact — public, no auth, but requires a
// User-Agent that identifies the app and a contact (URL or email). Without
// that header MET returns 403. See https://api.met.no/doc/TermsOfService.
export const MET_LOCATIONFORECAST_URL =
  'https://api.met.no/weatherapi/locationforecast/2.0/compact';

const MET_USER_AGENT = 'property-agent-demo (https://example.invalid)';

// MET returns 90+ hourly entries, but only the first ~50 carry the
// `next_6_hours` block; later entries drop it. The adapter only consumes the
// first entry, so we validate the outer envelope leniently and validate the
// first entry strictly via MetFirstEntry below.
const MetCompactResponse = z.object({
  properties: z.object({
    meta: z.object({
      updated_at: z.string(),
    }),
    timeseries: z.array(z.unknown()).min(1),
  }),
});

const MetFirstEntry = z.object({
  time: z.string(),
  data: z.object({
    instant: z.object({
      details: z.object({ air_temperature: z.number() }),
    }),
    next_6_hours: z.object({
      summary: z.object({ symbol_code: z.string() }),
      details: z.object({ precipitation_amount: z.number() }),
    }),
  }),
});

export type MetCacheEntry = {
  forecast: Forecast;
  lastModified: string;
  expires: number;
};
export type MetCache = Map<string, MetCacheEntry>;
export const createMetCache = (): MetCache => new Map();

export async function getWeather(
  lat: number,
  lon: number,
  deps: { fetch: typeof fetch; cache: MetCache; now?: () => number },
): Promise<Forecast> {
  const now = deps.now ?? Date.now;
  const key = `${lat},${lon}`;
  const cached = deps.cache.get(key);
  if (cached !== undefined && now() < cached.expires) {
    return cached.forecast;
  }

  const url = new URL(MET_LOCATIONFORECAST_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));

  const headers: Record<string, string> = { 'user-agent': MET_USER_AGENT };
  if (cached !== undefined) {
    headers['if-modified-since'] = cached.lastModified;
  }
  const res = await deps.fetch(url, { headers });

  if (res.status === 304 && cached !== undefined) {
    const expiresHeader = res.headers.get('expires');
    if (expiresHeader !== null) {
      deps.cache.set(key, { ...cached, expires: Date.parse(expiresHeader) });
    }
    return cached.forecast;
  }

  if (!res.ok) {
    throw new Error(`met responded ${res.status} ${res.statusText}`);
  }
  const body = MetCompactResponse.parse(await res.json());
  const entry = MetFirstEntry.parse(body.properties.timeseries[0]);

  const forecast: Forecast = {
    lat,
    lon,
    updatedAt: body.properties.meta.updated_at,
    time: entry.time,
    temperatureCelsius: entry.data.instant.details.air_temperature,
    symbolCode: entry.data.next_6_hours.summary.symbol_code,
    precipitationMmNext6h: entry.data.next_6_hours.details.precipitation_amount,
  };

  const lastModified = res.headers.get('last-modified');
  const expiresHeader = res.headers.get('expires');
  if (lastModified !== null && expiresHeader !== null) {
    deps.cache.set(key, {
      forecast,
      lastModified,
      expires: Date.parse(expiresHeader),
    });
  }

  return forecast;
}
