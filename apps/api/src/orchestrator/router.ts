import { generateObject, type LanguageModel } from 'ai';
import { RoutingPlan } from '../domain/routing-plan.ts';
import type { Route } from './handle-query.ts';

const SYSTEM_PROMPT = `You are the routing decision layer of a Norwegian property-info agent.

Given a user question and a resolved property match, decide which downstream tools to invoke.

Available tools:
- get_municipality_stats(metric='population') — joined on kommunenr. Use when the question is about people, demographics, or how many live in the area.
- search_articles(query) — Wikipedia (no.wikipedia) search returning citable prose. Use when the question is about the character, history, geography, or what the area is like.
- get_weather — MET locationforecast at the property's coordinates. No arguments (the agent uses the resolved match's lat/lon). Use when the question is about current weather, temperature, or precipitation at the property.
- search_papers(query) — arXiv search returning citable academic abstracts. Use only when the question explicitly asks about research, studies, or academic literature relevant to the area.

Scope of this agent: the address itself (matrikkel, kommunenr), municipality-level demographics, the character/history/geography of the area (kommune, neighbourhood, district), current weather at the property's coordinates, and academic research relevant to the area. Anything more specific than the kommune — e.g. building-level history, year of construction, ownership, price, energy rating, individual incidents — is out of scope and cannot be answered from the available sources.

Rules:
- Pick the smallest set of steps that can answer the question. Do not fan out unnecessarily.
- If the question only needs the address/matrikkel/kommunenr (purely identity), return { steps: [] } with no outOfScope.
- If the question is out of scope (see above), return { steps: [], outOfScope: { reason: "<one-line reason naming what's missing>" } }. Do not invoke any tool just to produce a citation; refusal is the correct answer.
- Write the refusal \`reason\` in Norwegian bokmål. The orchestrator embeds it directly into a Norwegian sentence ("X ligger i kommune Y, men <reason>."), so it must read naturally there — no leading capital, no trailing period, no English. Use the domain vocabulary (matrikkel, kommunenr, hjemmelshaver, heftelse, servitutt) when naming what's missing.
- For search_articles, choose a focused query — usually the kommunenavn, unless the question mentions a specific neighbourhood, district, or landmark.
- For search_papers, prefer search_articles over search_papers for general-character or descriptive questions about the area; only reach for search_papers when the user explicitly asks for research, papers, or studies.
- When multiple tools apply, list them in this order: get_municipality_stats, search_articles, get_weather, search_papers.`;

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
