# Register F — Vibrant, playful, image-forward (consumer search)

> Added to `docs/frontend-prd.md` §8 as the sixth register, alongside D and E
> in the *agent-in-product* framing. Aimed at people looking for a place to
> live, where the discovery moment is half the experience. The prototype in
> this directory must conform.

**Evocation:** Airbnb's modern card grids, Hemnet's photo-forward listings, the
playful tile work of Apartamento, MUBI's mosaic posters, riso-print zines. A
home-finding surface that leans on colour, image-shaped tiles, and personality
rather than data density.

**Audience pull:** end users browsing for a place to live, and the PM imagining
"could we ship this to a B2C market?". Signals "I understand that the discovery
surface matters as much as the data, and I can hold the agent inside a warm,
visual product without making it the centrepiece."

**Framing.** Agent-in-product, same as D/E. Where D is restrained and editorial,
F is loud and image-forward — a different *flavour* of the same framing, aimed
at a younger / more playful consumer brand. The agent shows up as a friendly
"concierge" panel below the hero, with prompts grouped by theme.

**Typography.** Fraunces (variable serif, SOFT + WONK axes) for the hero
address, group titles, answer headlines — its quirky soft-axis pulls the page
toward personality. Inter for body and chrome. IBM Plex Mono for tiny labels
and the source/API tags.

**Palette.** Riso-print accents on a warm cream `#FBF5E9` body. Five named
tints: coral `#FF5B50`, mint `#1EA688`, cobalt `#2A4AD8`, lemon `#F7C948`, plum
`#7C3A8E`. Each prompt group maps to one tint, so the eye can scan the section
by colour. The hero bento mixes saturated photo placeholders with soft data
tiles.

**Density.** Generous. 18–22px tile gaps. Big serif type at the top, big chunky
tiles below. The page should feel like flipping through a glossy nabolags-zine.

**Distinctive choices.**

- **Bento-grid hero** with image-placeholder tiles. Each photo slot is rendered
  as a chunky cross-hatched colour panel with an "Exterior · 1 of 12 · photo
  placeholder" mono label — the placeholder reads as deliberate, not missing.
  When real photos arrive (Finn.no-style gallery), they slot into the same grid
  cells with no layout change.
- **Five themed prompt groups** (Området / Folkene / Bygningen / Klima &
  vær / Tilkomst), each named by the API(s) it draws from. Tinted top-bars
  reinforce the colour map. ~15 prompts total — ~7 wired to existing fixtures,
  the rest tagged with a small mono badge naming the future source (`SSB ·
  table 07459`, `NILU`, `Entur`, `Riksantikvaren`, …). The future-source badges
  make the expansion path obvious in the demo itself.
- **Concierge voice.** Norwegian section kickers ("Spør om eiendommen", "Bli
  kjent med stedet") and a single line of bilingual lede. Warm, not corporate.
- **Answer card** has a candy-coloured top-stripe (mint→cobalt gradient for
  grounded, solid ink for refusal). Answer body is set in big Fraunces. A
  small "grunnet" pill confirms grounding.
- **Refusal** carries a rotated, italicised "ærlig avslag" stamp in the corner —
  the honest-refusal moment rendered as a charming flourish rather than an
  error state.

**Sample component (in-page grounded answer):**

```
████████████████████████████████████████████████████████ ← mint→cobalt stripe
│ SPURT                                                  │
│ What's the population of this kommune?                  │
│                                                         │
│ Population in 2024 was 717 710.                         │
│                                                         │
│  ● Hentet fra Kartverket                                │
│  ● Hentet fra SSB                                       │
│                                                         │
│  [Kartverket] [SSB]            ✓ grunnet      1247 ms   │
```

**Sample component (in-page refusal):**

```
████████████████████████████████████████████████████████ ← solid ink stripe
│ IKKE I DENNE DEMOEN          [ ærlig avslag ]  ← stamp │
│ Who owns this property?                                 │
│                                                         │
│ Dette kan jeg ikke svare på fra de åpne                 │
│ kildene jeg har — og jeg gjetter ikke.                  │
│                                                         │
│ ┃ "ownership records (hjemmelshaver) are                │
│ ┃ held in the matrikkelregister, which                  │
│ ┃ this demo does not read."                             │
│                                                         │
│ FOR Å SVARE TRENGS                                      │
│ hjemmelshaver · matrikkelregisteret                     │
│                                                         │
│  [Kartverket]                  ◌ ikke grunnet    412 ms │
```
