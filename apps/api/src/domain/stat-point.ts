import { z } from 'zod';

export const Metric = z.literal('population');

export const StatPoint = z.object({
  metric: Metric,
  kommunenr: z.string(),
  year: z.number().int(),
  value: z.number(),
});

export type Metric = z.infer<typeof Metric>;
export type StatPoint = z.infer<typeof StatPoint>;
