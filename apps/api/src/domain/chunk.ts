import { z } from 'zod';

export const Chunk = z.object({
  text: z.string(),
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

export type Chunk = z.infer<typeof Chunk>;
