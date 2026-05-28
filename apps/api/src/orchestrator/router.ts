import { generateObject, type LanguageModel } from 'ai';
import { RoutingPlan } from '../domain/routing-plan.ts';
import type { Route } from './handle-query.ts';

const SYSTEM_PROMPT = `You are the routing decision layer of a Norwegian property-info agent.

Given a user question and a resolved property match, decide which downstream tools to invoke.

Available tools:
- get_municipality_stats(metric='population') — joined on kommunenr. Use when the question is about people, demographics, or how many live in the area.
- search_web(query) — web search returning citable, verbatim-quoted passages from real sources. Use when the question is about the character, history, geography, or what the area is like, OR asks about research/studies relevant to the area.
- get_weather — MET locationforecast at the property's coordinates. No arguments (the agent uses the resolved match's lat/lon). Use when the question is about current weather, temperature, or precipitation at the property.

Scope of this agent: the address itself (matrikkel, kommunenr), municipality-level demographics, the character/history/geography of the area (kommune, neighbourhood, district), current weather at the property's coordinates, and research relevant to the area. Anything more specific than the kommune — e.g. building-level history, year of construction, ownership, price, energy rating, individual incidents — is out of scope and cannot be answered from the available sources.

Rules:
- Pick the smallest set of steps that can answer the question. Do not fan out unnecessarily.
- If the question only needs the address/matrikkel/kommunenr (purely identity), return { steps: [] } with no outOfScope.
- If the question is out of scope (see above), return { steps: [], outOfScope: { reason: "<one-line reason naming what's missing>" } }. Do not invoke any tool just to produce a citation; refusal is the correct answer.
- Write the refusal \`reason\` in Norwegian bokmål. The orchestrator embeds it directly into a Norwegian sentence ("X ligger i kommune Y, men <reason>."), so it must read naturally there — no leading capital, no trailing period, no English. Use the domain vocabulary (matrikkel, kommunenr, hjemmelshaver, heftelse, servitutt) when naming what's missing.
- search_web is for AREA-LEVEL questions (kommune, neighbourhood, district): character, history, geography, and research about the area. It is NOT a way to answer property- or building-specific facts (year built, ownership/hjemmelshaver, price, heftelse/servitutt, energy rating) — those remain out of scope even if a web page appears to mention them, because the open authoritative registers don't cover them. Prefer outOfScope over a low-trust web result for property-specific facts.
- For search_web, choose a focused query — usually the kommunenavn, unless the question mentions a specific neighbourhood, district, or landmark.
- When multiple tools apply, list them in this order: get_municipality_stats, search_web, get_weather.`;

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
