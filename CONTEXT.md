# Property-Info Agent

The domain language for an agent that answers questions about a Norwegian property and its surroundings, using open data.

## Language

**matrikkel**:
The property's national key, composed of `knr` (kommune), `gnr` (gård), `bnr` (bruk), and optionally `snr` (seksjon). The thing every property record is keyed on.
_Avoid_: property id, parcel id

**kommunenr**:
4-digit municipality code, equivalent to `matrikkel.knr`. The join key between an address and statistics.
_Avoid_: municipality id, kommune code

**representasjonspunkt**:
The lat/lon coordinate representing an address, as returned by Kartverket. Used for geo-anchored lookups (e.g. weather).
_Avoid_: location, address point, geopoint

**hjemmelshaver**:
The registered owner of a property. **Out of scope** in this open-data demo; named so the agent knows the gap exists and can refuse honestly.
_Avoid_: owner (ambiguous — could mean leaseholder or occupant)

**heftelse / servitutt**:
Encumbrance and easement registered against a property. **Out of scope** in the open demo; in the real system these are authoritative and never inferred from other sources.
_Avoid_: restriction, charge, lien

**tool**:
A wrapper around a structured source (Kartverket, SSB, MET) that the agent invokes with typed inputs to get back exact data. Tools are *queried*, never retrieved.
_Avoid_: function, action, skill

**retriever**:
A wrapper around an unstructured source (Wikipedia, arXiv) that returns citable text chunks. Retrievers are *searched and cited*, never queried as structured data.
_Avoid_: rag source, knowledge base

**grounded**:
A response is `grounded` iff every claim in it traces to content returned by a tool or retriever in the current turn. The boolean is part of the API contract — when false, the agent says so honestly rather than synthesising from priors.
_Avoid_: cited, sourced, backed (use `grounded` for the boolean, `citation` for the individual link)

**citation**:
A `{ source, url, field? }` record attached to the response, pointing at the specific tool result or retriever chunk a claim came from. `field` names the structured field when the citation is from a tool.

**trace**:
The ordered list of steps the orchestrator took for a request — each step records the tool/retriever invoked, its input, and whether it succeeded. Returned alongside the answer so non-deterministic failures can be debugged after the fact.
_Avoid_: log, history, run

## Example dialogue

> **Dev:** A user asks "who owns 5 Karl Johans gate, Oslo?". What does the agent do?
>
> **Domain expert:** The address resolves — Kartverket gives you a *matrikkel* and a *representasjonspunkt*. But ownership is *hjemmelshaver*, and that's not in the open registers we read. The agent should refuse: "I can't tell you the owner — that data isn't in the sources I can access." That's `grounded: false` with an honest explanation. Never guess.
>
> **Dev:** What if they ask "what municipality is it in?"
>
> **Domain expert:** Once you have the *matrikkel*, you have the *knr* — that *is* the *kommunenr*. Answer it from the tool result directly, with the Kartverket call as the *citation*. Don't reach for Wikipedia for something a structured lookup already knows.
>
> **Dev:** And "what's the area like?"
>
> **Domain expert:** Mixed. Numbers (population, age distribution) come from SSB, joined on *kommunenr* — that's a *tool*. Character of the neighbourhood, history — that's a *retriever* over Wikipedia, with citations to specific articles. The agent has to decide which parts of the question are structured and which aren't; the *trace* should show that split.
