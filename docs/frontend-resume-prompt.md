Continuing the property-info agent frontend prototypes at /Users/erland/Playground/agent-demo.

This is the **frontend** resume prompt. For backend / agent / API context, see `docs/resume-prompt.md` — it is still current and orthogonal. Frontend lives under `apps/web/`; nothing in `apps/api/` has been modified by this workstream.

**Orient before changing anything**
- `docs/frontend-prd.md` — full PRD. §3 information architecture, §4 Plan→Run→Answer reveal, §5 three failure-mode treatments, §6 curated rail content, §7 tech wiring, §8 five aesthetic registers (A/B/C transcript-centric, D/E agent-in-product), §9 prototype plan.
- `docs/adr/0008-choreographed-reveal-not-streaming.md` — the load-bearing pacing decision. The frontend reveals the single `QueryResponse` blob in choreographed acts on the client; no streaming protocol. If you ever feel tempted to switch to true streaming, re-litigate this ADR before doing it.
- `apps/web/src/shared/` — the spine all five prototypes share:
  - `types.ts` — local mirror of the `QueryResponse` schema plus stable-key helpers (`traceStepKey`, `routingStepKey`, `citationKey`).
  - `fixtures.ts` — five canned `QueryResponse`s (`refusal`, `population`, `weather`, `neighborhood`, `both`) modelled on the orchestrator's real output for Dronning Mauds gate 10. Plus per-scenario `FAKE_LATENCY_MS`.
  - `rail.ts` — six curated rail items per PRD §6, every one wired to a scenario.
  - `match.ts` — the seeded Match (Dronning Mauds gate 10, 0250 Oslo) plus `formatMatrikkel` / `formatLatLon`.
  - `choreography.ts` — `useChoreography(totalActs, intervalMs)` hook driving the act reveal.
- `apps/web/src/prototypes/*/register.md` — each register's spec, quoted from PRD §8. The prototype must conform.
- Project memory `project-portfolio-framing.md` — repo is a hiring demo for a proptech company, audience is mixed (devs + PM + manager). Optimise for short-session legibility, not depth.

**Status — five prototypes built, decision pending**
- All five prototypes ship and render cleanly:
  - **`#/a` cartographic** — Kartverket/SSB sensibility. Inter + IBM Plex Mono. Numbered act-key legends, survey-stamp property panel, off-white + muted blue.
  - **`#/b` editorial** — NYT Upshot / FT data. Source Serif 4 prose + Inter chrome + JetBrains Mono technical. Footnote citations, refusal as pulled blockquote.
  - **`#/c` developer-tool** — Linear/Vercel/Anthropic console. Dark mode, JetBrains Mono trace, syntax-highlighted JSON, hover-reveal step output, working ⌘K palette.
  - **`#/d` B2C property landing** — Finn.no/Hemnet/Zillow. Bricolage Grotesque hero + Karla body. Warm cream + coral. Hero photo placeholder, key-facts strip, "Spør om eiendommen" chip panel, three auto-loaded sections with shimmer skeletons.
  - **`#/e` B2B workspace dashboard** — Linear/Stripe/Notion. Geist Sans + Geist Mono. Light mode, emerald accent. Sidebar nav showing agent operational state, top breadcrumb, property header, three live data cells (population with sparkline, weather with glyph, neighborhood with mini-grid), ask panel, activity log.
- Landing page (`#/`) splits the five into **Transcript-centric** (A/B/C) and **Agent-in-product** (D/E) groups so the framing distinction surfaces before the aesthetic choice does.
- `apps/web/` is a pnpm workspace member. Vite 7 + React 19 + TS. Vite dev-proxy stubbed for `/query` and `/health` → `localhost:3000` (unused while fixtures are canned).
- Biome clean (24 files). Typecheck clean (api + web).
- pnpm-workspace.yaml has `allowBuilds: esbuild: true` + `onlyBuiltDependencies: [esbuild]` — needed for esbuild's postinstall in pnpm 11. Don't remove.

**What is NOT done**
- **No prototype has been picked.** All five are alive in the tree. The PRD says the losing ones get deleted (§9); that has not happened.
- **No real API integration.** Every prototype uses `FIXTURES[scenarioKey]` lookups with `setTimeout` fake latency. The Vite proxy config is in place but no `fetch('/query')` exists anywhere. v1 wiring is a ~30-line change in the winning prototype: replace the `setTimeout(...FAKE_LATENCY_MS[scenarioKey])` block with a real `fetch('/query', { method:'POST', body: JSON.stringify({query, address}) })` and measure wall time around it.
- **Free-text questions are shortcut to the population fixture** in A/B/C/D/E. The Send button maps any typed input to `'population'` — a prototype-only hack. v1 deletes this and uses the real query string.
- **The other-source rail items** (weather / neighborhood / both) now have fixtures, but the **edge-case footer** (ambiguous / no-match) is still disabled placeholders. PRD §5.A says these belong in the property panel state, not the transcript — v1 wires Kartverket no-match and multi-match into the property panel UI.
- **No prod deploy posture.** Local-only per PRD §7. The path to public deploy is short (CORS header on API, `VITE_API_BASE` env var, host the static build) but deliberately deferred.

**Pick up from one of**
1. **Decide framing first: transcript-centric (A/B/C) vs agent-in-product (D/E)?** This is the more upstream choice than aesthetic register. A/B/C imagine the agent is the product; D/E imagine the agent powers a product. The framing decision narrows the second decision (which aesthetic register inside the chosen group). The PRD §9 surfaces this as a deliberate question. *(My recommended next step — without this, picking between A and D is comparing different categories of artifact.)*
2. **Pick a winner from the five and start v1 wiring.** Wiring is small (see "What is NOT done") and mostly localised to the chosen prototype's `ask()` function. Once a winner is picked, the other four get deleted per PRD §9; their `register.md` files document the alternatives in git history.
3. **Tune pacing.** PRD §4 says 300ms inter-step; current values are 320 (A), 360 (B), 300 (C), 300 (D), 280 (E). After watching them live a few times, lock one value and apply uniformly.
4. **Wire the edge-case footer.** PRD §5.A specifies property-panel inline states for "no match" (0 candidates) and "matched N candidates" (N>1). Currently disabled placeholders in A/B/C; nonexistent in D/E. Easiest in C (already has a property strip); biggest visual impact in D (the consumer page needs a graceful "address didn't resolve" mode).
5. **Add `pnpm dev` concurrency at the root.** PRD §10 open question. Currently `pnpm dev` only runs the API; web has to be started separately. Simplest fix is `pnpm -r --parallel --if-present dev` at the root, no new dep.

**Method**
- Biome (root `biome.json`) is the linter + formatter. Run `pnpm exec biome check --write apps/web` before committing.
- Typecheck both workspaces: `pnpm typecheck` at the root runs API + web.
- React 19 + Vite 7 + TS 6 with `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`, `noUncheckedIndexedAccess: true`, `allowImportingTsExtensions: true`. Imports use `.ts` / `.tsx` suffixes. `import type` for types-only. JSX uses `react-jsx` transform — no React import needed.
- No router, no state library. Hash-based route switching in `App.tsx` for the five prototypes; `useState` + `useReducer` is sufficient for everything else.
- Shared infrastructure stays in `src/shared/`. Each prototype is self-contained under `src/prototypes/<name>/` with `index.tsx`, `styles.css`, `register.md`. CSS uses BEM-ish class names prefixed with a short tag (`cart__`, `ed__`, `dev__`, `prop__`, `ws__`) so styles don't leak between prototypes loaded in the same dev session.
- List keys derive from content via `traceStepKey` / `routingStepKey` / `citationKey` — never array index.
- Don't add a real API call to any prototype. Real API integration is a v1 step on the winning prototype, not a prototype-phase concern. The PRD §9 split (render problem vs API integration) is load-bearing.
- Don't touch `apps/api/` from frontend work. The API is feature-complete from this workstream's perspective; if it needs changes, that's a separate workstream picked up via `docs/resume-prompt.md`.

**Quick run**
```
pnpm --filter web dev
# → http://localhost:5173/ — landing
# → #/a cartographic, #/b editorial, #/c developer-tool
# → #/d B2C property landing, #/e B2B workspace dashboard
```

Now give me two options aimed at people looking for a place to live: 1) lively, colourful, playful and visual
(we will show images later) and 2) super-simple - only address search (later we'll add lookup and
geo-coding) + map(s). Both options should have a richer set of prepared prompts, to rig for future additions
(more sources/APIs) 
