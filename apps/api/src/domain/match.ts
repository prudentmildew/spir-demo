import { z } from 'zod';

export const Matrikkel = z.object({
  knr: z.string(),
  gnr: z.number().int(),
  bnr: z.number().int(),
  snr: z.number().int().optional(),
});

export const Match = z.object({
  address: z.string(),
  matrikkel: Matrikkel,
  kommunenr: z.string(),
  kommunenavn: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export type Match = z.infer<typeof Match>;
export type Matrikkel = z.infer<typeof Matrikkel>;
