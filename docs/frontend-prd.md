# Property-Info Agent — Frontend Demo PRD

A browser UI on top of `POST /query`. Vite + React + TypeScript + Biome, lives in `apps/web/`, talks to `apps/api/` through a Vite dev-proxy. Local-only deploy posture: this is a demo you run on your laptop and show to people.

This document is the PRD plus the design direction for three prototypes. Read it alongside [`property-agent-scaffold.md`](./property-agent-scaffold.md) (the API PRD), [`../CONTEXT.md`](../CONTEXT.md) (domain glossary), and [`adr/`](./adr/) (decision records). One new ADR — [`adr/0008-choreographed-reveal-not-streaming.md`](./adr/0008-choreographed-reveal-not-streaming.md) — captures the load-bearing choice this PRD makes about pacing.

---

## 1. Purpose & audience

The frontend exists to make the agent's distinguishing properties — **grounded contract, honest refusal, visible trace** — legible to a *mixed proptech audience* (engineers + product lead + manager) in a short live presentation. Success is the audience walking away convinced that the author understands the problem and would bring value to a proptech team.

The frontend is *not* a chat product. It is an artifact for one demo session at a time, optimised for the moments the agent's design choices land visually:

- The **Match** appearing in the property panel — entity resolution as a first-class object (ADR-0001).
- The **routing plan** rendering before any tool fires — the router's intent surfaced as a UI artifact, distinct from what later executes (CONTEXT.md `routing plan` vs `trace`).
- The **out-of-scope refusal** — the hero moment that says "this agent does not hallucinate ownership."
- The **degraded answer** — the agent answering partially and naming the gap, instead of bluffing.

The audience never reads the README. The UI must teach the design as they use it.

---

## 2. Scope

**In scope (v1):**

- Single page, no router.
- One *property-in-focus* held in frontend state; seeded with `Dronning Mauds gate 10, 0250 Oslo`. Resolves on mount via the existing `POST /query` request (we always send a query; the agent always resolves first).
- A *curated rail* of six property-relative questions plus a small *edge cases* footer that may swap the focused property.
- A *transcript* of turns under the current property, with completed turns auto-collapsed.
- A choreographed *Plan → Run → Answer* reveal on the active turn (see §4).
- Three distinct failure-mode treatments (see §5).
- Three pre-specified visual *registers* prototyped side-by-side; one will be picked (see §8).

**Out of scope (v1):**

- Authentication, accounts, persistence (refresh = empty transcript).
- Real streaming from the API — replaced by choreographed reveal of the single response blob. See ADR-0008.
- Inline citation preview popovers — chips are external links.
- Conversation across property changes — changing the property resets the transcript by design.
- Eval-baseline browser — internal artifact, not for this audience.
- Mobile-first work. Demo screen is desktop; layout should not collapse below ~1024px width in v1.
- Public deploy. Local-only. Adding deploy later is a small CORS + env-var change, deliberately deferred.

---

## 3. Information architecture

Two-column desktop layout, neither column scrolls independently:

```
┌──────────────────────────────────────────────────────────────────┐
│  Property panel                                                  │
│  Dronning Mauds gate 10, 0250 Oslo                               │
│  [kommune: 0301 Oslo] [matrikkel: knr/gnr/bnr] [lat, lon]        │
│  [edit address] [reset transcript]                                │
├──────────────────────────────┬───────────────────────────────────┤
│  Transcript                  │  Curated rail                     │
│  ┌───────────────────────┐   │  1. Population in this kommune    │
│  │ (active turn:         │   │  5. Who owns this property?       │
│  │  Plan → Run → Answer) │   │  2. Weather here right now        │
│  └───────────────────────┘   │  3. Tell me about the area        │
│  ┌───────────────────────┐   │  4. Population + character        │
│  │ (collapsed prior turn)│   │  6. Hva er befolkningen her?      │
│  └───────────────────────┘   │                                   │
│                              │  Edge cases (changes property):    │
│  [ question input          ] │  · Ambiguous · No match           │
└──────────────────────────────┴───────────────────────────────────┘
```

Components:

- **Property panel.** Renders the full `Match` object once resolved: address (primary type), kommune name + `kommunenr` chip (secondary), `matrikkel` and `lat,lon` in mono (tertiary). The presence of all four is the visual proof that ADR-0001's entity-resolution-first model is real. Includes an *edit address* affordance and a *reset transcript* button. Editing the address resets the transcript implicitly.
- **Transcript.** Stack of turns. The active (most recent, in-flight or just-completed) turn is fully expanded with its Plan→Run→Answer cards. Prior turns auto-collapse to a single card: collapsed-answer + citation chips. Clicking a prior turn re-expands its trace.
- **Question input.** A single text field with a Send button. Loading state: a slim progress strip across the input bar. Disabled while a turn is in flight.
- **Curated rail.** Six items in the order specified in §6. Clicking an item fills the question field — does *not* auto-submit (visitor presses Send themselves; the moment of agency matters).
- **Edge-cases footer.** Two text links under the rail. Each carries its own address and question, and clicking *does* change the property (with a one-line "Switching property to *X*" confirmation that auto-confirms after ~600ms to keep the demo flowing).

---

## 4. The Plan → Run → Answer reveal

The single most important design element. The visitor *watches* the agent decide and act. This is the demo's narrative engine.

Mechanics: a single `POST /query` round-trip returns `{answer, citations, trace, grounded, plan?}` as one JSON blob. The frontend receives the full response, then reveals it in three acts with controlled pacing:

1. **Plan card** lands. Renders the `RoutingPlan.steps[]` as a row of small cards labelled with the tool (`get_municipality_stats`, `search_articles`, `get_weather`, `search_papers`). The router's `outOfScope.reason`, if present, replaces the step row with the hero refusal card (see §5.B).
2. **Run cards** land one at a time, 300ms apart. Each plan-step card transitions into its trace counterpart: the tool name, the relevant input (mono-rendered), and an outcome state (`✓`, `✕`, or `partial`). On `ok: false`, the card switches to the degraded state (§5.C). The kartverket `resolve_address` step is implicit and rendered once in the property panel, not repeated in every turn.
3. **Answer card** lands. The composed `answer` string with citation chips inline at the end, plus two badges: `grounded: true | false` and `total: N ms` (the real round-trip wall time we measured client-side).

Pacing tuning: 300ms inter-step is a starting value, to be locked during prototyping. Pacing must be respected even on cached responses — the visitor's eyes need time on each card.

Rationale for choreography over streaming: see [`adr/0008-choreographed-reveal-not-streaming.md`](./adr/0008-choreographed-reveal-not-streaming.md). Briefly: the answer text is composed only after all tools finish (`handle-query.ts:201-232`), so streaming buys the plan + per-step trace, not the answer. Pacing under our control is more important than wall-time honesty for a demo. We never display per-step timings, because the trace schema does not carry them and faking them would undermine the honesty story we are selling.

---

## 5. Three failure-mode treatments

The orchestrator emits five failure flavours (handle-query.ts:43, 54, 87, 212, 227). They collapse into three UI categories:

### A — Address didn't resolve cleanly

`Match[]` is empty or length > 1. The turn never enters the transcript. The property panel renders an inline state under the address: `No match — refine and try again`, or `Matched 3 candidates — pick one` with a small disambiguation list. The visitor fixes the address; *then* the question runs.

This is the **A** treatment because address-resolution failures aren't agent decisions — they're a precondition. Putting them anywhere else would conflate "your address is wrong" with "the agent couldn't answer."

### B — Out-of-scope refusal (the hero moment)

`plan.outOfScope.reason` is present. The Plan card collapses into a single **Refusal card** instead of a row of tool steps. Visual treatment: calm and confident, not alarmed — pale background, no warning iconography, a single short line ("I can't answer this from any of the sources I can access") and then the verbatim `reason` rendered as a quote. Below it a small footnote, *Sources I would need: not part of this demo's open data.*

The Answer card below renders the orchestrator's framed sentence (`${address} is in kommune ${knr}, but ${reason}.`) with the `grounded: false` badge and a *no citations beyond Kartverket* state.

This card is the single most polished element in the UI. It's the moment the manager remembers.

### C — Source-degraded answer

A tool step has `ok: false`, but the orchestrator still composed an answer from what did succeed (e.g., SSB unavailable but MET answered). The Run card for the failed step renders in an *amber/dimmed* state — explicitly *not* red — with the label `unavailable`. The Answer card composes normally with the orchestrator's gap-naming sentence ("population data wasn't available"), shows `grounded: false`, and gets a small badge: `partial — N of M sources answered`.

The distinction between B and C is load-bearing for the engineer audience: refused-by-design vs. tried-and-failed. A single "ungrounded" treatment would conflate them; the demo would be weaker for it.

---

## 6. Curated rail content

Six items, all phrased relative to the focused property. Clicking fills the question field; Send is manual.

Order (read top-to-bottom on the rail):

1. **What's the population of this kommune?** — stats-only path (SSB → grounded:true). Reliable opener.
2. **Who owns this property?** — out-of-scope refusal. The hero failure moment, placed second so visitors meet it early.
3. **What's the weather here right now?** — weather-only path (MET → grounded:true). Geo-anchored lookup; lets the lat/lon in the property panel earn its place.
4. **Tell me about the neighbourhood.** — story-only path (Wikipedia → grounded:true). Demonstrates retriever vs tool split.
5. **Population and what the area is known for.** — both-sources path (SSB + Wikipedia). The trace shows two parallel tool calls; the answer integrates them.
6. **Hva er befolkningen her?** — Norwegian-language stats. Implicitly demonstrates the router doesn't care about query language.

Edge-cases footer (below the rail, smaller text):

- **Ambiguous address** — switches property to "Storgata, Norway", asks "what's the population here?". Lets the visitor see the disambiguation state in the property panel.
- **No match** — switches property to a deliberately bogus address, asks any rail question. Shows the no-match property-panel state.

The rail data lives in `apps/web/src/curated-rail.ts` as a typed constant. Each entry: `{label, question, property?}`. No backend involvement.

---

## 7. Tech wiring

- **Workspace.** New `apps/web/` package, added to `pnpm-workspace.yaml`. Reuses root `biome.json` and `tsconfig.base.json`. Stack: `vite`, `react`, `react-dom`, `typescript`. No router, no state library — `useState`/`useReducer` plus a single context for the focused property is enough.
- **Dev wiring.** `apps/web/vite.config.ts` proxies `/query` and `/health` to `http://localhost:3000`. Frontend code uses relative URLs; no CORS configuration on the API; no `VITE_API_BASE` env var.
- **One-command dev.** Root `package.json` `dev` script changes from `pnpm --filter api dev` to running both API and web concurrently. The simplest sufficient mechanism — likely a single `concurrently` invocation or two parallel `&` shells — to be decided when wiring lands. One command, one demo.
- **Deploy posture.** Local-only. No prod build is required for v1. `pnpm --filter web build` should still work (Vite default), but is not part of any pipeline. Upgrade path to public deploy: add a CORS header on `/query`, introduce `VITE_API_BASE`, ship the static build anywhere. Deliberately deferred — see §2 *out of scope*.
- **Types.** The frontend reuses the response shape via a local `import type { QueryResponse } from '../../api/src/domain/query.ts'` or equivalent re-export. The schema is small and stable; duplicating it would be the wrong shortcut.

---

## 8. Design direction — three aesthetic registers

The three prototypes hold *structure* constant (everything in §3–§7 is the same in all three) and vary the *aesthetic register*. Each register is pre-specified below so the prototypes are commensurable. Each prototype must conform to its register; the choice is between known idioms, not free invention.

### Register A — *Cartographic / public-sector utility*

**Evocation:** Kartverket's internal tools, the SSB statistikkbanken interface, a well-built municipal portal. Norwegian state-data sensibility.

**Audience pull:** PM, domain reviewer. Signals "I understand Norwegian public-data infrastructure."

**Typography.** Inter (or system-ui) for everything. Mono (JetBrains Mono / IBM Plex Mono) for `matrikkel`, `kommunenr`, `lat,lon`, tool inputs. No serifs. Small label-uppercase chrome.

**Palette.** Restrained — off-white background `#F7F7F4`, ink-grey body `#1F2933`, accent muted-blue `#2A5D8F`. Grounded badge in a calm green `#3A6B45`; refusal in slate `#475569`; degraded in muted-ochre `#A87B2A`. No saturated reds.

**Density.** Standard-dense. Generous label-to-value pairs; small caps for labels. Step cards are tight, ~28px tall.

**Distinctive choices.** Map-key visual idiom: a numbered legend in the corner of each Plan/Run/Answer act. Matrikkel rendered as `0301-208-456-12` in mono with the legend `kommune-gnr-bnr-snr` beneath in 10px uppercase.

**Sample component (refusal card):**

```
┌─ act 1 · plan ────────────────────────────────────┐
│  ROUTING                                           │
│  ─ out of scope                                    │
│                                                    │
│  Ownership data is not in this demo's sources.    │
│                                                    │
│  REQUIRED SOURCE   not available                   │
│  hjemmelshaver registry · matrikkelregisteret      │
└────────────────────────────────────────────────────┘
```

### Register B — *Editorial / publication*

**Evocation:** New York Times Upshot, FT data explainers, a Stripe Press essay. Generous, considered, quietly confident.

**Audience pull:** the manager. Signals "this is a credible artifact, not a hackathon project."

**Typography.** Serif for the answer prose (Source Serif Pro, or system serif). Sans (Inter / system-ui) for UI chrome, labels, badges. Mono for technical fields only. The serif/sans split is the load-bearing aesthetic choice — it makes the answer feel *written*, not *generated*.

**Palette.** Warm paper background `#FBF8F1`, deep-ink body `#15161A`, accent quiet teal `#1E5B5A`. Citations rendered as superscript footnote chips (`¹`, `²`, `³`) with hover-tooltips showing the source name. Grounded badge as a small text annotation, not a coloured pill. Refusal as a pulled blockquote.

**Density.** Airy. Generous line height (1.6 for answer text). Step cards are spacious, ~44px tall, with whitespace between them.

**Distinctive choices.** The answer card *reads* like a paragraph from an article, with footnote markers. The "show your work" trace below is in a smaller sans, visually demoted as endnotes. The whole UI tries to look like a piece of considered prose, not an interface.

**Sample component (refusal card):**

```
        ─────────────────────────────────────
        I can't answer this from the sources
        I have access to.

        "Ownership records are held in the
        matrikkelregister, which this demo
        does not read."

                              — agent refusal
        ─────────────────────────────────────
```

### Register C — *Developer-tool / observability*

**Evocation:** Linear, Vercel, Stripe dashboards, the Anthropic console. Dark mode default, dense data, hover-rich.

**Audience pull:** the engineers. Signals "I know my way around developer tooling and observability."

**Typography.** Inter for chrome. JetBrains Mono for *everything* trace-related: tool names, inputs, outputs, citation URLs. The answer prose stays in Inter. Tight tracking, slightly condensed.

**Palette.** Near-black background `#0A0A0B`, off-white body `#E8E8EA`, accent electric-blue `#6BA4FF`. Status pills: green `#3DD68C` for ok, amber `#E0A23A` for degraded, slate `#7B8290` for refused. Grounded badge as a small mono pill in the answer card's top-right corner.

**Density.** Dense. Step cards stacked tight with hairline dividers. Hover-reveal of step `input`/`output` JSON. A subtle ⌘K command palette in the top-right that opens the curated rail as a searchable list — a small flex that costs little.

**Distinctive choices.** Step cards render as terminal-style log lines with timestamps (relative to turn start, e.g. `+0.4s`) — but only when the wall-clock would actually carry meaning, which for v1 is never. So timestamps are absent in v1 even in this register, replaced by the act number. The trace input/output blobs are syntax-highlighted JSON, collapsed by default with a `{...}` affordance.

**Sample component (refusal card):**

```
┌── plan ──────────────────────────────────────── refused ──┐
│ router.out_of_scope                                        │
│ reason: "ownership data not in this demo's open sources"   │
│ would_need: ["hjemmelshaver"]                              │
│                                                            │
│   grounded: false   citations: 1   total: 412ms            │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Prototype plan

For each of the three registers above:

1. A standalone Vite + React route or branch implementing the full Plan→Run→Answer experience for *one* canonical scenario each — but the canonical scenario is the same across all three: the visitor lands, the property is pre-resolved, they click the **Who owns this property?** rail item, see the refusal, and click **What's the population?**, see the grounded answer.
2. No real API in the prototype — each prototype ships with a single recorded `QueryResponse` JSON for each of the two scenarios. The prototype is the *render* problem; the API integration is the same in all three and not what we're choosing between.
3. A `register.md` file inside each prototype directory that quotes the relevant section of §8 verbatim. The prototype must conform.

We then look at the three side-by-side and pick. The winner becomes the basis for v1 wiring (§7). The other two are deleted.

---

## 10. Open questions

Deliberately a short list — most decisions are made.

1. **Pacing precise value.** §4 says 300ms inter-step; the actual value is set during prototyping when we can feel it.
2. **`pnpm dev` concurrency mechanism.** `concurrently`? Two parallel processes? Decide when wiring (§7).
3. **Edit-address UX in the property panel.** Inline-edit or a small modal? Decide during prototyping — it's a small enough surface that the register can answer it.

---

## 11. What this PRD does *not* try to settle

- Component library choice. Each register's prototype can use whatever (Radix primitives, hand-rolled, etc.). The decision is downstream of the chosen register.
- Animation library. Likely not needed — CSS transitions cover the act reveals. Revisit if a register requires something richer.
- Accessibility audit beyond basic semantic HTML + focus management. For a presented demo this is sufficient; if we ever deploy publicly, ARIA + reduced-motion + keyboard-only flow get a dedicated pass.
