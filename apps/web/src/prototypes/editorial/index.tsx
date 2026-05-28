import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useChoreography } from '../../shared/choreography.ts';
import { FAKE_LATENCY_MS, FIXTURES } from '../../shared/fixtures.ts';
import { formatLatLon, formatMatrikkel, SEEDED_MATCH } from '../../shared/match.ts';
import { RAIL } from '../../shared/rail.ts';
import {
  type Citation,
  citationKey,
  type RoutingStep,
  routingStepKey,
  type ScenarioKey,
  type TraceStep,
  type Turn,
  traceStepKey,
} from '../../shared/types.ts';
import './styles.css';

const REVEAL_MS = 360;

export function Editorial() {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<{
    id: string;
    scenarioKey: ScenarioKey;
    question: string;
  } | null>(null);
  // Accordion: at most one turn expanded at a time. null = all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const turnSeq = useRef(0);

  function ask(question: string, scenarioKey: ScenarioKey | null) {
    if (!scenarioKey || pending) return;
    const id = `t${++turnSeq.current}`;
    setPending({ id, scenarioKey, question });
    setDraft('');
    const started = performance.now();
    window.setTimeout(() => {
      const totalMs = Math.round(performance.now() - started);
      setTurns((prev) => [
        ...prev,
        { id, question, scenarioKey, response: FIXTURES[scenarioKey], totalMs, startedAt: started },
      ]);
      setExpandedId(id); // newest answer opens; collapses the previous one
      setPending(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  return (
    <div className="ed">
      <div className="ed__paperGrain" aria-hidden="true" />

      <header className="ed__masthead">
        <div className="ed__masterLeft">
          <span className="ed__nameplate">Eiendomsregisteret</span>
          <span className="ed__nameplateDot" aria-hidden="true">
            ·
          </span>
          <span className="ed__edition">Eiendomsinfo-agent · register B</span>
        </div>
        <div className="ed__masterRight">Utgave 01 · En leserutgave</div>
      </header>

      <article className="ed__article">
        <Dateline />

        <section className="ed__transcript">
          {turns.length === 0 && !pending && <EmptyState />}

          {turns.map((turn, idx) => (
            <ArticleTurn
              key={turn.id}
              turn={turn}
              collapsed={turn.id !== expandedId}
              onToggle={() => setExpandedId((cur) => (cur === turn.id ? null : turn.id))}
              footnoteOffset={turns
                .slice(0, idx)
                .reduce((acc, t) => acc + t.response.citations.length, 0)}
              turnIndex={idx + 1}
            />
          ))}

          {pending && <PendingArticle question={pending.question} />}
        </section>

        <footer className="ed__inputBlock">
          <div className="ed__readerKicker">Din tur</div>
          <div className="ed__inputRow">
            <input
              className="ed__input"
              placeholder="Still agenten et nytt spørsmål…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim() && !pending) {
                  ask(draft.trim(), 'population');
                }
              }}
              disabled={pending !== null}
            />
            <button
              type="button"
              className="ed__sendBtn"
              onClick={() => ask(draft.trim() || 'Hva er folketallet her?', 'population')}
              disabled={pending !== null || !draft.trim()}
            >
              Spør →
            </button>
          </div>
          {pending && <div className="ed__progressStrip" />}
        </footer>
      </article>

      <aside className="ed__rail" aria-label="Foreslåtte spørsmål">
        <div className="ed__railKicker">Fra denne eiendommen</div>
        <div className="ed__railRule" aria-hidden="true" />
        <ol className="ed__railList">
          {RAIL.map((item, i) => (
            <li key={item.label}>
              <button
                type="button"
                className={`ed__railItem ${item.scenarioKey ? '' : 'ed__railItem--inert'}`}
                onClick={() => {
                  setDraft(item.question);
                  ask(item.question, item.scenarioKey);
                }}
                disabled={pending !== null}
              >
                <span className="ed__railNum">№ {i + 1}</span>
                <span className="ed__railLabel">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="ed__railFootnote">
          <div className="ed__railKicker">Grensetilfeller</div>
          <div className="ed__railRule" aria-hidden="true" />
          <button type="button" className="ed__railEdge" disabled>
            <em>Tvetydig adresse</em> · bytter til Storgata
          </button>
          <button type="button" className="ed__railEdge" disabled>
            <em>Ingen treff</em> · bytter til en tøyseadresse
          </button>
        </div>
      </aside>
    </div>
  );
}

function Dateline() {
  return (
    <header className="ed__dateline">
      <div className="ed__datelineKicker">Eiendom i fokus · slått opp av Kartverket</div>
      <h1 className="ed__datelineAddress">{SEEDED_MATCH.address.split(',')[0]}</h1>
      <div className="ed__datelineLocality">
        {SEEDED_MATCH.address.split(',').slice(1).join(',').trim()}
      </div>

      <dl className="ed__datelineMeta">
        <DLPair label="Kommune">
          <span className="ed__mono">{SEEDED_MATCH.kommunenr}</span>
          <span className="ed__metaSecondary">{SEEDED_MATCH.kommunenavn}</span>
        </DLPair>
        <DLPair label="Matrikkel">
          <span className="ed__mono">{formatMatrikkel(SEEDED_MATCH.matrikkel)}</span>
        </DLPair>
        <DLPair label="Koordinater">
          <span className="ed__mono">{formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}</span>
        </DLPair>
      </dl>

      <div className="ed__datelineActions">
        <button type="button" className="ed__textLink">
          endre adresse
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" className="ed__textLink">
          nullstill samtale
        </button>
      </div>
    </header>
  );
}

function DLPair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ed__dlPair">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ed__empty">
      <div className="ed__emptyKicker">En innledende merknad</div>
      <p className="ed__emptyBody">
        Agenten svarer på spørsmål om eiendommen over ved å rute mellom strukturerte offentlige data
        (Kartverket, SSB, Meteorologisk institutt) og ustrukturerte uthentere (Wikipedia, arXiv).
        Hver påstand er kildebelagt. Der ingen kilde passer — eierskap, heftelser — avslår den, helt
        rett ut.
      </p>
      <p className="ed__emptyHint">Velg et spørsmål fra spalten til høyre for å starte.</p>
    </div>
  );
}

function PendingArticle({ question }: { question: string }) {
  return (
    <section className="ed__turn ed__turn--pending">
      <p className="ed__turnKicker">Et spørsmål, stilt</p>
      <h2 className="ed__turnHeadline">{question}</h2>
      <p className="ed__pendingLine">
        <em>Agenten ruter gjennom kildene sine…</em>
        <span className="ed__pendingDots">
          <span />
          <span />
          <span />
        </span>
      </p>
    </section>
  );
}

function ArticleTurn({
  turn,
  collapsed,
  onToggle,
  footnoteOffset,
  turnIndex,
}: {
  turn: Turn;
  collapsed: boolean;
  onToggle: () => void;
  footnoteOffset: number;
  turnIndex: number;
}) {
  const bodyId = `ed-turn-${turn.id}`;
  return (
    <section className={`ed__turn ${collapsed ? 'ed__turn--collapsed' : ''}`}>
      <p className="ed__turnKicker">
        Runde № {turnIndex} {turn.response.grounded ? '· grunnet' : '· avslått'}
      </p>
      <h2 className="ed__turnHeadline">
        <button
          type="button"
          className="ed__turnToggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
        >
          <span className="ed__turnMarker" aria-hidden="true" />
          <span className="ed__turnHeadlineText">{turn.question}</span>
        </button>
      </h2>

      <div id={bodyId}>
        {collapsed ? (
          <CollapsedArticle turn={turn} footnoteOffset={footnoteOffset} />
        ) : (
          <ExpandedArticle turn={turn} footnoteOffset={footnoteOffset} />
        )}
      </div>
    </section>
  );
}

function CollapsedArticle({ turn, footnoteOffset }: { turn: Turn; footnoteOffset: number }) {
  return (
    <div className="ed__collapsed">
      <p className="ed__bodyLeader">
        {turn.response.answer}
        <FootnoteMarkers count={turn.response.citations.length} offset={footnoteOffset} />
      </p>
      <p className="ed__collapsedHint">
        <em>Sammenfoldet.</em> Klikk overskriften for å utvide sporingen igjen.
      </p>
    </div>
  );
}

function ExpandedArticle({ turn, footnoteOffset }: { turn: Turn; footnoteOffset: number }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  const totalActs = 1 + runSteps.length + 1;
  const visible = useChoreography(totalActs, REVEAL_MS);

  return (
    <div className="ed__expanded">
      <section className={`ed__plan ${visible >= 1 ? 'ed__plan--in' : ''}`}>
        <p className="ed__sectionKicker">Planen</p>
        {turn.response.plan?.outOfScope ? (
          <Refusal reason={turn.response.plan.outOfScope.reason} />
        ) : (
          <PlanRow steps={turn.response.plan?.steps ?? []} />
        )}
      </section>

      {runSteps.length > 0 && (
        <section className={`ed__run ${visible >= 2 ? 'ed__run--in' : ''}`}>
          <p className="ed__sectionKicker">Kjøringen</p>
          <ol className="ed__runList">
            {runSteps.map((step, i) => (
              <RunRow
                key={traceStepKey(step)}
                step={step}
                visible={visible >= 2 + i}
                index={i + 1}
              />
            ))}
          </ol>
        </section>
      )}

      <section
        className={`ed__answer ${visible >= 1 + runSteps.length + 1 ? 'ed__answer--in' : ''}`}
      >
        <p className="ed__sectionKicker">Svaret</p>
        <p className="ed__bodyLeader">
          {turn.response.answer}
          <FootnoteMarkers count={turn.response.citations.length} offset={footnoteOffset} />
        </p>
        <div className="ed__answerMeta">
          <span className="ed__groundedAnnotation">
            {turn.response.grounded ? 'grunnet' : 'ikke grunnet'} · returnert på {turn.totalMs} ms
          </span>
        </div>

        {turn.response.citations.length > 0 && (
          <ol className="ed__endnotes">
            {turn.response.citations.map((c, i) => (
              <li key={citationKey(c)} value={footnoteOffset + i + 1}>
                <SourceLine c={c} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Refusal({ reason }: { reason: string }) {
  return (
    <blockquote className="ed__refusal">
      <span className="ed__refusalRule" aria-hidden="true" />
      <p className="ed__refusalLead">
        Dette kan jeg ikke svare på fra kildene jeg har tilgang til.
      </p>
      <p className="ed__refusalQuote">"{reason}."</p>
      <footer className="ed__refusalAttribution">— agentens avslag</footer>
      <span className="ed__refusalRule" aria-hidden="true" />
    </blockquote>
  );
}

function PlanRow({ steps }: { steps: RoutingStep[] }) {
  if (steps.length === 0) {
    return <p className="ed__planEmpty">— ingen verktøy planlagt —</p>;
  }
  return (
    <ul className="ed__planList">
      {steps.map((step) => (
        <li key={routingStepKey(step)} className="ed__planItem">
          <span className="ed__planTool">{step.tool}</span>
          {'metric' in step && <span className="ed__planArg">· metrikk: {step.metric}</span>}
          {'query' in step && <span className="ed__planArg">· søk: {step.query}</span>}
        </li>
      ))}
    </ul>
  );
}

function RunRow({ step, visible, index }: { step: TraceStep; visible: boolean; index: number }) {
  return (
    <li className={`ed__runItem ${visible ? 'ed__runItem--in' : ''}`}>
      <span className="ed__runIndex">№ {index}</span>
      <span className="ed__runTool ed__mono">{step.tool}</span>
      <span className="ed__runInput ed__mono">{summariseInput(step.input)}</span>
      <span className={`ed__runStatus ${step.ok ? '' : 'ed__runStatus--degraded'}`}>
        {step.ok ? 'svar ok' : 'utilgjengelig'}
      </span>
    </li>
  );
}

function FootnoteMarkers({ count, offset }: { count: number; offset: number }) {
  if (count === 0) return null;
  const numbers = Array.from({ length: count }, (_, i) => offset + i + 1);
  return (
    <sup className="ed__sup">
      {numbers.map((n, i) => (
        <span key={n}>
          {i > 0 && <span className="ed__supSep">,</span>}
          {n}
        </span>
      ))}
    </sup>
  );
}

function SourceLine({ c }: { c: Citation }) {
  return (
    <span className="ed__sourceLine">
      <span className="ed__sourceName">{sourceDisplayName(c.source)}.</span>{' '}
      {c.field && <span className="ed__sourceField ed__mono">{c.field}.</span>}{' '}
      <a className="ed__sourceUrl ed__mono" href={c.url} target="_blank" rel="noopener noreferrer">
        {c.url}
      </a>
    </span>
  );
}

function sourceDisplayName(s: string): string {
  switch (s) {
    case 'kartverket':
      return 'Kartverket';
    case 'ssb':
      return 'Statistisk sentralbyrå';
    case 'wikipedia':
      return 'Wikipedia (no.)';
    case 'met':
      return 'MET — Meteorologisk institutt';
    case 'arxiv':
      return 'arXiv';
    default:
      return s;
  }
}

function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '—';
  return entries
    .map(([k, v]) => `${k}=${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join(', ');
}
