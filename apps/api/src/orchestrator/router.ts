import { generateObject, type LanguageModel } from 'ai';
import { RoutingPlan } from '../domain/routing-plan.ts';
import type { Route } from './handle-query.ts';

const SYSTEM_PROMPT = `You are the routing decision layer of a Norwegian property-info agent.

Given a user question and a resolved property match, decide which downstream tools to invoke.

Available tools:
- get_municipality_stats(metric='population') — joined on kommunenr. Use when the question is about people, demographics, or how many live in the area.
- search_articles(query) — Wikipedia search returning citable prose. Use when the question is about the character, history, geography, or what the area is like.

Scope of this agent: the address itself (matrikkel, kommunenr), municipality-level demographics, and the character/history/geography of the area (kommune, neighbourhood, district). Anything more specific than the kommune — e.g. building-level history, year of construction, ownership, price, energy rating, individual incidents — is out of scope and cannot be answered from the available sources.

Rules:
- Pick the smallest set of steps that can answer the question. Do not fan out unnecessarily.
- If the question only needs the address/matrikkel/kommunenr (purely identity), return { steps: [] } with no outOfScope.
- If the question is out of scope (see above), return { steps: [], outOfScope: { reason: "<one-line reason naming what's missing>" } }. Do not invoke any tool just to produce a citation; refusal is the correct answer.
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
