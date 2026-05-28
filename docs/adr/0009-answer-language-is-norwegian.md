# ADR-0009 — Answer text is Norwegian regardless of question language

**Status:** accepted

The composed `answer` string is written in Norwegian (bokmål, neutral-formal register) for every `/query` response, regardless of the language the user asked in. The router's `outOfScope.reason` is generated in Norwegian directly via the router's system prompt — not post-translated.

This sits in deliberate tension with the router being language-agnostic (see CONTEXT.md `router`): the router still accepts any language, but the orchestrator's composed prose always lands in Norwegian. The router's freedom to *interpret* multiple languages is preserved; only the *output* surface is constrained.

**Why not match the question's language?** The audience is a Norwegian proptech team. The demo's distinguishing properties — honest refusal, grounded contract — read more credibly in the audience's working language. Matching the question's language would mean the rail's English items still produce English answers, defeating the change.

**Why not translate arXiv abstracts?** Per [ADR-0003](./0003-every-claim-carries-a-citation.md), every claim must be faithful to its citation. arXiv abstracts are quoted verbatim in English inside a Norwegian frame (`Relevant forskning: «<title>» — <text>`) so the citation remains an exact reproduction of the source. Translating would insert an unverified rendition between source and claim.

**Surface of the change.** Only the `answer` string and `plan.outOfScope.reason`. The `trace`, `plan.steps`, `citations`, and all field names remain technical English — they are part of the API contract consumed by the demo's debug UI, not user-facing prose.

**Reversal cost.** Templates in `apps/api/src/orchestrator/handle-query.ts`, the router system prompt in `apps/api/src/orchestrator/router.ts`, the golden eval set, the `handleQuery` tests, the replay fixture, and `apps/web/src/shared/fixtures.ts` all encode the chosen language. Switching back is mechanical but touches every layer.
