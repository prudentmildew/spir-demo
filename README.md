# Property-Info Agent

A grounded question-answering agent for Norwegian properties, built on open data. Give it an address and a question — "what's the area like?", "what shops are nearby?", "what's the weather?", "how many people live in the municipality?" — and it resolves the address, decides which sources can honestly answer, calls them, and returns an answer where **every claim carries a citation**. When the question asks for a fact only an authoritative register holds (e.g. who owns a property, when the building was built), it refuses honestly rather than guessing.

> A demo / portfolio project. The interesting parts are the architecture: a deterministic, hand-rolled orchestrator with a single probabilistic routing step, a hard line between structured *tools* and unstructured *retrievers*, and a `grounded` contract that's enforced end-to-end.

## How it works

```
address + question
      │
      ▼
  Kartverket ──────────►  resolve to matrikkel + kommunenr + lat/lon   (always runs first)
      │
      ▼
   Router (Claude Haiku 4.5)  ──►  routing plan: which tools/retrievers, or out-of-scope refusal
      │
      ├─► Tools (structured, queried)        Kartverket · SSB · MET
      └─► Retrievers (unstructured, cited)   web search (Claude Sonnet 4.6)
      │
      ▼
  Answer + citations + trace      grounded: true iff every claim traces to a source this turn
```

- **Tools** wrap structured sources and are *queried* for exact fields: **Kartverket** (address → matrikkel, municipality, coordinate), **SSB** (municipal population statistics), **MET** (weather forecast at the resolved point).
- **Retrievers** wrap unstructured sources and are *searched and cited*: a single **web search** retriever that returns verbatim, quoted chunks — never a synthesis. It covers the character/history/geography of the area *and* nearby places and amenities (shops, schools, parks, transit, landmarks); the answer surfaces several quoted chunks, each with its own citation.
- The **router** is the only LLM step in the loop. It turns the resolved match plus the question into an ordered plan, or an honest `outOfScope` refusal.

See `CONTEXT.md` for the domain language and `docs/adr/` for the decisions behind each of these.

## Quick start

Requires **Node ≥ 24** and **pnpm 11**.

```bash
pnpm install

# Anthropic key is needed for the router and the web retriever
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

pnpm dev          # run web + api together
```

- **Web** → http://localhost:5173
- **API** → http://localhost:3000
- **Static Design Prototypes** → http://localhost:5173/#/prototypes 

The public data APIs (Kartverket, SSB, MET) require no auth.

## Entry points

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run web + API in watch mode |
| `pnpm dev:api` / `pnpm dev:web` | Run one app only |
| `pnpm start` | Production API server |
| `pnpm test` | Unit tests (Node's built-in `--test`) across the workspace |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm lint` / `pnpm format` | Biome |

API-only (from `apps/api/`):

| Command | What it does |
| --- | --- |
| `pnpm eval` | Run the golden-case eval suite against live sources, write a JSON report |
| `pnpm replay` | Replay a single case through `handleQuery` with canned dependencies (offline) |

### HTTP API

- `GET /health` — liveness check
- `POST /query` — `{ address, question }` → `{ answer, citations, plan, trace, grounded }`

## Layout

```
apps/
  api/                      HTTP server + orchestrator core
    src/
      index.ts              server entry — GET /health, POST /query
      domain/               shared types (Query, Match, RoutingPlan, Citation, …)
      orchestrator/         handle-query.ts · router.ts · format.ts
      tools/                kartverket.ts · ssb.ts · met.ts
      retrievers/           web.ts
      evals/                run.ts · replay.ts · golden.ts (golden cases)
    test/                   unit tests (node --test)
  web/                      React + Vite frontend
    src/
      app/                  query interface + API client
      prototypes/           7 toggleable UI design explorations
      shared/               types, choreography, fixtures
docs/
  adr/                      10 architecture decision records
  agents/                   agent-skill docs (issue tracker, triage, domain)
CONTEXT.md                  domain glossary (matrikkel, grounded, tool vs retriever, …)
```

## Design notes

A few decisions are load-bearing and documented as ADRs (`docs/adr/`):

- **Entity resolution always runs first** — every question is anchored to a resolved address before routing.
- **Structured is a tool, unstructured is a retriever** — they're invoked, traced, and cited differently, and that line is never blurred.
- **Every claim carries a citation, or `grounded: false`** — the boolean is part of the API contract.
- **Places near a property are in scope; register facts about it are not** — nearby shops, schools, and landmarks are web-grounded and answerable; ownership, price, year built, and *heftelse*/*servitutt* live only in authoritative registers and are refused honestly.
- **No framework** — the orchestrator shell is hand-rolled and deterministic; only the router is probabilistic.
- **Evals are separate from tests** — unit tests cover adapters and orchestration deterministically; evals exercise live routing and answer quality via a CLI, and `replay` reruns a recorded plan with canned outputs.
- **Answers are Norwegian** regardless of the question's language; the **reveal is choreographed**, not streamed.

## Tech stack

TypeScript · Node 24 (ESM) · pnpm workspace · Vercel **AI SDK** (`ai` + `@ai-sdk/anthropic`) · **Claude Haiku 4.5** (router) and **Claude Sonnet 4.6** (web retriever) · Zod · React 19 + Vite · Biome.
