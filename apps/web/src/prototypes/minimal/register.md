# Register G — Minimal address-first (consumer search)

> Added to `docs/frontend-prd.md` §8 as the seventh register, alongside D, E
> and F in the *agent-in-product* framing. Aimed at people looking for a place
> to live who want one input above the fold. The prototype in this directory
> must conform.

**Evocation:** Google's homepage, Linear's splash, Vipps' address-only flow,
Cuyana, brutalist-minimal SaaS landings. Strip everything until only the
address input and the map remain. The agent shows up as a quiet rail of
prepared prompts below the fold, not as a hero.

**Audience pull:** product reviewers who suspect "the way to ship this to
consumers is to give them one input and get out of the way". Signals "I can
hold the line on simplicity and trust the user — and I've designed the
expansion path so that adding more sources won't break the calm."

**Framing.** Agent-in-product, like D/E/F — but the "product" here is *just
search*. The agent is the only data engine on the page; the map and the future
geocoder are the chrome around it.

**Typography.** A single typeface: Inter at varied sizes (76px hero input,
24px answer headlines, 14.5px row text, 10.5px mono labels). ui-monospace for
the source/API tags and metric labels. No serif anywhere — the calm comes from
typographic restraint, not flourish.

**Palette.** Off-white paper `#FAFAF8`, ink `#14141A`, hairline rules `#E7E5DD`.
One accent: cobalt `#2A4AD8` for the active address underline, the map pin,
and source links. No other colour on the page.

**Density.** Sparse at the top (a single 64-px-tall input centred on the
viewport), dense at the bottom (a hairline-ruled two-column grid of grouped
prompts). The page reads top-to-bottom as input → map → ask → answer.

**Distinctive choices.**

- **Address input as the hero.** Big centred contenteditable-feeling input,
  pre-filled with the seeded address. Underline turns cobalt on focus. A small
  mono `SENERE` (later) label sits below to flag that live Kartverket
  autocomplete is the next slot to fill.
- **Quiet SVG map.** Single static sketch — coastline, road grid, park block,
  one pin. Paves the route to a real tile map (MapLibre + Kartverket WMTS) in
  v1 without needing a vendor today. WGS84 coordinates sit beneath the map in
  mono.
- **Single-column grouped prompt rail** in two-column-grid layout: group head
  on the left (title / subtitle / source name in mono cobalt), prompts as
  hairline-ruled rows on the right. Each row reads like a table line: a label,
  optional `no` flag, and either an `→` arrow (wired) or a future-source pill
  (`SSB · table 07459`, `NILU`, `Entur`, …).
- **Calm answer.** Renders inline below the rail under a 2px ink rule. Steps
  rendered as a two-column `dl` grid in mono: source → step. No animation, no
  colour — the calm of the page extends to the answer.
- **Refusal** uses the same answer slot, no special framing — the difference is
  the ink `Ærlig avslag` label and a slim ink-bordered "ikke grunnet" tick. The
  honest-refusal moment is normal-state, not alarmed.

**Sample component (address hero):**

```
                          SØK PÅ EN ADRESSE

      Dronning Mauds gate 10, 0250 Oslo
      ─────────────────────────────────────────────────────
        ↑ 64-px Inter, ink underline turns cobalt on focus

      [ SENERE ] oppslag mot Kartverket og live autocomplete
                · i dag: én forhåndslagret match
```

**Sample component (refusal answer):**

```
                                                    [ ─── ink rule ─── ]
   ÆRLIG AVSLAG
   Who owns this property?

   Jeg kan ikke svare på dette fra de åpne kildene jeg
   har — og jeg gjetter ikke.

   │ "ownership records (hjemmelshaver) are held in the
   │ matrikkelregister, which this demo does not read."

   FOR Å SVARE TRENGS
   hjemmelshaver · matrikkelregisteret
   ─────────────────────────────────────────────────────
   [Kartverket]                  IKKE GRUNNET    412 ms
```
