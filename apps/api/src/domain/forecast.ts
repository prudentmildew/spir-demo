import { z } from 'zod';

// Compact slice of MET locationforecast/2.0/compact — enough to weave a sentence
// like "Right now at <coords>: 13.4°C, clearsky_day, 0 mm precipitation in the
// next 6 hours." The full timeseries is intentionally dropped at adapter
// boundary; the orchestrator only consumes the first datapoint.
export const Forecast = z.object({
  lat: z.number(),
  lon: z.number(),
  updatedAt: z.string(), // ISO timestamp from properties.meta.updated_at
  time: z.string(), // ISO timestamp of the represented datapoint
  temperatureCelsius: z.number(),
  symbolCode: z.string(), // e.g. "clearsky_day", "partlycloudy_night"
  precipitationMmNext6h: z.number(),
});

export type Forecast = z.infer<typeof Forecast>;
