import { useRef, useState } from 'react';
import { EXTENDED_RAIL, type ExtendedRailItem, RAIL_GROUPS } from '../../shared/extended-rail.ts';
import { FAKE_LATENCY_MS, FIXTURES } from '../../shared/fixtures.ts';
import { formatLatLon, SEEDED_MATCH } from '../../shared/match.ts';
import { type Citation, citationKey, type Turn } from '../../shared/types.ts';
import './styles.css';

export function Minimal() {
  const [address, setAddress] = useState(SEEDED_MATCH.address);
  return (
    <div className="min">
      <Brand />
      <AddressHero address={address} onChange={setAddress} />
      <MapPanel />
      <Prompts />
      <ColophonFooter />
    </div>
  );
}

function Brand() {
  return (
    <header className="min__brand">
      <a className="min__brandLink" href="#/prototypes">
        <span className="min__brandMark" aria-hidden="true">
          ◇
        </span>
        <span className="min__brandWord">Adresse</span>
        <span className="min__brandFaint">/ register G</span>
      </a>
    </header>
  );
}

function AddressHero({ address, onChange }: { address: string; onChange: (next: string) => void }) {
  return (
    <section className="min__hero" aria-label="Adressesøk">
      <label className="min__heroLabel" htmlFor="min-address">
        Søk på en adresse
      </label>
      <div className="min__heroInputWrap">
        <input
          id="min-address"
          className="min__heroInput"
          value={address}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <span className="min__heroUnderline" aria-hidden="true" />
      </div>
      <div className="min__heroHint">
        <span className="min__heroHintLabel">Senere</span>
        oppslag mot Kartverket og live autocomplete · i dag: én forhåndslagret match
      </div>
    </section>
  );
}

function MapPanel() {
  // Simple SVG map: a calm sketch with a single pin at the seeded coordinate.
  // In v1 this becomes a real tile map (MapLibre + Kartverket WMTS).
  return (
    <section className="min__map" aria-label="Kart">
      <svg viewBox="0 0 800 280" className="min__mapSvg" role="img" aria-label="Kartskisse">
        <title>Skisse av kart over Hydroparken, Frogner</title>
        <rect width="800" height="280" fill="#fafaf8" />
        {/* coastline */}
        <path
          d="M0 220 Q120 200 240 215 T520 218 T800 210"
          stroke="#d8d4cc"
          strokeWidth="1.2"
          fill="none"
        />
        {/* water tone below */}
        <path d="M0 220 Q120 200 240 215 T520 218 T800 210 L800 280 L0 280 Z" fill="#f1eee8" />
        {/* roads */}
        <path d="M120 0 L160 280" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        <path d="M280 0 L320 280" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        <path d="M520 0 L500 280" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        <path d="M680 0 L640 280" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        <path d="M0 80 L800 110" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        <path d="M0 160 L800 170" stroke="#e6e2d8" strokeWidth="1" fill="none" />
        {/* park block */}
        <rect x="340" y="60" width="120" height="80" fill="#ece8db" rx="2" />
        <text
          x="400"
          y="103"
          fontSize="9"
          fill="#a09a87"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
        >
          Hydroparken
        </text>
        {/* pin */}
        <circle
          cx="400"
          cy="140"
          r="11"
          fill="none"
          stroke="#2a4ad8"
          strokeWidth="1"
          opacity="0.4"
        />
        <circle cx="400" cy="140" r="5" fill="#2a4ad8" />
      </svg>
      <div className="min__mapMeta">
        <span className="min__mapMetaLabel">WGS84</span>
        <span className="min__mapMetaValue">
          {formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}
        </span>
      </div>
    </section>
  );
}

function Prompts() {
  const [active, setActive] = useState<Turn | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const turnSeq = useRef(0);

  function ask(item: ExtendedRailItem) {
    if (pendingId) return;
    if (item.scenarioKey === null) return;
    setActive(null);
    setPendingId(item.id);
    const id = `t${++turnSeq.current}`;
    const started = performance.now();
    const scenarioKey = item.scenarioKey;
    window.setTimeout(() => {
      setActive({
        id,
        question: item.question,
        scenarioKey,
        response: FIXTURES[scenarioKey],
        totalMs: Math.round(performance.now() - started),
        startedAt: started,
      });
      setPendingId(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  return (
    <section className="min__prompts" aria-label="Spørsmål">
      <div className="min__promptsHead">
        <h2 className="min__promptsTitle">Spør om denne adressen</h2>
        <p className="min__promptsLede">
          15 forhåndsdefinerte spørsmål, gruppert etter kilde. Det agenten ikke kan svare på ennå er
          merket med kilden som vil drive svaret når den blir koblet til.
        </p>
      </div>

      <div className="min__groups">
        {RAIL_GROUPS.map((group) => {
          const items = EXTENDED_RAIL.filter((it) => it.group === group.key);
          return (
            <div key={group.key} className="min__group">
              <div className="min__groupHead">
                <div className="min__groupTitle">{group.title}</div>
                <div className="min__groupSub">{group.subtitle}</div>
                <div className="min__groupSrc">{group.sources}</div>
              </div>
              <ul className="min__groupItems">
                {items.map((item) => (
                  <li key={item.id} className="min__row">
                    <button
                      type="button"
                      className={`min__rowBtn ${
                        item.scenarioKey === null ? 'min__rowBtn--future' : ''
                      } ${pendingId === item.id ? 'min__rowBtn--pending' : ''}`}
                      onClick={() => ask(item)}
                      disabled={pendingId !== null || item.scenarioKey === null}
                    >
                      <span className="min__rowLabel">{item.label}</span>
                      {item.scenarioKey === null && (
                        <span className="min__rowFuture">{item.futureSource ?? 'soon'}</span>
                      )}
                      {pendingId === item.id && (
                        <span className="min__rowPending" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                      {item.scenarioKey !== null && pendingId !== item.id && (
                        <span className="min__rowArrow" aria-hidden="true">
                          →
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <AnswerSlot active={active} pendingId={pendingId} />
    </section>
  );
}

function AnswerSlot({ active, pendingId }: { active: Turn | null; pendingId: string | null }) {
  if (pendingId && !active) {
    return (
      <article className="min__answer min__answer--loading">
        <div className="min__answerLabel">Henter…</div>
      </article>
    );
  }
  if (!active) return null;
  if (active.response.plan?.outOfScope) {
    return <RefusalAnswer turn={active} />;
  }
  return <GroundedAnswer turn={active} />;
}

function GroundedAnswer({ turn }: { turn: Turn }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  return (
    <article className="min__answer">
      <div className="min__answerLabel">Svar</div>
      <h3 className="min__answerQ">{turn.question}</h3>
      <p className="min__answerBody">{stripAddressLead(turn.response.answer)}</p>
      <dl className="min__answerSteps">
        {runSteps.map((s) => (
          <div key={`${s.step}-${s.tool}`} className="min__stepRow">
            <dt>{prettySource(s.tool)}</dt>
            <dd>{prettyStep(s.step)}</dd>
          </div>
        ))}
      </dl>
      <footer className="min__answerFoot">
        <div className="min__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="min__answerMeta">
          <span className="min__tick">grunnet</span>
          <span className="min__time">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function RefusalAnswer({ turn }: { turn: Turn }) {
  const reason = turn.response.plan?.outOfScope?.reason ?? '';
  return (
    <article className="min__answer min__answer--refusal">
      <div className="min__answerLabel min__answerLabel--refusal">Ærlig avslag</div>
      <h3 className="min__answerQ">{turn.question}</h3>
      <p className="min__refusalLead">
        Jeg kan ikke svare på dette fra de åpne kildene jeg har — og jeg gjetter ikke.
      </p>
      <blockquote className="min__refusalQuote">"{reason}."</blockquote>
      <div className="min__refusalNeed">
        <span className="min__refusalLabel">For å svare trengs</span>
        <span className="min__refusalSrc">hjemmelshaver · matrikkelregisteret</span>
      </div>
      <footer className="min__answerFoot">
        <div className="min__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="min__answerMeta">
          <span className="min__tick min__tick--no">ikke grunnet</span>
          <span className="min__time">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <a className="min__chip" href={c.url} target="_blank" rel="noopener noreferrer">
      {prettySource(c.source)}
    </a>
  );
}

function ColophonFooter() {
  return (
    <footer className="min__colophon">
      <div>
        <span className="min__colophonLabel">Demo</span>
        Søkeboksen er fortsatt en placeholder; én adresse er hardkodet. Live oppslag mot Kartverket
        og kart-tile-laster (MapLibre + Kartverket WMTS) er neste steg.
      </div>
      <div className="min__colophonRight">
        <span className="min__colophonLabel">Kilder i dag</span>
        Kartverket · SSB · MET · Nettsøk
      </div>
    </footer>
  );
}

function stripAddressLead(s: string): string {
  return s.replace(/^Dronning Mauds gate 10, 0250 Oslo ligger i kommune \d+\.\s*/, '');
}

function prettySource(s: string): string {
  switch (s) {
    case 'kartverket':
      return 'Kartverket';
    case 'ssb':
      return 'SSB';
    case 'met':
      return 'MET';
    case 'web':
      return 'Nettsøk';
    default:
      return s;
  }
}

function prettyStep(s: string): string {
  return s.replace(/_/g, ' ');
}
