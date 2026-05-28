# Property-Info Agent — Demo Scaffold

A starting point for a learning/demo agent, consumable through a simple REST API. Written to be developed further in Claude Code. Technology choices are deliberately deferred; the few signatures below fix the *shape*, not the stack.

This document is also meant to be read *by the agent* — it is the PRD + decision record + domain dictionary in one. Keep it in the repo and feed it as context.

---

## 1. Purpose & scope

Build the smallest agent that can answer questions about a Norwegian property and its surroundings by routing between **structured lookups** (query directly) and **unstructured retrieval** (RAG + citation), and expose it behind one REST endpoint.

In scope: entity resolution, multi-source routing, grounded answers with citations, an evals harness.

Out of scope (for now): authentication, write operations, anything irreversible, a UI. This is a read-only demo over open data.

Mirrors the real Infoland case without touching real registers — same patterns (entity-first lookup, structured-vs-document split, citation, freshness), safe data.

---

## 2. The reference task

One query that exercises every part of the system:

> *"Tell me about the property at \<address\> and the area around it."*

Expected flow: resolve the address to an entity → pull area statistics → fetch contextual text with citations → optionally add live data (weather) → return a grounded answer with sources and a trace.

If the demo answers this end-to-end with citations and degrades gracefully on a bad address, it has covered the learning goals.

---

## 3. Architecture sketch

A deterministic shell around a probabilistic core. The loop, the validation, and the "answer only from sources" rule are deterministic; the model's routing and synthesis are the only probabilistic parts.

```
            ┌─────────────────────────────────────────────┐
   REST  →  │  API layer        (validate input, shape out)│
            ├─────────────────────────────────────────────┤
            │  Orchestrator     (the loop: resolve → route │
            │                    → ground → answer)         │
            ├──────────────┬───────────────┬──────────────┤
            │  Tools       │  Retrievers   │  Grounding    │
            │  (structured)│  (RAG + cite) │  (citation +  │
            │              │               │   schema      │
            │  Kartverket  │  Wikipedia    │   validation) │
            │  SSB         │  arXiv        │               │
            │  MET         │               │               │
            └──────────────┴───────────────┴──────────────┘
                          │
                    Evals harness (offline, scores the loop)
```

The split between **tools** and **retrievers** is the core teaching point: structured sources are *queried*, unstructured sources are *retrieved and cited*. The orchestrator decides which to reach for — that decision is the agent's main job.

---

## 4. REST contract

One endpoint for the demo. Keep it boring.

```
POST /query
  Request:  { "query": string, "address"?: string }
  Response: {
    "answer":    string,
    "citations": [ { "source": string, "url": string, "field"?: string } ],
    "trace":     [ { "step": string, "tool": string, "input": object, "ok": boolean } ],
    "grounded":  boolean
  }

GET /health → { "status": "ok" }
```

`grounded: false` means the agent could not back its answer with a source and should say so rather than guess. `trace` exists so you can do RCA on a non-deterministic failure — it is not optional, it is the point.

---

## 5. Source adapters

Each source is wrapped behind a narrow, typed interface so the orchestrator never talks to a raw API. Swap implementations freely; keep the signatures.

**Tools (structured — return data, queried directly):**

```
resolve_address(query: string)      -> Match[]      // Kartverket
  Match = { address, matrikkel{ knr,gnr,bnr,snr? }, kommunenr, lat, lon }

get_municipality_stats(kommunenr, metric) -> StatPoint[]   // SSB
get_weather(lat, lon)               -> Forecast            // MET (set User-Agent!)
```

**Retrievers (unstructured — return citable chunks):**

```
search_articles(query: string)      -> Chunk[]     // Wikipedia (no.wikipedia)
search_papers(query: string)        -> Chunk[]     // arXiv
  Chunk = { text, title, url, score }
```

Adapter notes worth encoding as you build:
- Kartverket and SSB are open, no registration. MET needs a `User-Agent` with contact info or it returns 403, and rewards `If-Modified-Since` caching.
- For the demo, retrievers can skip a vector store entirely — call the source's own search, chunk the top results, and cite. Add embeddings only when keyword search visibly fails the evals. Don't build the index before you need it.

---

## 6. Domain dictionary (ubiquitous language)

One meaning per term, shared by code, the API, and the agent's prompts. Extend as you go.

- **matrikkel** — the property's national key: `knr` (kommune), `gnr` (gård), `bnr` (bruk), `snr` (seksjon, optional). The thing everything is keyed on.
- **kommunenr** — 4-digit municipality code; the join key between address and statistics.
- **hjemmelshaver** — registered owner. (Not available in this open demo; named so the agent knows the gap.)
- **heftelse / servitutt** — encumbrance / easement. Also out of scope here; authoritative, never inferred in the real system.
- **representasjonspunkt** — the coordinate point representing an address (lat/lon from Kartverket).

The agent should *inherit* these terms, not invent synonyms. Ambiguity here is where multi-source joins break.

---

## 7. Key decisions (starting positions, not locked)

Treat these as draft ADRs — revise with reasons.

1. **Entity resolution runs first, always.** No statistics or retrieval until an address resolves to a single confident match. Ambiguous or zero matches → ask for clarification, don't guess. A wrong match produces a confident answer about the *wrong* property — the most dangerous failure.
2. **Structured = tool, unstructured = retriever.** Never RAG over data that can be queried. Keeps authoritative facts exact and citable.
3. **Every claim carries a citation.** Synthesis may only use retrieved/returned content. No grounding → `grounded: false` and an honest "I couldn't find that."
4. **Freshness over snapshots.** Structured sources fetched live (short TTL cache at most). Only unstructured text is indexed/cached aggressively.
5. **Human-in-the-loop gates: none needed here.** The demo is read-only over open data, so nothing is irreversible. Document *where* the gates would sit in the real Infoland version — anything billable, binding, or authoritative — so the pattern is visible even when unused.

---

## 8. Evals

The harness matters more than the agent. Without it you are guessing.

- **Golden set:** a handful of `(query, expected)` pairs to start. For structured answers you own the truth — the register *is* the answer key — so scoring is near-exact. For retrieval, score whether the right source/entity was found and whether the answer is faithful to it.
- **Two scores, separately:** *retrieval* (did it find the right thing?) and *answer* (is it faithful to what it found?). A good answer from the wrong source still fails.
- **Track regression** as you change prompts or routing. Evals are statistical, not pass/fail — set thresholds, watch the trend.
- Wire the harness to read the same `trace` the API returns, so an eval failure points at the exact step.

---

## 9. Suggested layout

Stack-agnostic; the boundaries matter more than the folder names.

```
/api          REST layer — validation, response shaping
/orchestrator the loop: resolve → route → ground → answer
/tools        structured adapters: kartverket, ssb, met
/retrievers   unstructured: wikipedia, arxiv
/grounding    citation enforcement, output-schema validation
/evals        golden set + runner
/domain       dictionary, shared types
PRD.md        this document
/adr          one file per decision as they harden
```

---

## 10. Build order

Tracer bullet first — thinnest possible slice end-to-end, then widen. Each step ships something that runs.

1. `POST /query` + `resolve_address` only. Return the raw match. Prove the pipe.
2. Add SSB. Produce a grounded answer from one structured source.
3. Add Wikipedia retrieval + citations. Now `grounded` means something.
4. Add the orchestrator's routing decision across sources.
5. Stand up the evals harness against the golden set.
6. Add MET and arXiv once routing and evals hold.

Resist adding a source before the evals can judge it. The cheap step is wiring an API; the expensive step is trusting the answer.

---

## 11. Open questions — decide before going wide

These change the design and shouldn't be guessed:

- **Consumer:** internal tool or external-facing? Drives whether auth/rate-limiting belong in the demo at all.
- **Model provider/model:** left open by design. Pick per the routing/synthesis needs; test the choice against the evals rather than by feel.
- **Retrieval depth:** keyword-search-and-cite for the demo, or a real embedding index? Start with the former; let evals tell you when to upgrade.
- **How far to take HITL:** likely none for a read-only demo — confirm, and note where it would go in the real system.