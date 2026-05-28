import { z } from 'zod';
import { Metric } from './stat-point.ts';

export const GetMunicipalityStatsStep = z.object({
  tool: z.literal('get_municipality_stats'),
  metric: Metric,
});

export const SearchWebStep = z.object({
  tool: z.literal('search_web'),
  query: z.string().min(1),
});

// MET locationforecast call. No arguments — coordinates come from the resolved
// Match (the agent never asks about a property other than the resolved one).
export const GetWeatherStep = z.object({
  tool: z.literal('get_weather'),
});

export const RoutingStep = z.discriminatedUnion('tool', [
  GetMunicipalityStatsStep,
  SearchWebStep,
  GetWeatherStep,
]);

export const RoutingPlan = z.object({
  steps: z.array(RoutingStep),
  outOfScope: z.object({ reason: z.string().min(1) }).optional(),
});

export type GetMunicipalityStatsStep = z.infer<typeof GetMunicipalityStatsStep>;
export type SearchWebStep = z.infer<typeof SearchWebStep>;
export type GetWeatherStep = z.infer<typeof GetWeatherStep>;
export type RoutingStep = z.infer<typeof RoutingStep>;
export type RoutingPlan = z.infer<typeof RoutingPlan>;
