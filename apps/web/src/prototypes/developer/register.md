# Register C — Developer-tool / observability

> Quoted verbatim from `docs/frontend-prd.md` §8. The prototype in this directory
> must conform.

**Evocation:** Linear, Vercel, Stripe dashboards, the Anthropic console. Dark
mode default, dense data, hover-rich.

**Audience pull:** the engineers. Signals "I know my way around developer
tooling and observability."

**Typography.** Inter for chrome. JetBrains Mono for *everything* trace-related:
tool names, inputs, outputs, citation URLs. The answer prose stays in Inter.
Tight tracking, slightly condensed.

**Palette.** Near-black background `#0A0A0B`, off-white body `#E8E8EA`, accent
electric-blue `#6BA4FF`. Status pills: green `#3DD68C` for ok, amber `#E0A23A`
for degraded, slate `#7B8290` for refused. Grounded badge as a small mono pill
in the answer card's top-right corner.

**Density.** Dense. Step cards stacked tight with hairline dividers. Hover-reveal
of step `input`/`output` JSON. A subtle ⌘K command palette in the top-right that
opens the curated rail as a searchable list — a small flex that costs little.

**Distinctive choices.** Step cards render as terminal-style log lines with
timestamps (relative to turn start, e.g. `+0.4s`) — but only when the wall-clock
would actually carry meaning, which for v1 is never. So timestamps are absent in
v1 even in this register, replaced by the act number. The trace input/output
blobs are syntax-highlighted JSON, collapsed by default with a `{...}`
affordance.

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
