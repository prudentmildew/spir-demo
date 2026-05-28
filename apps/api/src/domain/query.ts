import { z } from 'zod';

export const QueryRequest = z.object({
  query: z.string().min(1),
  address: z.string().optional(),
});

export const Citation = z.object({
  source: z.string(),
  url: z.string(),
  field: z.string().optional(),
});

export const TraceStep = z.object({
  step: z.string(),
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
  ok: z.boolean(),
  output: z.unknown().optional(),
});

export const QueryResponse = z.object({
  answer: z.string(),
  citations: z.array(Citation),
  trace: z.array(TraceStep),
  grounded: z.boolean(),
});

export type QueryRequest = z.infer<typeof QueryRequest>;
export type Citation = z.infer<typeof Citation>;
export type TraceStep = z.infer<typeof TraceStep>;
export type QueryResponse = z.infer<typeof QueryResponse>;
