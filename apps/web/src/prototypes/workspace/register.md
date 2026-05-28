# Register E — B2B workspace dashboard

> Added to `docs/frontend-prd.md` §8 as part of the second prototype batch
> (5-registers expansion). The prototype in this directory must conform.

**Evocation:** Linear, Stripe Atlas, Notion database view, internal proptech
due-diligence tooling. A multi-cell workspace where the agent is one of several
data lenses on a property file.

**Audience pull:** the proptech engineer-and-PM tandem looking at "could we
embed this in our existing workspace product?". Signals "I understand internal
tooling patterns and how the agent integrates as a workhorse, not as the
showpiece."

**Framing shift.** Same shift as Register D: the agent powers a product surface
rather than being the surface. Where D imagines an end-consumer property listing,
E imagines the analyst's tool: a left-rail workspace nav, a property-level
header, an Overview tab with three live data cells, a full-width "ask anything"
panel, and an activity log of recent agent actions. The agent is a *primitive*,
not the whole.

**Typography.** Geist Sans (Vercel's typeface) for chrome. Geist Mono for
crumbs, tool names, citation tags, IDs, and timestamps. Tight tracking, slightly
condensed lines.

**Palette.** Near-white background `#F8F9FB`, pure-white surface `#FFFFFF`,
hairline borders `#E4E6EB`. Deep charcoal body `#1A1A24`. Accent: a serious
emerald `#0E7C6F` (signals trust + real estate without overlapping the cooler
blue of the developer-console register). Status pills: emerald `ok`, amber
`partial`, slate `refused`. No saturated colour anywhere — light-mode SaaS
restraint.

**Density.** Dense. Hairline dividers between rows. Card padding ~18px. Cell
labels in tiny uppercase. The page reads as a status surface.

**Distinctive choices.**

- **Three live data cells** in the Overview tab, each populated by an agent
  scenario (`population`, `weather`, `neighborhood`) and rendered with a
  domain-appropriate visual: a sparkline trend for population, a sun-and-cloud
  glyph for weather, a 4-tile mini-grid for the area profile. Each cell carries
  a small "by SSB / by MET / by Nettsøk" source tag and a measured `Nms`
  latency stamp.
- **Sidebar navigation** with sections for Workspace, Recent properties (current
  property highlighted with an emerald rail), and Agent (with `124 routing
  plans`, `9 refusals logged`, `source health · all ok`). The agent's *system
  state* is visible at-a-glance from the nav — a small flex that says
  "operationally aware".
- **Ask panel** uses a single typed input with a saved-queries row of pills
  below; clicking a pill or pressing ⏎ reveals the routing plan, trace, answer,
  and a small `grounded` pill in the result bar.
- **Refusal** renders as a slate-bordered result block with the `router.out_of_scope`
  key in mono, the verbatim reason as prose, and a required-source footer.
  Calm, professional, *not alarmed*.
- **Activity log** at the bottom shows the last 24h of agent actions on this
  property, including a refusal entry — putting the agent's honest "I can't
  answer that" on equal footing with successful resolutions.

**Sample component (workspace refusal result):**

```
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE                              [refused]  412 ms     │
│  ─────────────────────────────────────────────────────────  │
│  router.out_of_scope                                         │
│                                                              │
│  ownership records (hjemmelshaver) are held in the          │
│  matrikkelregister, which this demo does not read.          │
│                                                              │
│  - - - - - - - - - - - - - - - - - - - - - - - - - - - -    │
│  REQUIRED SOURCE                                             │
│  hjemmelshaver · matrikkelregisteret                         │
└─────────────────────────────────────────────────────────────┘
```
