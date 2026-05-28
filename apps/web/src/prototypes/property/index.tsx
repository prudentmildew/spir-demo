import { useEffect, useRef, useState } from 'react';
import { useChoreography } from '../../shared/choreography.ts';
import { FAKE_LATENCY_MS, FIXTURES } from '../../shared/fixtures.ts';
import { formatLatLon, formatMatrikkel, SEEDED_MATCH } from '../../shared/match.ts';
import {
  type Citation,
  citationKey,
  type QueryResponse,
  type ScenarioKey,
  type Turn,
} from '../../shared/types.ts';
import './styles.css';

const REVEAL_MS = 300;

type AutoSection = {
  key: ScenarioKey;
  kicker: string;
  title: string;
  delayMs: number;
};

// Three sections that auto-load on mount, staggered. Mimics a real listing page
// where the agent populates dynamic data while the visitor reads the hero.
const AUTO_SECTIONS: AutoSection[] = [
  { key: 'population', kicker: 'Befolkning', title: 'Om denne kommunen', delayMs: 600 },
  { key: 'neighborhood', kicker: 'Området', title: 'Om nabolaget', delayMs: 1_400 },
  { key: 'weather', kicker: 'Vær', title: 'Akkurat nå', delayMs: 2_200 },
];

// Chip questions that appear in the "Spør om eiendommen" section.
type ChipQ = { label: string; scenarioKey: ScenarioKey };
const CHIPS: ChipQ[] = [
  { label: 'Hvem eier denne eiendommen?', scenarioKey: 'refusal' },
  { label: 'Hva er folketallsutviklingen?', scenarioKey: 'population' },
  { label: 'Fortell om området', scenarioKey: 'neighborhood' },
  { label: 'Været her akkurat nå', scenarioKey: 'weather' },
  { label: 'Tall + karakter sammen', scenarioKey: 'both' },
];

export function Property() {
  return (
    <div className="prop">
      <div className="prop__noise" aria-hidden="true" />

      <Topbar />
      <Hero />
      <KeyFacts />
      <AskPanel />
      <AutoSections />
      <CoordinatesFooter />
    </div>
  );
}

function Topbar() {
  return (
    <header className="prop__topbar">
      <button type="button" className="prop__back">
        <span aria-hidden="true">←</span> Søk i eiendommer
      </button>
      <div className="prop__brand">
        <span className="prop__brandMark" aria-hidden="true">
          ◐
        </span>
        Eiendom
        <span className="prop__brandFaint">/ register D</span>
      </div>
      <div className="prop__topActions">
        <button type="button" className="prop__iconBtn" aria-label="Save">
          <span aria-hidden="true">♡</span> Lagre
        </button>
        <button type="button" className="prop__iconBtn" aria-label="Share">
          <span aria-hidden="true">↗</span> Del
        </button>
        <button type="button" className="prop__primaryBtn">
          Kontakt megler
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const locality = SEEDED_MATCH.address.split(',').slice(1).join(',').trim();
  return (
    <section className="prop__hero" aria-label="Eiendom-hero">
      <div className="prop__heroFrame">
        <div className="prop__heroPhoto" aria-hidden="true">
          <div className="prop__heroPhotoLabel">ingen offentlig foto · åpen-data-demo</div>
        </div>
        <div className="prop__heroOverlay">
          <div className="prop__heroKicker">
            <span className="prop__heroDot" aria-hidden="true" />
            Verifisert · Kartverket
          </div>
          <h1 className="prop__heroTitle">{SEEDED_MATCH.address.split(',')[0]}</h1>
          <div className="prop__heroLocality">
            {locality} · Frogner <span className="prop__heroSep">·</span>{' '}
            <span className="prop__heroMute">Hydroparken</span>
          </div>
          <div className="prop__heroMeta">
            <span>Eiendom #</span>
            <span className="prop__mono">{formatMatrikkel(SEEDED_MATCH.matrikkel)}</span>
            <span aria-hidden="true">·</span>
            <span>Lagt ut i åpen-data-demo · 2025·05·28</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function KeyFacts() {
  return (
    <section className="prop__facts" aria-label="Nøkkelfakta">
      <Fact label="Kommune" big={SEEDED_MATCH.kommunenavn} small={SEEDED_MATCH.kommunenr} />
      <Fact
        label="Matrikkel"
        big={formatMatrikkel(SEEDED_MATCH.matrikkel)}
        small="kom·gnr·bnr·snr"
        mono
      />
      <Fact label="Postnummer" big="0250" small="Frogner / Skillebekk" />
      <Fact label="Type" big="Bygård" small="utledet fra åpne data" />
    </section>
  );
}

function Fact({
  label,
  big,
  small,
  mono,
}: {
  label: string;
  big: string;
  small: string;
  mono?: boolean;
}) {
  return (
    <div className="prop__fact">
      <div className="prop__factLabel">{label}</div>
      <div className={`prop__factBig ${mono ? 'prop__mono' : ''}`}>{big}</div>
      <div className="prop__factSmall">{small}</div>
    </div>
  );
}

function AutoSections() {
  return (
    <section className="prop__sections" aria-label="Eiendomskunnskap">
      <SectionHeader kicker="Om eiendommen" title="Auto-utfylt fra åpne kilder" />
      <div className="prop__sectionGrid">
        {AUTO_SECTIONS.map((s) => (
          <AutoSection key={s.key} section={s} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="prop__sectionHeader">
      <div className="prop__sectionKicker">{kicker}</div>
      <h2 className="prop__sectionTitle">{title}</h2>
      <div className="prop__sectionRule" aria-hidden="true" />
    </div>
  );
}

function AutoSection({ section }: { section: AutoSection }) {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [totalMs, setTotalMs] = useState<number>(0);

  useEffect(() => {
    const started = performance.now();
    const handle = window.setTimeout(() => {
      setTotalMs(Math.round(performance.now() - started));
      setResponse(FIXTURES[section.key]);
    }, section.delayMs);
    return () => window.clearTimeout(handle);
  }, [section.delayMs, section.key]);

  if (!response) {
    return (
      <article className="prop__card prop__card--loading">
        <div className="prop__cardKicker">{section.kicker}</div>
        <div className="prop__cardTitle">{section.title}</div>
        <div className="prop__skeletonLine" />
        <div className="prop__skeletonLine prop__skeletonLine--short" />
        <div className="prop__skeletonLine" />
        <div className="prop__cardFoot">
          <span className="prop__loadingDot" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>{' '}
          henter fra åpne kilder…
        </div>
      </article>
    );
  }

  return (
    <article className="prop__card prop__card--in">
      <div className="prop__cardKicker">{section.kicker}</div>
      <div className="prop__cardTitle">{section.title}</div>
      <p className="prop__cardBody">{stripAddressLead(response.answer)}</p>
      <div className="prop__cardFoot">
        <div className="prop__chips">
          {response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="prop__cardMeta">
          <GroundedTick grounded={response.grounded} />
          <span className="prop__cardTime prop__mono">{totalMs} ms</span>
        </div>
      </div>
    </article>
  );
}

function AskPanel() {
  const [active, setActive] = useState<Turn | null>(null);
  const [pending, setPending] = useState<ScenarioKey | null>(null);
  const turnSeq = useRef(0);

  function ask(scenarioKey: ScenarioKey, question: string) {
    if (pending) return;
    setActive(null);
    setPending(scenarioKey);
    const id = `t${++turnSeq.current}`;
    const started = performance.now();
    window.setTimeout(() => {
      const totalMs = Math.round(performance.now() - started);
      setActive({
        id,
        question,
        scenarioKey,
        response: FIXTURES[scenarioKey],
        totalMs,
        startedAt: started,
      });
      setPending(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  return (
    <section className="prop__askWrap" aria-label="Spør agenten">
      <SectionHeader kicker="Spør om eiendommen" title="Drevet av Eiendomsinfo-agenten" />

      <div className="prop__askIntro">
        Klikk et spørsmål — eller skriv ditt eget. Agenten svarer kun fra åpne kilder. Når et
        spørsmål ikke kan svares ærlig, sier den fra.
      </div>

      <div className="prop__chipRow">
        {CHIPS.map((q) => (
          <button
            key={q.label}
            type="button"
            className={`prop__chipBtn ${pending ? 'prop__chipBtn--disabled' : ''} ${
              active?.scenarioKey === q.scenarioKey ? 'prop__chipBtn--active' : ''
            }`}
            onClick={() => ask(q.scenarioKey, q.label)}
            disabled={pending !== null}
          >
            <span className="prop__chipIcon" aria-hidden="true">
              {q.scenarioKey === 'refusal' ? '◌' : '◆'}
            </span>
            {q.label}
          </button>
        ))}
      </div>

      <AnswerSlot active={active} pending={pending} />
    </section>
  );
}

function AnswerSlot({ active, pending }: { active: Turn | null; pending: ScenarioKey | null }) {
  if (pending) {
    return (
      <article className="prop__answer prop__answer--loading">
        <div className="prop__answerBar">
          <span className="prop__answerKicker">Agenten leter…</span>
          <span className="prop__loadingDot" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className="prop__skeletonLine" />
        <div className="prop__skeletonLine prop__skeletonLine--short" />
      </article>
    );
  }

  if (!active) {
    return (
      <article className="prop__answerHint">
        <span className="prop__answerHintIcon" aria-hidden="true">
          ◇
        </span>
        Svaret vises her — med kilder, og en grunnet-statusmerking.
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
  const totalActs = 1 + runSteps.length + 1;
  const visible = useChoreography(totalActs, REVEAL_MS);

  return (
    <article className="prop__answer prop__answer--grounded">
      <header className="prop__answerHeader">
        <div className="prop__answerKicker">Spurt</div>
        <div className="prop__answerQ">{turn.question}</div>
      </header>

      <div className={`prop__answerPlan ${visible >= 1 ? 'prop__answerStep--in' : ''}`}>
        <span className="prop__planLabel">Plan</span>
        {turn.response.plan?.steps.map((s) => (
          <span
            key={`${s.tool}-${('metric' in s && s.metric) || ('query' in s && s.query) || 'k'}`}
            className="prop__planTool"
          >
            {prettyTool(s.tool)}
          </span>
        ))}
      </div>

      {runSteps.map((step, i) => (
        <div
          key={`${step.step}-${step.tool}`}
          className={`prop__answerStep ${visible >= 2 + i ? 'prop__answerStep--in' : ''}`}
        >
          <span className="prop__stepDot" aria-hidden="true" />
          <span className="prop__stepText">
            Hentet fra <strong>{prettySource(step.tool)}</strong>
          </span>
          <span className={`prop__stepStatus prop__stepStatus--${step.ok ? 'ok' : 'soft'}`}>
            {step.ok ? 'ok' : 'unavailable'}
          </span>
        </div>
      ))}

      <p
        className={`prop__answerBody ${
          visible >= 1 + runSteps.length + 1 ? 'prop__answerStep--in' : ''
        }`}
      >
        {stripAddressLead(turn.response.answer)}
      </p>

      <footer
        className={`prop__answerFoot ${
          visible >= 1 + runSteps.length + 1 ? 'prop__answerStep--in' : ''
        }`}
      >
        <div className="prop__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="prop__cardMeta">
          <GroundedTick grounded={turn.response.grounded} />
          <span className="prop__cardTime prop__mono">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function RefusalAnswer({ turn }: { turn: Turn }) {
  const reason = turn.response.plan?.outOfScope?.reason ?? '';
  return (
    <article className="prop__answer prop__answer--refusal">
      <header className="prop__answerHeader">
        <div className="prop__answerKicker prop__answerKicker--refusal">Ærlig avslag</div>
        <div className="prop__answerQ">{turn.question}</div>
      </header>

      <div className="prop__refusalLead">
        Dette spørsmålet kan ikke besvares fra de åpne kildene jeg har tilgang til.
      </div>

      <blockquote className="prop__refusalQuote">"{reason}."</blockquote>

      <div className="prop__refusalNeed">
        <span className="prop__refusalNeedLabel">For å svare trengs</span>
        <span className="prop__refusalNeedSrc prop__mono">hjemmelshaver · matrikkelregisteret</span>
      </div>

      <footer className="prop__answerFoot">
        <div className="prop__chips">
          {turn.response.citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="prop__cardMeta">
          <GroundedTick grounded={false} />
          <span className="prop__cardTime prop__mono">{turn.totalMs} ms</span>
        </div>
      </footer>
    </article>
  );
}

function CoordinatesFooter() {
  return (
    <section className="prop__coords" aria-label="Koordinater">
      <SectionHeader kicker="Plassering" title="Geografi" />
      <div className="prop__coordCard">
        <div className="prop__coordMap" aria-hidden="true">
          <svg viewBox="0 0 200 120" className="prop__coordSvg">
            <title>map sketch</title>
            <rect width="200" height="120" fill="#f4eee4" />
            <path d="M0 80 Q50 70 100 78 T200 75" stroke="#c7bda9" strokeWidth="0.8" fill="none" />
            <path d="M0 95 Q60 88 110 92 T200 90" stroke="#c7bda9" strokeWidth="0.6" fill="none" />
            <circle cx="100" cy="60" r="4" fill="#e85d4a" />
            <circle
              cx="100"
              cy="60"
              r="9"
              fill="none"
              stroke="#e85d4a"
              strokeWidth="0.8"
              opacity="0.45"
            />
          </svg>
        </div>
        <div className="prop__coordDetails">
          <div className="prop__coordKicker">WGS84 · representasjonspunkt</div>
          <div className="prop__coordValue prop__mono">
            {formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}
          </div>
          <div className="prop__coordHint">
            Slått opp via Kartverket. Agenten bruker dette punktet til å geoforankre vær og
            stedsbundne oppslag.
          </div>
        </div>
      </div>
    </section>
  );
}

function GroundedTick({ grounded }: { grounded: boolean }) {
  return (
    <span className={`prop__tick prop__tick--${grounded ? 'ok' : 'no'}`}>
      <span className="prop__tickGlyph" aria-hidden="true">
        {grounded ? '✓' : '◌'}
      </span>
      {grounded ? 'grunnet' : 'ikke grunnet'}
    </span>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <a className="prop__chip" href={c.url} target="_blank" rel="noopener noreferrer">
      <span className="prop__chipDot" aria-hidden="true" />
      <span className="prop__chipSource">{prettySource(c.source)}</span>
    </a>
  );
}

function stripAddressLead(s: string): string {
  // Auto-section bodies omit the "X ligger i kommune Y." preamble since the
  // address is already visible in the hero.
  return s.replace(/^Dronning Mauds gate 10, 0250 Oslo ligger i kommune \d+\.\s*/, '');
}

function prettySource(s: string): string {
  switch (s) {
    case 'kartverket':
      return 'Kartverket';
    case 'ssb':
      return 'SSB';
    case 'wikipedia':
      return 'Wikipedia';
    case 'met':
      return 'MET';
    case 'arxiv':
      return 'arXiv';
    default:
      return s;
  }
}

function prettyTool(t: string): string {
  return t.replace(/_/g, ' ');
}
