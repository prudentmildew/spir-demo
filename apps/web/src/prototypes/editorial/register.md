# Register B — Editorial / publication

> Quoted verbatim from `docs/frontend-prd.md` §8. The prototype in this directory
> must conform.

**Evocation:** New York Times Upshot, FT data explainers, a Stripe Press essay.
Generous, considered, quietly confident.

**Audience pull:** the manager. Signals "this is a credible artifact, not a
hackathon project."

**Typography.** Serif for the answer prose (Source Serif Pro, or system serif).
Sans (Inter / system-ui) for UI chrome, labels, badges. Mono for technical fields
only. The serif/sans split is the load-bearing aesthetic choice — it makes the
answer feel *written*, not *generated*.

**Palette.** Warm paper background `#FBF8F1`, deep-ink body `#15161A`, accent
quiet teal `#1E5B5A`. Citations rendered as superscript footnote chips (`¹`, `²`,
`³`) with hover-tooltips showing the source name. Grounded badge as a small text
annotation, not a coloured pill. Refusal as a pulled blockquote.

**Density.** Airy. Generous line height (1.6 for answer text). Step cards are
spacious, ~44px tall, with whitespace between them.

**Distinctive choices.** The answer card *reads* like a paragraph from an
article, with footnote markers. The "show your work" trace below is in a smaller
sans, visually demoted as endnotes. The whole UI tries to look like a piece of
considered prose, not an interface.

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
