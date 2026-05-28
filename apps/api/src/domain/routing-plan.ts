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

// MET locationforecast call. No arguments — coordinates come from the resolved
// Match (the agent never asks about a property other than the resolved one).
export const GetWeatherStep = z.object({
  tool: z.literal('get_weather'),
});

export const SearchPapersStep = z.object({
  tool: z.literal('search_papers'),
  query: z.string().min(1),
});

export const RoutingStep = z.discriminatedUnion('tool', [
  GetMunicipalityStatsStep,
  SearchArticlesStep,
  GetWeatherStep,
  SearchPapersStep,
]);

export const RoutingPlan = z.object({
  steps: z.array(RoutingStep),
  outOfScope: z.object({ reason: z.string().min(1) }).optional(),
});

export type GetMunicipalityStatsStep = z.infer<typeof GetMunicipalityStatsStep>;
export type SearchArticlesStep = z.infer<typeof SearchArticlesStep>;
export type GetWeatherStep = z.infer<typeof GetWeatherStep>;
export type SearchPapersStep = z.infer<typeof SearchPapersStep>;
export type RoutingStep = z.infer<typeof RoutingStep>;
export type RoutingPlan = z.infer<typeof RoutingPlan>;
