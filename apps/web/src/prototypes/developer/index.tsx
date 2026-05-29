import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
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

const REVEAL_MS = 300;

export function Developer() {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<{
    id: string;
    scenarioKey: ScenarioKey;
    question: string;
  } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const turnSeq = useRef(0);

  function ask(question: string, scenarioKey: ScenarioKey | null) {
    if (!scenarioKey || pending) return;
    const id = `t${++turnSeq.current}`;
    setPending({ id, scenarioKey, question });
    setDraft('');
    setPaletteOpen(false);
    const started = performance.now();
    window.setTimeout(() => {
      const totalMs = Math.round(performance.now() - started);
      setTurns((prev) => [
        ...prev,
        { id, question, scenarioKey, response: FIXTURES[scenarioKey], totalMs, startedAt: started },
      ]);
      setPending(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeId = pending?.id ?? turns[turns.length - 1]?.id ?? null;

  return (
    <div className="dev">
      <div className="dev__grid" aria-hidden="true" />

      <header className="dev__topbar">
        <div className="dev__crumbs">
          <span className="dev__crumb dev__crumb--mute">agent</span>
          <span className="dev__crumbSep" aria-hidden="true">
            /
          </span>
          <span className="dev__crumb">dronning-mauds-gate-10</span>
          <span className="dev__crumbSep" aria-hidden="true">
            /
          </span>
          <span className="dev__crumb dev__crumb--mute">turns</span>
          <span className="dev__crumbCount">{turns.length}</span>
        </div>

        <div className="dev__topbarRight">
          <span className="dev__statusBar">
            <span className="dev__statusDot dev__statusDot--ok" /> api · localhost:3000
          </span>
          <button type="button" className="dev__kBtn" onClick={() => setPaletteOpen(true)}>
            <span className="dev__kbd">⌘</span>
            <span className="dev__kbd">K</span>
            <span>hurtigspørsmål</span>
          </button>
        </div>
      </header>

      <PropertyStrip />

      <main className="dev__main">
        <section className="dev__transcript" aria-label="Samtale">
          {turns.length === 0 && !pending && <EmptyState />}

          {turns.map((turn, idx) => (
            <TurnBlock
              key={turn.id}
              turn={turn}
              collapsed={turn.id !== activeId || idx !== turns.length - 1}
              turnIndex={idx + 1}
            />
          ))}

          {pending && <PendingBlock question={pending.question} />}
        </section>

        <aside className="dev__rail" aria-label="Kuraterte spørsmål">
          <div className="dev__railHeader">
            <span className="dev__sectionLabel">kuraterte_sporsmal</span>
            <span className="dev__sectionCount">{RAIL.length}</span>
          </div>
          <ol className="dev__railList">
            {RAIL.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`dev__railItem ${item.scenarioKey ? '' : 'dev__railItem--inert'}`}
                  onClick={() => {
                    setDraft(item.question);
                    ask(item.question, item.scenarioKey);
                  }}
                  disabled={pending !== null}
                >
                  <span className="dev__railIdx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="dev__railText">{item.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="dev__railEdge">
            <div className="dev__sectionLabel">grensetilfeller</div>
            <button type="button" className="dev__edgeBtn" disabled>
              <span className="dev__edgeArrow">↪</span> tvetydig (Storgata)
            </button>
            <button type="button" className="dev__edgeBtn" disabled>
              <span className="dev__edgeArrow">↪</span> ingen_treff (tøys)
            </button>
          </div>
        </aside>
      </main>

      <footer className="dev__inputBar">
        <span className="dev__inputPrompt">›</span>
        <input
          className="dev__input"
          placeholder='POST /query  {"query": "…", "address": "Dronning Mauds gate 10, 0250 Oslo"}'
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
          className="dev__sendBtn"
          onClick={() => ask(draft.trim() || 'Hva er folketallet her?', 'population')}
          disabled={pending !== null || !draft.trim()}
        >
          send <span className="dev__kbd dev__kbd--inline">⏎</span>
        </button>
        {pending && <div className="dev__progressStrip" />}
      </footer>

      {paletteOpen && (
        <CommandPalette onPick={(q, k) => ask(q, k)} onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  );
}

function PropertyStrip() {
  return (
    <section className="dev__property">
      <div className="dev__propCol">
        <div className="dev__propLabel">adresse</div>
        <div className="dev__propValue dev__propValue--lead">{SEEDED_MATCH.address}</div>
      </div>
      <div className="dev__propDivider" aria-hidden="true" />
      <div className="dev__propCol">
        <div className="dev__propLabel">kommune</div>
        <div className="dev__propValue dev__mono">
          <span className="dev__propStrong">{SEEDED_MATCH.kommunenr}</span>{' '}
          <span className="dev__propMute">{SEEDED_MATCH.kommunenavn}</span>
        </div>
      </div>
      <div className="dev__propDivider" aria-hidden="true" />
      <div className="dev__propCol">
        <div className="dev__propLabel">matrikkel</div>
        <div className="dev__propValue dev__mono">{formatMatrikkel(SEEDED_MATCH.matrikkel)}</div>
      </div>
      <div className="dev__propDivider" aria-hidden="true" />
      <div className="dev__propCol">
        <div className="dev__propLabel">lat,lon</div>
        <div className="dev__propValue dev__mono">
          {formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}
        </div>
      </div>
      <div className="dev__propActions">
        <button type="button" className="dev__propBtn">
          endre
        </button>
        <button type="button" className="dev__propBtn dev__propBtn--ghost">
          nullstill
        </button>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="dev__empty">
      <div className="dev__sectionLabel">— ingen_runder_enda</div>
      <p>
        Trykk <span className="dev__kbd dev__kbd--inline">⌘ K</span> for å åpne
        hurtigspørsmål-paletten, eller klikk et element i listen.
      </p>
      <p className="dev__emptyHint">
        Agenten ruter mellom fire verktøy og avslår ærlig når ingen kilde passer. Hver runde viser
        planen, sporingen og det grunnede svaret med kilder.
      </p>
    </div>
  );
}

function PendingBlock({ question }: { question: string }) {
  return (
    <article className="dev__turn dev__turn--pending">
      <header className="dev__turnHeader">
        <span className="dev__turnTag">venter</span>
        <span className="dev__turnQuestion">{question}</span>
      </header>
      <div className="dev__pendingBody">
        <span className="dev__mono dev__pendingLine">
          <span className="dev__pendingArrow">▸</span> POST /query …{' '}
          <span className="dev__cursor" />
        </span>
      </div>
    </article>
  );
}

function TurnBlock({
  turn,
  collapsed,
  turnIndex,
}: {
  turn: Turn;
  collapsed: boolean;
  turnIndex: number;
}) {
  return (
    <article className={`dev__turn ${collapsed ? 'dev__turn--collapsed' : ''}`}>
      <header className="dev__turnHeader">
        <span className="dev__turnTag">runde_{String(turnIndex).padStart(2, '0')}</span>
        <span className="dev__turnQuestion">{turn.question}</span>
        <span className="dev__turnHeaderRight">
          <StatusPill
            grounded={turn.response.grounded}
            refusal={Boolean(turn.response.plan?.outOfScope)}
          />
          <span className="dev__mono dev__totalChip">{turn.totalMs} ms</span>
        </span>
      </header>

      {collapsed ? <CollapsedTurn turn={turn} /> : <ExpandedTurn turn={turn} />}
    </article>
  );
}

function CollapsedTurn({ turn }: { turn: Turn }) {
  return (
    <div className="dev__collapsed">
      <p className="dev__collapsedAnswer">{turn.response.answer}</p>
      <div className="dev__collapsedChips">
        {turn.response.citations.map((c) => (
          <CitationChip key={citationKey(c)} c={c} />
        ))}
      </div>
    </div>
  );
}

function ExpandedTurn({ turn }: { turn: Turn }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  const totalActs = 1 + runSteps.length + 1;
  const visible = useChoreography(totalActs, REVEAL_MS);

  return (
    <div className="dev__expanded">
      <Act
        number="01"
        label="plan"
        visible={visible >= 1}
        variant={turn.response.plan?.outOfScope ? 'refusal' : 'plan'}
      >
        {turn.response.plan?.outOfScope ? (
          <RefusalCard
            reason={turn.response.plan.outOfScope.reason}
            grounded={turn.response.grounded}
            citationsCount={turn.response.citations.length}
            totalMs={turn.totalMs}
          />
        ) : (
          <PlanBlock steps={turn.response.plan?.steps ?? []} />
        )}
      </Act>

      {runSteps.length > 0 && (
        <Act number="02" label="sporing" visible={visible >= 2} variant="run">
          <ul className="dev__steps">
            {runSteps.map((step, i) => (
              <StepRow
                key={traceStepKey(step)}
                step={step}
                visible={visible >= 2 + i}
                index={i + 1}
              />
            ))}
          </ul>
        </Act>
      )}

      <Act
        number={runSteps.length > 0 ? '03' : '02'}
        label="svar"
        visible={visible >= 1 + runSteps.length + 1}
        variant="answer"
      >
        <AnswerCard
          answer={turn.response.answer}
          citations={turn.response.citations}
          grounded={turn.response.grounded}
          totalMs={turn.totalMs}
        />
      </Act>
    </div>
  );
}

function Act({
  number,
  label,
  visible,
  variant,
  children,
}: {
  number: string;
  label: string;
  visible: boolean;
  variant: 'plan' | 'refusal' | 'run' | 'answer';
  children: ReactNode;
}) {
  return (
    <section className={`dev__act dev__act--${variant} ${visible ? 'dev__act--in' : ''}`}>
      <div className="dev__actBar">
        <span className="dev__actNum">{number}</span>
        <span className="dev__actLabel">{label}</span>
        <span className="dev__actRule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function PlanBlock({ steps }: { steps: RoutingStep[] }) {
  return (
    <div className="dev__plan">
      <div className="dev__planLine dev__mono">
        <span className="dev__keyword">routing_plan</span>
        <span className="dev__punct">{' = '}</span>
        <span className="dev__punct">{'['}</span>
      </div>
      {steps.map((step, i) => (
        <div key={routingStepKey(step)} className="dev__planLine dev__mono dev__planLine--indented">
          <span className="dev__punct">{'  { '}</span>
          <span className="dev__propKey">tool</span>
          <span className="dev__punct">: </span>
          <span className="dev__string">"{step.tool}"</span>
          {'metric' in step && (
            <>
              <span className="dev__punct">, </span>
              <span className="dev__propKey">metric</span>
              <span className="dev__punct">: </span>
              <span className="dev__string">"{step.metric}"</span>
            </>
          )}
          {'query' in step && (
            <>
              <span className="dev__punct">, </span>
              <span className="dev__propKey">query</span>
              <span className="dev__punct">: </span>
              <span className="dev__string">"{step.query}"</span>
            </>
          )}
          <span className="dev__punct">{' }'}</span>
          {i < steps.length - 1 && <span className="dev__punct">,</span>}
        </div>
      ))}
      <div className="dev__planLine dev__mono">
        <span className="dev__punct">{']'}</span>
      </div>
    </div>
  );
}

function RefusalCard({
  reason,
  grounded,
  citationsCount,
  totalMs,
}: {
  reason: string;
  grounded: boolean;
  citationsCount: number;
  totalMs: number;
}) {
  return (
    <div className="dev__refusal">
      <div className="dev__refusalBar">
        <span className="dev__mono dev__refusalKey">router.out_of_scope</span>
        <StatusPill grounded={grounded} refusal />
      </div>
      <div className="dev__refusalBody">
        <div className="dev__refusalProp">
          <span className="dev__propKey dev__mono">reason</span>
          <span className="dev__punct dev__mono">:</span>
          <span className="dev__string dev__mono">"{reason}"</span>
        </div>
        <div className="dev__refusalProp">
          <span className="dev__propKey dev__mono">would_need</span>
          <span className="dev__punct dev__mono">:</span>
          <span className="dev__mono">
            <span className="dev__punct">[</span>
            <span className="dev__string">"hjemmelshaver"</span>
            <span className="dev__punct">, </span>
            <span className="dev__string">"matrikkelregisteret"</span>
            <span className="dev__punct">]</span>
          </span>
        </div>
      </div>
      <div className="dev__refusalFoot">
        <span className="dev__mono dev__refusalMeta">
          grounded: <span className="dev__grounded--no">false</span>
          {'   '}citations: {citationsCount}
          {'   '}total: {totalMs}ms
        </span>
      </div>
    </div>
  );
}

function StepRow({ step, visible, index }: { step: TraceStep; visible: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`dev__step ${visible ? 'dev__step--in' : ''}`}>
      <button type="button" className="dev__stepHead" onClick={() => setOpen((v) => !v)}>
        <span className="dev__stepIdx dev__mono">{String(index).padStart(2, '0')}</span>
        <span className="dev__mono dev__stepTool">{step.tool}</span>
        <span className="dev__mono dev__stepArrow">›</span>
        <span className="dev__mono dev__stepInput">{summariseInput(step.input)}</span>
        <span
          className={`dev__stepStatus ${step.ok ? 'dev__stepStatus--ok' : 'dev__stepStatus--degraded'}`}
        >
          {step.ok ? 'OK' : 'DEGRADERT'}
        </span>
        <span className={`dev__stepCaret ${open ? 'dev__stepCaret--open' : ''}`}>▾</span>
      </button>
      {open && (
        <pre className="dev__stepJson dev__mono">
          {JSON.stringify({ input: step.input, ok: step.ok, output: step.output }, null, 2)}
        </pre>
      )}
    </li>
  );
}

function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '{}';
  const inner = entries
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join(', ');
  return `{ ${inner} }`;
}

function AnswerCard({
  answer,
  citations,
  grounded,
  totalMs,
}: {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  totalMs: number;
}) {
  return (
    <div className="dev__answer">
      <div className="dev__answerBar">
        <span className="dev__mono dev__answerKey">response.answer</span>
        <span className="dev__mono dev__totalChip">{totalMs} ms</span>
      </div>
      <p className="dev__answerText">{answer}</p>
      <div className="dev__answerFoot">
        <div className="dev__chips">
          {citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <span className={`dev__groundedPill dev__groundedPill--${grounded ? 'ok' : 'no'}`}>
          grunnet · {String(grounded)}
        </span>
      </div>
    </div>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <a className="dev__chip" href={c.url} target="_blank" rel="noopener noreferrer">
      <span className="dev__chipDot" aria-hidden="true" />
      <span className="dev__chipSource">{c.source}</span>
      {c.field && (
        <>
          <span className="dev__chipSep">·</span>
          <span className="dev__chipField dev__mono">{c.field}</span>
        </>
      )}
    </a>
  );
}

function StatusPill({ grounded, refusal }: { grounded: boolean; refusal?: boolean }) {
  if (refusal) return <span className="dev__statusPill dev__statusPill--refused">AVSLÅTT</span>;
  return (
    <span className={`dev__statusPill dev__statusPill--${grounded ? 'ok' : 'degraded'}`}>
      {grounded ? 'OK' : 'DELVIS'}
    </span>
  );
}

function CommandPalette({
  onPick,
  onClose,
}: {
  onPick: (question: string, key: ScenarioKey | null) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = RAIL.filter((it) => it.label.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div
      className="dev__palette"
      role="dialog"
      aria-modal="true"
      aria-label="Hurtigspørsmål-palett"
    >
      <button
        type="button"
        className="dev__paletteBackdrop"
        aria-label="Lukk palett"
        onClick={onClose}
      />
      <div className="dev__paletteCard">
        <div className="dev__paletteHead">
          <span className="dev__mono dev__paletteCue">⌘K</span>
          <input
            ref={inputRef}
            className="dev__paletteInput"
            placeholder="søk i kuraterte spørsmål…"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, items.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = items[selected];
                if (item) onPick(item.question, item.scenarioKey);
              }
            }}
          />
          <button type="button" className="dev__paletteEsc" onClick={onClose}>
            esc
          </button>
        </div>
        <ul className="dev__paletteList">
          {items.map((item, i) => (
            <li key={item.label}>
              <button
                type="button"
                className={`dev__paletteItem ${i === selected ? 'dev__paletteItem--sel' : ''}`}
                onMouseEnter={() => setSelected(i)}
                onClick={() => item.scenarioKey && onPick(item.question, item.scenarioKey)}
                disabled={!item.scenarioKey}
              >
                <span className="dev__paletteIdx dev__mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="dev__paletteLabel">{item.label}</span>
                {item.scenarioKey === 'refusal' && (
                  <span className="dev__paletteTag dev__paletteTag--refusal">avslag</span>
                )}
                {item.scenarioKey === 'population' && (
                  <span className="dev__paletteTag dev__paletteTag--ok">grunnet</span>
                )}
                {item.scenarioKey === null && (
                  <span className="dev__paletteTag dev__paletteTag--mute">ikke i fixture</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="dev__paletteFoot dev__mono">
          <span>↑↓ naviger</span>
          <span>⏎ velg</span>
          <span>esc lukk</span>
        </div>
      </div>
    </div>
  );
}
