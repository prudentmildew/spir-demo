# ADR-0011 — Nearby places are in scope; surface several passages

**Status:** accepted

The agent's scope is widened to cover **nearby places, amenities, and points of interest** around the resolved property — shops, grocery stores, schools, parks, public transit, restaurants, landmarks, services — answered through the existing `search_web` retriever. Previously the router refused anything more specific than the kommune; it now routes such questions to `search_web` with a query anchored on the resolved street address or neighbourhood. The structured tools (Kartverket, SSB, MET) are unchanged, and no new source is added.

**The orchestrator now surfaces several passages, not one.** `handleQuery` printed only `chunks[0]`; it now renders up to `WEB_CHUNK_LIMIT` (3) chunks, each as its own `Fra «title»: …` sentence with its own citation. A single top quote read as truncated on richer questions ("which shops are nearby?" wants more than one). This is the part of [ADR-0010](./0010-single-web-search-retriever.md) it revises — that ADR specified the orchestrator "prints `chunks[0]` verbatim"; we now print up to three.

**Grounding is unchanged.** Each surfaced passage is still one verbatim `cited_text` span attributed to its own real URL. Showing three quotes is three grounded claims, not a synthesis across them — the `grounded` invariant from [ADR-0003](./0003-every-claim-carries-a-citation.md) and the `retriever` glossary term in CONTEXT.md both still hold exactly.

**The boundary moves, but does not dissolve.** [ADR-0010](./0010-single-web-search-retriever.md) kept *all* sub-kommune facts out of scope on the theory that "more specific than the kommune" was the honest line. That theory was too coarse: it conflated two different things. Physical *places* near an address are observable, cross-checkable, and legitimately web-grounded. *Register facts about the building itself* — ownership (*hjemmelshaver*), *heftelse*/*servitutt*, purchase price, energy rating, year of construction, building-level history — are authoritative-register data the open web cannot stand in for. The new line runs between **places near the property** (in scope) and **register facts about the property** (out of scope). The router prompt draws exactly this distinction, and the `wrong-tool-trap` golden case ("When was this building built?") still asserts a refusal, so the guardrail stays meaningful.

**This amends [ADR-0010](./0010-single-web-search-retriever.md)'s "Scope stays area-level" clause and its "prints `chunks[0]`" detail.** Everything else in ADR-0010 — the single retriever, grounding by quoting not synthesising, the rejected alternatives — stands.

**Why not the alternatives we considered?**
- *A dedicated places tool (Overpass/OSM, a Places API)* — would return structured, typed POIs and fit the tool/retriever split cleanly. Rejected for now: it adds a source and an adapter for a demo whose point is the routing decision, and the question asked for "nearby places of *any* kind", which a fixed POI schema can't fully cover. Revisit if precision matters more than breadth.
- *Open register facts too (ownership, price, year built)* — rejected: those are the cases the "refuse honestly" story rests on, and a web page is not an authoritative substitute for them. Widening to *places* does not require widening to *property facts*.

**Costs accepted.** More questions now hit the model-backed, non-deterministic `search_web` path; `maxUses` rose 3→5 and answers are longer. The golden evals continue to assert the answer *frame* (`Fra «…»:`) and citation *source* (`web`), never exact content — the new `nearby-places` case follows that rule.

**Reversal cost.** Revert the router prompt's scope paragraph and `search_web` rule, restore the `chunks[0]`-only branch and `WEB_CHUNK_LIMIT` in `handleQuery`, drop the `nearby-places` golden case and the multi-chunk `handleQuery` tests, and lower `maxUses` back to 3.
