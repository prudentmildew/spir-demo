import { useRef, useState } from 'react';
import {
  EXTENDED_RAIL,
  type ExtendedRailItem,
  RAIL_GROUPS,
  type RailGroup,
} from '../../shared/extended-rail.ts';
import { FAKE_LATENCY_MS, FIXTURES } from '../../shared/fixtures.ts';
import { formatMatrikkel, SEEDED_MATCH } from '../../shared/match.ts';
import { type Citation, citationKey, type ScenarioKey, type Turn } from '../../shared/types.ts';
import './styles.css';

// Bento tiles for the hero. Each tile is an image-placeholder today; the
// register.md notes which real photo / data source slots in later.
type BentoTile = {
  area: 'main' | 'facade' | 'map' | 'street' | 'weather' | 'pop' | 'vibe';
  kicker: string;
  body: string;
  tint: 'coral' | 'mint' | 'cobalt' | 'lemon' | 'plum' | 'cream';
  isPhoto?: boolean;
  glyph?: string;
};

const BENTO: BentoTile[] = [
  {
    area: 'main',
    kicker: 'Eksteriør · 1 av 12',
    body: 'ingen offentlig foto · åpen-data-demo',
    tint: 'coral',
    isPhoto: true,
  },
  {
    area: 'facade',
    kicker: 'Fasadedetalj',
    body: 'bilde-plassholder',
    tint: 'mint',
    isPhoto: true,
  },
  {
    area: 'map',
    kicker: 'På kartet',
    body: 'Hydroparken · Frogner',
    tint: 'cobalt',
    glyph: '✚',
  },
  {
    area: 'street',
    kicker: 'Gateplan',
    body: 'bilde-plassholder',
    tint: 'plum',
    isPhoto: true,
  },
  { area: 'weather', kicker: 'Akkurat nå', body: '9 °C delvis skyet', tint: 'lemon', glyph: '☼' },
  { area: 'pop', kicker: 'Kommune', body: '717 710 · Oslo', tint: 'cream', glyph: '◍' },
  {
    area: 'vibe',
    kicker: 'Stemning',
    body: 'Ambassader · skulpturpark · Bygdøy allé',
    tint: 'mint',
    glyph: '✺',
  },
];

export function Playful() {
  return (
    <div className="play">
      <div className="play__noise" aria-hidden="true" />
      <Topbar />
      <Hero />
      <Bento />
      <AskPalette />
      <Footer />
    </div>
  );
}

function Topbar() {
  return (
    <header className="play__topbar">
      <a className="play__brand" href="#/prototypes">
        <span className="play__brandMark" aria-hidden="true">
          ✺
        </span>
        <span className="play__brandWord">Nabolaget</span>
        <span className="play__brandFaint">/ register F</span>
      </a>
      <div className="play__addressChip">
        <span className="play__addressIcon" aria-hidden="true">
          ⌖
        </span>
        <span>{SEEDED_MATCH.address}</span>
        <span className="play__addressEdit">endre</span>
      </div>
      <div className="play__topActions">
        <button type="button" className="play__iconBtn">
          <span aria-hidden="true">♡</span> Lagre
        </button>
        <button type="button" className="play__primaryBtn">
          Be om visning
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const [streetNumber, ...rest] = SEEDED_MATCH.address.split(',');
  const locality = rest.join(',').trim();
  return (
    <section className="play__hero" aria-label="Eiendoms-hero">
      <div className="play__heroKicker">
        <span className="play__heroDot" aria-hidden="true" />
        Frisk på markedet · åpen-data demo
      </div>
      <h1 className="play__heroTitle">
        <span className="play__heroAddress">{streetNumber}</span>
        <span className="play__heroLocality">{locality} · Frogner</span>
      </h1>
      <p className="play__heroLede">
        En liten leksjon i nabolaget. Bilder, kart og fakta nedenfor — og en agent som svarer på
        spørsmål om alt fra befolkning til vær til hvem som eier huset.
      </p>
    </section>
  );
}

function Bento() {
  return (
    <section className="play__bentoWrap" aria-label="Bento-galleri">
      <div className="play__bento">
        {BENTO.map((tile) => (
          <BentoCell key={tile.area} tile={tile} />
        ))}
      </div>
      <div className="play__bentoLegend">
        <span className="play__legendDot" aria-hidden="true" />
        Bilder kommer · alle data er reelle, fra åpne kilder
      </div>
    </section>
  );
}

function BentoCell({ tile }: { tile: BentoTile }) {
  return (
    <article
      className={`play__cell play__cell--${tile.area} play__cell--${tile.tint} ${
        tile.isPhoto ? 'play__cell--photo' : ''
      }`}
    >
      {tile.isPhoto ? (
        <>
          <div className="play__cellPhoto" aria-hidden="true">
            <span className="play__cellPhotoCross" aria-hidden="true" />
          </div>
          <div className="play__cellPhotoLabel">{tile.body}</div>
          <div className="play__cellKicker play__cellKicker--onPhoto">{tile.kicker}</div>
        </>
      ) : (
        <>
          {tile.glyph && (
            <div className="play__cellGlyph" aria-hidden="true">
              {tile.glyph}
            </div>
          )}
          <div className="play__cellKicker">{tile.kicker}</div>
          <div className="play__cellBody">{tile.body}</div>
        </>
      )}
    </article>
  );
}

function AskPalette() {
  const [active, setActive] = useState<Turn | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const turnSeq = useRef(0);

  function ask(item: ExtendedRailItem) {
    if (pendingId) return;
    if (item.scenarioKey === null) return; // "coming soon" — no-op
    setActive(null);
    setPendingId(item.id);
    const id = `t${++turnSeq.current}`;
    const started = performance.now();
    const scenarioKey = item.scenarioKey;
    window.setTimeout(() => {
      const totalMs = Math.round(performance.now() - started);
      setActive({
        id,
        question: item.question,
        scenarioKey,
        response: FIXTURES[scenarioKey],
        totalMs,
        startedAt: started,
      });
      setPendingId(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  return (
    <section className="play__ask" aria-label="Spør om denne eiendommen">
      <div className="play__askHead">
        <div className="play__askKicker">Spør om eiendommen</div>
        <h2 className="play__askTitle">Bli kjent med stedet.</h2>
        <p className="play__askLede">
          Velg et tema — eller skriv ditt eget. Agenten henter bare det den faktisk har en kilde
          til, og sier ærlig fra når den må gi seg.
        </p>
      </div>

      <div className="play__groups">
        {RAIL_GROUPS.map((group) => (
          <GroupCard
            key={group.key}
            group={group}
            pendingId={pendingId}
            onAsk={ask}
            answeredId={active ? findItemIdForScenario(active.scenarioKey) : null}
          />
        ))}
      </div>

      <AnswerSlot active={active} pendingId={pendingId} />
    </section>
  );
}

function findItemIdForScenario(scenarioKey: ScenarioKey): string | null {
  const hit = EXTENDED_RAIL.find((it) => it.scenarioKey === scenarioKey);
  return hit?.id ?? null;
}

function GroupCard({
  group,
  pendingId,
  onAsk,
  answeredId,
}: {
  group: RailGroup;
  pendingId: string | null;
  onAsk: (item: ExtendedRailItem) => void;
  answeredId: string | null;
}) {
  const items = EXTENDED_RAIL.filter((it) => it.group === group.key);
  return (
    <article className={`play__group play__group--${group.tint}`}>
      <header className="play__groupHead">
        <div className="play__groupGlyph" aria-hidden="true">
          {group.glyph}
        </div>
        <div className="play__groupTitles">
          <div className="play__groupTitle">{group.title}</div>
          <div className="play__groupSub">{group.subtitle}</div>
        </div>
        <div className="play__groupSources">{group.sources}</div>
      </header>
      <div className="play__groupItems">
        {items.map((item) => (
          <PromptTile
            key={item.id}
            item={item}
            pending={pendingId === item.id}
            disabled={pendingId !== null}
            answered={answeredId === item.id}
            onClick={() => onAsk(item)}
          />
        ))}
      </div>
    </article>
  );
}

function PromptTile({
  item,
  pending,
  disabled,
  answered,
  onClick,
}: {
  item: ExtendedRailItem;
  pending: boolean;
  disabled: boolean;
  answered: boolean;
  onClick: () => void;
}) {
  const future = item.scenarioKey === null;
  return (
    <button
      type="button"
      className={`play__tile ${future ? 'play__tile--future' : ''} ${
        pending ? 'play__tile--pending' : ''
      } ${answered ? 'play__tile--answered' : ''}`}
      onClick={onClick}
      disabled={disabled || future}
      aria-disabled={disabled || future}
    >
      <span className="play__tileLabel">{item.label}</span>
      {future && (
        <span className="play__tileBadge">
          <span className="play__tileBadgeDot" aria-hidden="true" />
          {item.futureSource ?? 'soon'}
        </span>
      )}
      {pending && (
        <span className="play__tilePending" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}

function AnswerSlot({ active, pendingId }: { active: Turn | null; pendingId: string | null }) {
  if (pendingId && !active) {
    return (
      <article className="play__answer play__answer--loading">
        <div className="play__answerKicker">Agenten leter…</div>
        <div className="play__skeletonLine" />
        <div className="play__skeletonLine play__skeletonLine--short" />
      </article>
    );
  }
  if (!active) {
    return (
      <article className="play__answer play__answer--hint" aria-hidden="false">
        <div className="play__answerKicker">Klar når du er</div>
        <div className="play__answerHintText">
          Svaret dukker opp her — med kilder, og en liten "grunnet"-stempel.
        </div>
      </article>
    );
  }
  if (active.response.plan?.outOfScope) {
    return <RefusalAnswer turn={active} />;
  }
  return <GroundedAnswer turn={active} />;
}

function GroundedAnswer({ turn }: { turn: Turn }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  return (
    <article className="play__answer play__answer--grounded">
      <header className="play__answerHead">
        <div className="play__answerKicker">Spurt</div>
        <h3 className="play__answerQ">{turn.question}</h3>
      </header>
      <p className="play__answerBody">{stripAddressLead(turn.response.answer)}</p>
      <div className="play__answerSteps">
        {runSteps.map((s) => (
          <div key={`${s.step}-${s.tool}`} className="play__answerStep">
            <span className="play__stepDot" aria-hidden="true" />
            <span>
              Hentet fra <strong>{prettySource(s.tool)}</strong>
            </span>
          </div>
        ))}
      </div>
      <footer className="play__answerFoot">
        <div className="play__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="play__answerMeta">
          <span className="play__tick play__tick--ok">
            <span aria-hidden="true">✓</span> grunnet
          </span>
          <span className="play__time">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function RefusalAnswer({ turn }: { turn: Turn }) {
  const reason = turn.response.plan?.outOfScope?.reason ?? '';
  return (
    <article className="play__answer play__answer--refusal">
      <div className="play__refusalStamp" aria-hidden="true">
        ærlig avslag
      </div>
      <header className="play__answerHead">
        <div className="play__answerKicker play__answerKicker--refusal">Ikke i denne demoen</div>
        <h3 className="play__answerQ">{turn.question}</h3>
      </header>
      <p className="play__refusalLead">
        Dette kan jeg ikke svare på fra de åpne kildene jeg har — og jeg gjetter ikke.
      </p>
      <blockquote className="play__refusalQuote">"{reason}."</blockquote>
      <div className="play__refusalNeed">
        <span className="play__refusalNeedLabel">For å svare trengs</span>
        <span className="play__refusalNeedSrc">hjemmelshaver · matrikkelregisteret</span>
      </div>
      <footer className="play__answerFoot">
        <div className="play__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="play__answerMeta">
          <span className="play__tick play__tick--no">
            <span aria-hidden="true">◌</span> ikke grunnet
          </span>
          <span className="play__time">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <a className="play__chip" href={c.url} target="_blank" rel="noopener noreferrer">
      <span className="play__chipDot" aria-hidden="true" />
      {prettySource(c.source)}
    </a>
  );
}

function Footer() {
  return (
    <footer className="play__footer">
      <div className="play__footerCol">
        <div className="play__footerKicker">Eiendom</div>
        <div className="play__footerVal">{formatMatrikkel(SEEDED_MATCH.matrikkel)}</div>
        <div className="play__footerHint">kom · gnr · bnr · snr</div>
      </div>
      <div className="play__footerCol">
        <div className="play__footerKicker">Kommune</div>
        <div className="play__footerVal">
          {SEEDED_MATCH.kommunenavn} · {SEEDED_MATCH.kommunenr}
        </div>
        <div className="play__footerHint">resolved via Kartverket</div>
      </div>
      <div className="play__footerCol play__footerCol--wide">
        <div className="play__footerKicker">Om demoen</div>
        <div className="play__footerHint">
          Bildene er placeholdere; alt annet er ekte data fra åpne norske kilder. Agenten gjetter
          ikke — den henter, eller den sier fra.
        </div>
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
