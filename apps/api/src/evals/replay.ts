import type { Chunk } from '../domain/chunk.ts';
import type { Forecast } from '../domain/forecast.ts';
import type { Match } from '../domain/match.ts';
import type { QueryRequest, QueryResponse, TraceStep } from '../domain/query.ts';
import type { RoutingPlan } from '../domain/routing-plan.ts';
import type { StatPoint } from '../domain/stat-point.ts';
import {
  handleQuery,
  type GetMunicipalityStats,
  type GetWeather,
  type ResolveAddress,
  type Route,
  type SearchArticles,
  type SearchPapers,
} from '../orchestrator/handle-query.ts';

export type ReplayDeps = {
  resolveAddress: ResolveAddress;
  getMunicipalityStats: GetMunicipalityStats;
  searchArticles: SearchArticles;
  getWeather: GetWeather;
  searchPapers: SearchPapers;
  route: Route;
};

const findStep = (trace: TraceStep[], step: string): TraceStep | undefined =>
  trace.find((s) => s.step === step);

export function buildReplayDeps(recorded: QueryResponse): ReplayDeps {
  const resolveStep = findStep(recorded.trace, 'resolve_address');
  const resolved = resolveStep?.output;
  // Trace stores a bare Match for the single-match path and an array (possibly
  // empty) for the zero/multi paths. The orchestrator always sees Match[].
  const matches: Match[] = Array.isArray(resolved)
    ? (resolved as Match[])
    : resolved !== undefined
      ? [resolved as Match]
      : [];

  const yieldFromStep = <T>(stepName: string): (() => Promise<T>) => {
    const step = findStep(recorded.trace, stepName);
    return async () => {
      if (step === undefined) {
        throw new Error(`replay: ${stepName} has no recorded step in the trace (orchestrator dispatched a tool that didn't run in the original case)`);
      }
      if (!step.ok) {
        throw new Error(`replay: ${stepName} was ok:false in the recorded trace (replaying recorded failure)`);
      }
      return step.output as T;
    };
  };

  return {
    resolveAddress: async () => matches,
    route: async () => recorded.plan as RoutingPlan,
    getMunicipalityStats: yieldFromStep<StatPoint[]>('get_municipality_stats'),
    searchArticles: yieldFromStep<Chunk[]>('search_articles'),
    getWeather: yieldFromStep<Forecast>('get_weather'),
    searchPapers: yieldFromStep<Chunk[]>('search_papers'),
  };
}

export const replayCase = (
  recorded: QueryResponse,
  request: QueryRequest,
): Promise<QueryResponse> => handleQuery(request, buildReplayDeps(recorded));
