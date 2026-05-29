import { EditorialShell } from './shared/editorial-shell.tsx';
import './front.css';

/**
 * The front door at the bare URL ("/" / empty hash / catch-all).
 *
 * Three-tier hierarchy for a short, mixed-audience read:
 *   1. HERO   — the demo itself (register B, den valgte v1). Primary CTA.
 *   2. SECONDARY — the prototype catalog (breadth/craft: syv prototyper).
 *   3. META PAIR — the quieter "bak kulissene" links (Metodikk + Dataflyt).
 *
 * Rendered inside EditorialShell in landing mode: the brand is plain text (no
 * self-link) and there is no contextual right link — the front door does not
 * point past itself in the chrome; the body carries the wayfinding instead.
 */
export function Landing() {
  return (
    <EditorialShell
      isLanding
      kicker="Hyringsdemo · Consid"
      title={
        <>
          En eiendomsinfo-agent,
          <br />
          fortalt syv måter.
        </>
      }
      lede={
        <>
          Samme forhåndsskrevne agent, gjengitt i syv flater og tre innramminger. Dette er{' '}
          <em>fremstillingsproblemet</em> tatt på alvor: hvordan ser et ærlig agentsvar ut — med
          plan, kilder og avslag — for utviklere, PM og leder i samme rom?
        </>
      }
    >
      {/* ── HERO: the chosen v1, the primary call to action ─────────── */}
      <section className="front__hero" aria-labelledby="front-hero-title">
        <div className="front__heroKicker">Den valgte v1 · register B</div>
        <h2 className="front__heroTitle" id="front-hero-title">
          Gå rett inn i demoen.
        </h2>
        <p className="front__heroBody">
          Den redaksjonelle flaten — antikva-prosa, fotnotekilder, sporing som sluttnoter — valgte
          jeg som v1 og koblet til agenten. Den viser planen, kjøringen og svaret for hver runde, og{' '}
          <em>avslår</em> like tydelig som den svarer.
        </p>
        <a className="front__cta" href="#/demo">
          Åpne demoen
          <span className="front__ctaArrow" aria-hidden="true">
            →
          </span>
        </a>
        <p className="front__honesty">
          <span className="editorial__mono">Ærlig om hva dette er:</span> dette er v1-grensesnittet.
          Agenten selv kjører <em>ikke</em> på dette statiske nettstedet, så spørringer i sanntid
          svarer ikke her. Klon koden og kjør den lokalt for ekte svar — det er en del av poenget.
        </p>
      </section>

      {/* ── SECONDARY: the catalog (breadth / craft) ────────────────── */}
      <section className="front__secondary" aria-labelledby="front-catalog-title">
        <a className="front__catalogCard" href="#/prototypes">
          <div className="front__catalogKicker">Prototypkatalog</div>
          <h2 className="front__catalogTitle" id="front-catalog-title">
            Syv prototyper, tre innramminger
          </h2>
          <p className="front__catalogBody">
            Agenten <em>som</em> produkt, agenten som <em>motor</em> i et produkt, og flater for
            folk som <em>leter etter et sted å bo</em>. Samme data, helt ulike fortellinger —
            bredden og håndverket bak valget av v1.
          </p>
          <span className="front__catalogArrow" aria-hidden="true">
            →
          </span>
        </a>
      </section>

      {/* ── META PAIR: the quieter "bak kulissene" links ────────────── */}
      <section className="front__meta" aria-labelledby="front-meta-title">
        <h2 className="front__metaTitle" id="front-meta-title">
          Bak kulissene
        </h2>
        <div className="front__metaPair">
          <a className="front__metaLink" href="#/metodikk">
            <span className="front__metaLinkLabel">Metodikk</span>
            <span className="front__metaLinkDesc">
              Hvordan prototypene ble til, og hvorfor register B vant.
            </span>
          </a>
          <a className="front__metaLink" href="#/data-flow">
            <span className="front__metaLinkLabel">Dataflyt</span>
            <span className="front__metaLinkDesc">
              Hvilke kilder agenten spør, og hva som er ekte i dag.
            </span>
          </a>
        </div>
      </section>
    </EditorialShell>
  );
}
