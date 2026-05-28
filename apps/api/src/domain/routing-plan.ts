import { z } from 'zod';
import { Metric } from './stat-point.ts';

export const GetMunicipalityStatsStep = z.object({
  tool: z.literal('get_municipality_stats'),
  metric: Metric,
});

export const SearchArticlesStep = z.object({
  tool: z.literal('search_articles'),
  query: z.string().min(1),
});

export const RoutingStep = z.discriminatedUnion('tool', [
  GetMunicipalityStatsStep,
  SearchArticlesStep,
]);

export const RoutingPlan = z.object({
  steps: z.array(RoutingStep),
});

export type GetMunicipalityStatsStep = z.infer<typeof GetMunicipalityStatsStep>;
export type SearchArticlesStep = z.infer<typeof SearchArticlesStep>;
export type RoutingStep = z.infer<typeof RoutingStep>;
export type RoutingPlan = z.infer<typeof RoutingPlan>;
