# ADR-0010 — Single web-search retriever, grounded on verbatim citations

**Status:** accepted

The Wikipedia and arXiv retrievers are removed and replaced by a single retriever backed by Claude (Sonnet 4.6) with the Anthropic web-search tool (`maxUses: 3`). The structured tools — Kartverket, SSB, MET — are unchanged. The router now exposes one unstructured step, `search_web(query)`, in place of `search_articles` and `search_papers`.

**Grounding is preserved by quoting, not synthesising.** Claude web search natively returns a *synthesised* answer plus bare URL sources — which would be ungrounded prose under our contract (see CONTEXT.md `grounded`). We do not use that synthesis. Instead each Anthropic citation's `cited_text` — a verbatim span the model lifted from one real source — becomes one `Chunk` (`text` = `cited_text`, plus the source `url` and `title`). The orchestrator still prints `chunks[0]` verbatim and cites its real URL, exactly as it did for Wikipedia. The displayed claim therefore remains *identical to* the cited source, never a model rendering of it.

**This amends [ADR-0002](./0002-structured-is-tool-unstructured-is-retriever.md).** That ADR's structured-vs-unstructured split still holds, but its premise — that a retriever wraps a source *without* a query API by fetching it directly — no longer describes the implementation. The remaining retriever is itself an LLM tool-call. The invariant that survives is narrower and now lives in the `retriever` glossary term: a chunk's `text` is a verbatim passage from the cited source.

**Scope stays area-level.** A general web search is broad enough to surface property- and building-specific claims (year built, ownership, price, *heftelse*/*servitutt*, energy rating). Those remain **out of scope** — the open authoritative registers don't cover them, and a low-trust web page is not a substitute. The router prompt instructs `search_web` to refuse rather than reach for such facts, keeping the `wrong-tool-trap` guardrail meaningful.

**Why not the alternatives we considered?**
- *Claude's synthesis with multi-citation* — reads best, but redefines `grounded` from "the text is the source" to "the sources support the text." Rejected: it dissolves the agent's distinguishing property.
- *Claude finds URLs, we fetch + extract* — provably verbatim, but means scraping arbitrary domains. Rejected: fragile and flaky, the opposite of the demo's legibility goal. Wikipedia had a clean API; the open web does not.

**Costs accepted.** A previously fetch-only, deterministic path now carries model cost, multi-second latency, and non-determinism on every area/research question. The golden evals must assert the answer *frame* and citation *source* (`web`), not exact content — as the old `papers-only` case already did for unstable arXiv results.

**Reversal cost.** Rebuilding the deleted Wikipedia and arXiv adapters, restoring the two routing steps and their citation sources, and reverting the router prompt, the orchestrator assembly, the golden set, the `handleQuery` tests, and the replay fixtures.
