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

const REVEAL_MS = 320;

export function Cartographic() {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<{
    id: string;
    scenarioKey: ScenarioKey;
    question: string;
  } | null>(null);
  const turnSeq = useRef(0);

  function ask(question: string, scenarioKey: ScenarioKey | null) {
    if (!scenarioKey || pending) return;
    const id = `t${++turnSeq.current}`;
    setPending({ id, scenarioKey, question });
    setDraft('');
    const started = performance.now();
    window.setTimeout(() => {
      const totalMs = Math.round(performance.now() - started);
      const response = FIXTURES[scenarioKey];
      setTurns((prev) => [
        ...prev,
        { id, question, scenarioKey, response, totalMs, startedAt: started },
      ]);
      setPending(null);
    }, FAKE_LATENCY_MS[scenarioKey]);
  }

  const activeId = pending?.id ?? turns[turns.length - 1]?.id ?? null;

  return (
    <div className="cart">
      <div className="cart__paperGrain" aria-hidden="true" />

      <header className="cart__topbar">
        <div className="cart__brand">
          <div className="cart__brandMark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <title>compass</title>
              <circle
                cx="16"
                cy="16"
                r="14.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="0.4" />
              <path d="M16 2 L18 16 L16 30 L14 16 Z" fill="currentColor" opacity="0.85" />
              <path d="M2 16 L16 14 L30 16 L16 18 Z" fill="currentColor" opacity="0.45" />
              <text
                x="16"
                y="6.5"
                textAnchor="middle"
                fontSize="3.5"
                fontFamily="Inter"
                fill="currentColor"
              >
                N
              </text>
            </svg>
          </div>
          <div>
            <div className="cart__brandLabel">Eiendomsoppslag</div>
            <div className="cart__brandSub">Eiendomsinfo-agent · register A</div>
          </div>
        </div>
        <div className="cart__topbarMeta">
          <span className="cart__metaLabel">Dokument-id</span>
          <span className="cart__metaValue">EI-2025-0517-9024</span>
        </div>
      </header>

      <PropertyPanel />

      <main className="cart__main">
        <section className="cart__transcript" aria-label="Samtale">
          {turns.length === 0 && !pending && <EmptyState />}

          {turns.map((turn, idx) => (
            <TurnBlock
              key={turn.id}
              turn={turn}
              collapsed={turn.id !== activeId || idx !== turns.length - 1}
              turnNumber={idx + 1}
            />
          ))}

          {pending && <PendingTurn question={pending.question} scenarioKey={pending.scenarioKey} />}
        </section>

        <aside className="cart__rail" aria-label="Foreslåtte spørsmål">
          <div className="cart__railHeader">
            <span className="cart__sectionLabel">Forslag · foreslåtte spørsmål</span>
          </div>
          <ol className="cart__railList">
            {RAIL.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`cart__railItem ${item.scenarioKey ? '' : 'cart__railItem--inert'}`}
                  onClick={() => {
                    setDraft(item.question);
                    ask(item.question, item.scenarioKey);
                  }}
                  disabled={pending !== null}
                >
                  <span className="cart__railNum">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cart__railText">{item.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="cart__edgeBlock">
            <div className="cart__sectionLabel">Grensetilfeller · bytter eiendom</div>
            <button type="button" className="cart__edgeLink" disabled>
              · Tvetydig adresse (Storgata)
            </button>
            <button type="button" className="cart__edgeLink" disabled>
              · Ingen treff (tøyseadresse)
            </button>
          </div>
        </aside>
      </main>

      <footer className="cart__inputBar">
        <span className="cart__inputLabel">spørsmål</span>
        <input
          className="cart__input"
          placeholder="Still et spørsmål om eiendommen i fokus…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim() && !pending) {
              // Prototype: map any free typing to the population scenario.
              ask(draft.trim(), 'population');
            }
          }}
          disabled={pending !== null}
        />
        <button
          type="button"
          className="cart__sendBtn"
          onClick={() => ask(draft.trim() || 'Hva er folketallet her?', 'population')}
          disabled={pending !== null || !draft.trim()}
        >
          Send ↩
        </button>
        {pending && <div className="cart__progressStrip" />}
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="cart__empty">
      <div className="cart__sectionLabel">Klikk et forslag · velg et spørsmål</div>
      <p>
        Agenten svarer på spørsmål om eiendommen i fokus ved å rute mellom strukturerte verktøy
        (Kartverket, SSB, MET) og ustrukturerte uthentere (Wikipedia, arXiv). Hver påstand er
        kildebelagt. Der ingen kilde passer, avslår den ærlig.
      </p>
    </div>
  );
}

function PropertyPanel() {
  return (
    <section className="cart__property">
      <div className="cart__propStamp">
        <span className="cart__sectionLabel">Matrikkelutdrag</span>
        <span className="cart__propStampDate">Oppslag · Kartverket · 2025·05·28</span>
      </div>

      <div className="cart__propBody">
        <div className="cart__propAddressBlock">
          <div className="cart__propAddress">{SEEDED_MATCH.address.split(',')[0]}</div>
          <div className="cart__propAddressSub">
            {SEEDED_MATCH.address.split(',').slice(1).join(',').trim()}
          </div>
        </div>

        <div className="cart__propFields">
          <Field label="Kommune">
            <span className="cart__mono cart__monoBig">{SEEDED_MATCH.kommunenr}</span>
            <span className="cart__fieldSecondary">{SEEDED_MATCH.kommunenavn}</span>
          </Field>
          <Field label="Matrikkel">
            <span className="cart__mono cart__monoBig">
              {formatMatrikkel(SEEDED_MATCH.matrikkel)}
            </span>
            <span className="cart__fieldLegend">kommune · gnr · bnr · snr</span>
          </Field>
          <Field label="Koordinater">
            <span className="cart__mono cart__monoBig">
              {formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}
            </span>
            <span className="cart__fieldLegend">WGS84 · representasjonspunkt</span>
          </Field>
        </div>

        <div className="cart__propActions">
          <button type="button" className="cart__propBtn">
            endre adresse
          </button>
          <button type="button" className="cart__propBtn">
            nullstill samtale
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cart__field">
      <div className="cart__fieldLabel">{label}</div>
      <div className="cart__fieldValue">{children}</div>
    </div>
  );
}

function PendingTurn({ question }: { question: string; scenarioKey: ScenarioKey }) {
  return (
    <article className="cart__turn cart__turn--pending">
      <header className="cart__turnHeader">
        <span className="cart__sectionLabel">Spørsmål · venter</span>
        <span className="cart__turnQuestion">{question}</span>
      </header>
      <div className="cart__pendingPulse">
        <span className="cart__mono">ruter gjennom agenten…</span>
        <span className="cart__dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </article>
  );
}

function TurnBlock({
  turn,
  collapsed,
  turnNumber,
}: {
  turn: Turn;
  collapsed: boolean;
  turnNumber: number;
}) {
  return (
    <article className={`cart__turn ${collapsed ? 'cart__turn--collapsed' : ''}`}>
      <header className="cart__turnHeader">
        <span className="cart__sectionLabel">
          Spørsmål · runde {String(turnNumber).padStart(2, '0')}
        </span>
        <span className="cart__turnQuestion">{turn.question}</span>
      </header>

      {collapsed ? <CollapsedTurn turn={turn} /> : <ExpandedTurn turn={turn} />}
    </article>
  );
}

function CollapsedTurn({ turn }: { turn: Turn }) {
  return (
    <div className="cart__collapsed">
      <p className="cart__collapsedAnswer">{turn.response.answer}</p>
      <div className="cart__chips">
        {turn.response.citations.map((c) => (
          <CitationChip key={citationKey(c)} c={c} />
        ))}
        <Badge grounded={turn.response.grounded} />
      </div>
    </div>
  );
}

function ExpandedTurn({ turn }: { turn: Turn }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  const totalActs = 1 + runSteps.length + 1; // plan, each step, answer
  const visible = useChoreography(totalActs, REVEAL_MS);

  return (
    <div className="cart__expanded">
      <Act
        number={1}
        label="Rutingsplan"
        visible={visible >= 1}
        kind={turn.response.plan?.outOfScope ? 'refusal' : 'plan'}
      >
        {turn.response.plan?.outOfScope ? (
          <RefusalCard reason={turn.response.plan.outOfScope.reason} />
        ) : (
          <PlanRow steps={turn.response.plan?.steps ?? []} />
        )}
      </Act>

      {runSteps.length > 0 && (
        <Act number={2} label="Sporing" visible={visible >= 2} kind="run">
          <ul className="cart__steps">
            {runSteps.map((step, i) => (
              <StepRow key={traceStepKey(step)} step={step} visible={visible >= 2 + i} />
            ))}
          </ul>
        </Act>
      )}

      <Act
        number={runSteps.length > 0 ? 3 : 2}
        label="Svar"
        visible={visible >= 1 + runSteps.length + 1}
        kind="answer"
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
  kind,
  children,
}: {
  number: number;
  label: string;
  visible: boolean;
  kind: 'plan' | 'refusal' | 'run' | 'answer';
  children: ReactNode;
}) {
  return (
    <section className={`cart__act cart__act--${kind} ${visible ? 'cart__act--in' : ''}`}>
      <div className="cart__actKey">
        <span className="cart__actNum">{String(number).padStart(2, '0')}</span>
        <span className="cart__sectionLabel">{label}</span>
      </div>
      <div className="cart__actBody">{children}</div>
      <div className="cart__actCornerBL" aria-hidden="true" />
      <div className="cart__actCornerBR" aria-hidden="true" />
    </section>
  );
}

function PlanRow({ steps }: { steps: RoutingStep[] }) {
  return (
    <div className="cart__planRow">
      {steps.length === 0 ? (
        <span className="cart__planEmpty">— ingen verktøykall planlagt —</span>
      ) : (
        steps.map((step) => (
          <div key={routingStepKey(step)} className="cart__planTile">
            <span className="cart__planTileLabel">verktøy</span>
            <span className="cart__mono">{step.tool}</span>
            {'metric' in step && <span className="cart__planTileArg">metrikk · {step.metric}</span>}
            {'query' in step && <span className="cart__planTileArg">søk · {step.query}</span>}
          </div>
        ))
      )}
    </div>
  );
}

function RefusalCard({ reason }: { reason: string }) {
  return (
    <div className="cart__refusal">
      <div className="cart__refusalLabel">— utenfor omfang —</div>
      <p className="cart__refusalReason">{reason}.</p>
      <div className="cart__refusalFooter">
        <div className="cart__sectionLabel">Nødvendig kilde · ikke tilgjengelig</div>
        <div className="cart__mono cart__refusalSources">
          hjemmelshaver-register · matrikkelregisteret
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, visible }: { step: TraceStep; visible: boolean }) {
  const status = step.ok ? 'ok' : 'degraded';
  return (
    <li className={`cart__step cart__step--${status} ${visible ? 'cart__step--in' : ''}`}>
      <span className="cart__stepGlyph" aria-hidden="true">
        {step.ok ? '✓' : '◯'}
      </span>
      <span className="cart__stepTool cart__mono">{step.tool}</span>
      <span className="cart__stepInput cart__mono">{summariseInput(step.input)}</span>
      <span className="cart__stepStatus">{step.ok ? 'ok' : 'utilgjengelig'}</span>
    </li>
  );
}

function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '—';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join(' · ');
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
    <div className="cart__answer">
      <p className="cart__answerText">{answer}</p>
      <div className="cart__answerFoot">
        <div className="cart__chips">
          {citations.map((c) => (
            <CitationChip key={citationKey(c)} c={c} />
          ))}
        </div>
        <div className="cart__answerBadges">
          <Badge grounded={grounded} />
          <span className="cart__totalBadge cart__mono">
            <span className="cart__totalLabel">totalt</span> {totalMs} ms
          </span>
        </div>
      </div>
    </div>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <a className="cart__chip" href={c.url} target="_blank" rel="noopener noreferrer">
      <span className="cart__chipSource">{c.source}</span>
      {c.field && <span className="cart__chipField cart__mono">· {c.field}</span>}
    </a>
  );
}

function Badge({ grounded }: { grounded: boolean }) {
  return (
    <span className={`cart__groundedBadge cart__groundedBadge--${grounded ? 'ok' : 'no'}`}>
      <span className="cart__groundedDot" aria-hidden="true" />
      grunnet · {grounded ? 'ja' : 'nei'}
    </span>
  );
}
