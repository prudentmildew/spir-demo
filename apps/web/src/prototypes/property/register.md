# Register D — B2C property landing

> Added to `docs/frontend-prd.md` §8 as part of the second prototype batch
> (5-registers expansion). The prototype in this directory must conform.

**Evocation:** Finn.no eiendom, Hemnet, Zillow. A rich consumer-facing property
listing where the agent is a *feature of the page*, not the page itself.

**Audience pull:** the consumer (and, by extension, the product lead who has to
imagine "could we ship this to end users"). Signals "I understand what a
property page looks like in market, and how the agent slots into one without
swallowing it."

**Framing shift.** Registers A/B/C treat the agent as the product. D treats the
agent as the *engine* behind a property page. The hero is the property; the
agent fills in auto-loaded sections (Befolkning, Området, Vær) and powers the
"Spør om eiendommen" chip panel. The refusal is rendered as an honest in-page
answer, not a hero card.

**Typography.** Bricolage Grotesque (variable display) for the hero address, key
fact bigs, section titles, and answer headlines. Karla for body. IBM Plex Mono
for matrikkel, lat/lon, and citation metadata.

**Palette.** Warm cream background `#FBF7F0`, paper surface `#FFFFFF`, deep
warm-ink body `#1B1410`. Primary accent: a confident coral `#E85D4A` for kickers,
CTAs, and active chips. Grounded state in sage `#5E8A6B`; refusal in warm slate
`#5C5050`. Soft pill chips for citations.

**Density.** Airy. Generous whitespace between sections, soft shadows, 16–24px
border radii. The page reads top-to-bottom as a hero / facts / ask /
auto-sections / coordinates flow.

**Distinctive choices.**

- A gradient-stand-in "hero photo" frame with an overlay; explicitly labelled
  "no public photo · open-data demo" in tiny mono, so the placeholder reads as
  *intentional restraint* rather than missing functionality.
- Auto-loaded sections stagger in (600ms / 1.4s / 2.2s) with shimmer skeletons,
  evoking a real property page populating data as you read.
- The "Spør om eiendommen" panel is a single nested card with a coral background
  hint; the active answer slides in below.
- Refusal renders as an honest **embedded** answer card with a slate left
  border, blockquote of the verbatim reason, and a small "For å svare trengs:"
  footer naming the missing source.
- Bilingual chrome (Norwegian kickers, English body) to evoke a Norwegian
  proptech surface without alienating a non-NO reviewer.

**Sample component (in-page refusal answer):**

```
┌─────────────────────────────────────────────────────────┐
│ ÆRLIG AVSLAG                                            │
│ Who owns this property?                                  │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│  Dette spørsmålet kan ikke besvares fra de              │
│  åpne kildene jeg har tilgang til.                      │
│                                                         │
│  ┃ "ownership records (hjemmelshaver) are held in       │
│  ┃ the matrikkelregister, which this demo does          │
│  ┃ not read."                                           │
│                                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  FOR Å SVARE TRENGS                                     │
│  hjemmelshaver · matrikkelregisteret                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [Kartverket]                ◌ ikke grunnet · 412 ms    │
└─────────────────────────────────────────────────────────┘
```
