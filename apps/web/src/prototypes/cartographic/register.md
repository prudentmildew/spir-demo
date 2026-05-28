# Register A — Cartographic / public-sector utility

> Quoted verbatim from `docs/frontend-prd.md` §8. The prototype in this directory
> must conform.

**Evocation:** Kartverket's internal tools, the SSB statistikkbanken interface, a
well-built municipal portal. Norwegian state-data sensibility.

**Audience pull:** PM, domain reviewer. Signals "I understand Norwegian
public-data infrastructure."

**Typography.** Inter (or system-ui) for everything. Mono (JetBrains Mono / IBM
Plex Mono) for `matrikkel`, `kommunenr`, `lat,lon`, tool inputs. No serifs. Small
label-uppercase chrome.

**Palette.** Restrained — off-white background `#F7F7F4`, ink-grey body
`#1F2933`, accent muted-blue `#2A5D8F`. Grounded badge in a calm green `#3A6B45`;
refusal in slate `#475569`; degraded in muted-ochre `#A87B2A`. No saturated reds.

**Density.** Standard-dense. Generous label-to-value pairs; small caps for
labels. Step cards are tight, ~28px tall.

**Distinctive choices.** Map-key visual idiom: a numbered legend in the corner of
each Plan/Run/Answer act. Matrikkel rendered as `0301-208-456-12` in mono with
the legend `kommune-gnr-bnr-snr` beneath in 10px uppercase.

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
