import { generateObject, type LanguageModel } from 'ai';
import { RoutingPlan } from '../domain/routing-plan.ts';
import type { Route } from './handle-query.ts';

const SYSTEM_PROMPT = `You are the routing decision layer of a Norwegian property-info agent.

Given a user question and a resolved property match, decide which downstream tools to invoke.

Available tools:
- get_municipality_stats(metric='population') — joined on kommunenr. Use when the question is about people, demographics, or how many live in the area.
- search_articles(query) — Wikipedia search returning citable prose. Use when the question is about the character, history, geography, or what the area is like.

Rules:
- Pick the smallest set of steps that can answer the question. Do not fan out unnecessarily.
- If the question only needs the address/matrikkel/kommunenr (purely identity), return no steps.
- For search_articles, choose a focused query — usually the kommunenavn, unless the question mentions a specific neighbourhood, district, or landmark.
- When both tools apply, list get_municipality_stats before search_articles.`;

export function makeRouter(model: LanguageModel): Route {
  return async (query, match) => {
    const { object } = await generateObject({
      model,
      schema: RoutingPlan,
      system: SYSTEM_PROMPT,
      prompt: `User question: ${query}

Resolved property:
- address: ${match.address}
- kommunenavn: ${match.kommunenavn}
- kommunenr: ${match.kommunenr}`,
    });
    return object;
  };
}
