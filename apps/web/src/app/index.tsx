import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import '../prototypes/editorial/styles.css';
import { useChoreography } from '../shared/choreography.ts';
import { formatLatLon, formatMatrikkel } from '../shared/match.ts';
import { RAIL } from '../shared/rail.ts';
import {
  type Citation,
  citationKey,
  type Match,
  type QueryResponse,
  type RoutingStep,
  routingStepKey,
  type TraceStep,
  traceStepKey,
} from '../shared/types.ts';
import { postQuery, type QueryResult, type Resolution, readResolution } from './api.ts';
import './styles.css';

const REVEAL_MS = 360;

const SEED_ADDRESS = 'Dronning Mauds gate 10, 0250 Oslo';
const SEED_QUESTION = 'Hva er folketallet i denne kommunen?';

type EdgeCase = { address: string; question: string };
const EDGE_AMBIGUOUS: EdgeCase = { address: 'Storgata', question: 'Hva er folketallet her?' };
const EDGE_NO_MATCH: EdgeCase = {
  address: 'Tøyseveien 999, 9999 Ingenmannsland',
  question: 'Hva er folketallet her?',
};

type Turn =
  | {
      id: string;
      question: string;
      kind: 'ok';
      response: QueryResponse;
      totalMs: number;
      addressUsed: string;
    }
  | {
      id: string;
      question: string;
      kind: 'error';
      error: Exclude<QueryResult, { kind: 'ok' }>;
      addressUsed: string;
    };

export function EditorialApp() {
  const [address, setAddress] = useState(SEED_ADDRESS);
  const [match, setMatch] = useState<Match | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<{ id: string; question: string } | null>(null);
  // Accordion: at most one turn expanded at a time. null = all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const turnSeq = useRef(0);
  const inFlight = useRef<AbortController | null>(null);
  const didMount = useRef(false);

  async function ask(question: string, overrides?: { address?: string; match?: Match | null }) {
    inFlight.current?.abort();
    const ctrl = new AbortController();
    inFlight.current = ctrl;

    const id = `t${++turnSeq.current}`;
    const addressUsed = overrides?.address ?? address;
    const matchUsed =
      overrides?.match === null ? undefined : (overrides?.match ?? match ?? undefined);
    setPending({ id, question });
    setDraft('');

    const result = await postQuery(
      { query: question, address: addressUsed, match: matchUsed },
      { signal: ctrl.signal },
    );

    if (ctrl.signal.aborted) return;
    inFlight.current = null;

    if (result.kind !== 'ok') {
      setTurns((prev) => [...prev, { id, question, kind: 'error', error: result, addressUsed }]);
      setExpandedId(id);
      setPending(null);
      return;
    }

    const res = readResolution(result.response);
    setResolution(res);
    if (res.kind === 'one') {
      setMatch(res.match);
      setAddress(res.match.address);
    } else if (res.kind === 'none' || res.kind === 'many' || res.kind === 'failed') {
      setMatch(null);
    }

    setTurns((prev) => [
      ...prev,
      { id, question, kind: 'ok', response: result.response, totalMs: result.totalMs, addressUsed },
    ]);
    setExpandedId(id); // newest answer opens; collapses the previous one
    setPending(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only seed query
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    void ask(SEED_QUESTION, { address: SEED_ADDRESS, match: null });
    // No cleanup: under React StrictMode the mount effect runs twice in dev,
    // and an abort() in the first pass's cleanup would kill the only fetch
    // we ever fire (the didMount guard blocks the second pass from re-firing).
  }, []);

  function startEditAddress() {
    setAddressDraft(address);
    setEditing(true);
  }

  function commitAddressEdit() {
    const next = addressDraft.trim();
    if (!next) return;
    setEditing(false);
    setAddress(next);
    setMatch(null);
    setResolution(null);
    setTurns([]);
    void ask(SEED_QUESTION, { address: next, match: null });
  }

  function cancelAddressEdit() {
    setEditing(false);
    setAddressDraft('');
  }

  function resetTranscript() {
    inFlight.current?.abort();
    setTurns([]);
    setPending(null);
  }

  function switchEdgeCase(edge: EdgeCase) {
    setEditing(false);
    setAddress(edge.address);
    setMatch(null);
    setResolution(null);
    setTurns([]);
    void ask(edge.question, { address: edge.address, match: null });
  }

  function pickCandidate(candidate: Match) {
    setEditing(false);
    setAddress(candidate.address);
    setMatch(candidate);
    setResolution({ kind: 'one', match: candidate });
    setTurns([]);
    void ask(SEED_QUESTION, { address: candidate.address, match: candidate });
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
          <span className="ed__edition">Eiendomsinfo-agent</span>
        </div>
        <div className="ed__masterRight">Utgave 01 · En leserutgave</div>
      </header>

      <article className="ed__article">
        <Dateline
          address={address}
          match={match}
          resolution={resolution}
          editing={editing}
          addressDraft={addressDraft}
          onStartEdit={startEditAddress}
          onChangeDraft={setAddressDraft}
          onCommit={commitAddressEdit}
          onCancel={cancelAddressEdit}
          onReset={resetTranscript}
          onPickCandidate={pickCandidate}
          canReset={turns.length > 0 || pending !== null}
        />

        <section className="ed__transcript">
          {turns.length === 0 && !pending && <EmptyState />}

          {turns.map((turn, idx) => (
            <TurnView
              key={turn.id}
              turn={turn}
              collapsed={turn.id !== expandedId}
              onToggle={() => setExpandedId((cur) => (cur === turn.id ? null : turn.id))}
              footnoteOffset={turns
                .slice(0, idx)
                .reduce((acc, t) => acc + (t.kind === 'ok' ? t.response.citations.length : 0), 0)}
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
                  void ask(draft.trim());
                }
              }}
              disabled={pending !== null}
            />
            <button
              type="button"
              className="ed__sendBtn"
              onClick={() => {
                const q = draft.trim();
                if (q) void ask(q);
              }}
              disabled={pending !== null || !draft.trim()}
            >
              Spør →
            </button>
          </div>
          {pending && <div className="ed__progressStrip" />}
        </footer>
      </article>

      <Rail
        pending={pending !== null}
        onPick={(question) => {
          setDraft(question);
          void ask(question);
        }}
        onEdgeCase={switchEdgeCase}
      />
    </div>
  );
}

function Dateline({
  address,
  match,
  resolution,
  editing,
  addressDraft,
  onStartEdit,
  onChangeDraft,
  onCommit,
  onCancel,
  onReset,
  onPickCandidate,
  canReset,
}: {
  address: string;
  match: Match | null;
  resolution: Resolution | null;
  editing: boolean;
  addressDraft: string;
  onStartEdit: () => void;
  onChangeDraft: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onReset: () => void;
  onPickCandidate: (m: Match) => void;
  canReset: boolean;
}) {
  const displayParts = address.split(',');
  const primary = displayParts[0]?.trim() ?? address;
  const locality = displayParts.slice(1).join(',').trim();

  return (
    <header className="ed__dateline">
      <div className="ed__datelineKicker">
        Eiendom i fokus ·{' '}
        {match ? 'slått opp av Kartverket' : resolution ? 'ikke entydig oppslag' : 'slår opp…'}
      </div>

      {editing ? (
        <div className="ed__addressEdit">
          <div className="ed__addressEditKicker">Endre adresse</div>
          <div className="ed__addressEditRow">
            <AddressInput
              value={addressDraft}
              onChange={onChangeDraft}
              onCommit={onCommit}
              onCancel={onCancel}
            />
            <button
              type="button"
              className="ed__addressEditBtn"
              onClick={onCommit}
              disabled={!addressDraft.trim()}
            >
              Slå opp
            </button>
            <button type="button" className="ed__addressEditCancel" onClick={onCancel}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="ed__datelineAddress">{primary}</h1>
          {locality && <div className="ed__datelineLocality">{locality}</div>}
        </>
      )}

      <ResolveNote resolution={resolution} onPick={onPickCandidate} />

      {match && (
        <dl className="ed__datelineMeta">
          <DLPair label="Kommune">
            <span className="ed__mono">{match.kommunenr}</span>
            <span className="ed__metaSecondary">{match.kommunenavn}</span>
          </DLPair>
          <DLPair label="Matrikkel">
            <span className="ed__mono">{formatMatrikkel(match.matrikkel)}</span>
          </DLPair>
          <DLPair label="Koordinater">
            <span className="ed__mono">{formatLatLon(match.lat, match.lon)}</span>
          </DLPair>
        </dl>
      )}

      {!editing && (
        <div className="ed__datelineActions">
          <button type="button" className="ed__textLink" onClick={onStartEdit}>
            endre adresse
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            className="ed__textLink"
            onClick={onReset}
            disabled={!canReset}
            style={canReset ? undefined : { opacity: 0.4, cursor: 'not-allowed' }}
          >
            nullstill samtale
          </button>
        </div>
      )}
    </header>
  );
}

function AddressInput({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="ed__addressEditInput"
      value={value}
      placeholder="Skriv full adresse …"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && value.trim()) onCommit();
        else if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

function ResolveNote({
  resolution,
  onPick,
}: {
  resolution: Resolution | null;
  onPick: (m: Match) => void;
}) {
  if (!resolution || resolution.kind === 'one' || resolution.kind === 'missing') return null;

  if (resolution.kind === 'failed') {
    return (
      <div className="ed__resolveNote" role="status">
        <div className="ed__resolveNoteHead">Adressetjenesten er nede</div>
        <p className="ed__resolveNoteBody">
          Kartverket svarte ikke. Prøv på nytt om et øyeblikk — eiendommen finnes, men oppslaget
          rakk ikke gjennom.
        </p>
      </div>
    );
  }

  if (resolution.kind === 'none') {
    return (
      <div className="ed__resolveNote" role="status">
        <div className="ed__resolveNoteHead">Ingen treff</div>
        <p className="ed__resolveNoteBody">
          Kartverket finner ingen adresse som matcher. Forsøk å skrive den ut fullt — gateadresse,
          postnummer, poststed.
        </p>
      </div>
    );
  }

  return (
    <div className="ed__resolveNote" role="status">
      <div className="ed__resolveNoteHead">{resolution.candidates.length} kandidater</div>
      <p className="ed__resolveNoteBody">
        Adressen er flertydig — flere treff hos Kartverket. Velg ett for å fortsette.
      </p>
      <ul className="ed__resolveList">
        {resolution.candidates.slice(0, 6).map((c) => (
          <li key={`${c.kommunenr}-${formatMatrikkel(c.matrikkel)}`}>
            <button type="button" className="ed__resolvePick" onClick={() => onPick(c)}>
              <span>{c.address}</span>
              <span className="ed__resolvePickKommune">
                {c.kommunenr} · {c.kommunenavn}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
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

function TurnHeadline({
  question,
  collapsed,
  onToggle,
  bodyId,
}: {
  question: string;
  collapsed: boolean;
  onToggle: () => void;
  bodyId: string;
}) {
  return (
    <h2 className="ed__turnHeadline">
      <button
        type="button"
        className="ed__turnToggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
      >
        <span className="ed__turnMarker" aria-hidden="true" />
        <span className="ed__turnHeadlineText">{question}</span>
      </button>
    </h2>
  );
}

function TurnView({
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
  if (turn.kind === 'error') {
    return (
      <ErrorTurn turn={turn} collapsed={collapsed} onToggle={onToggle} turnIndex={turnIndex} />
    );
  }
  const bodyId = `ed-turn-${turn.id}`;
  return (
    <section className={`ed__turn ${collapsed ? 'ed__turn--collapsed' : ''}`}>
      <p className="ed__turnKicker">
        Runde № {turnIndex} {turn.response.grounded ? '· grunnet' : '· avslått'}
      </p>
      <TurnHeadline
        question={turn.question}
        collapsed={collapsed}
        onToggle={onToggle}
        bodyId={bodyId}
      />

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

function ErrorTurn({
  turn,
  collapsed,
  onToggle,
  turnIndex,
}: {
  turn: Extract<Turn, { kind: 'error' }>;
  collapsed: boolean;
  onToggle: () => void;
  turnIndex: number;
}) {
  const detail =
    turn.error.kind === 'http-error'
      ? `HTTP ${turn.error.status} — ${turn.error.message}`
      : `Nettverksfeil — ${turn.error.message}`;
  const bodyId = `ed-turn-${turn.id}`;
  return (
    <section className={`ed__turn ${collapsed ? 'ed__turn--collapsed' : ''}`}>
      <p className="ed__turnKicker">Runde № {turnIndex} · feilet</p>
      <TurnHeadline
        question={turn.question}
        collapsed={collapsed}
        onToggle={onToggle}
        bodyId={bodyId}
      />
      {collapsed ? (
        <div className="ed__collapsed">
          <p className="ed__collapsedHint">
            <em>Sammenfoldet.</em> Klikk overskriften for å utvide feilmeldingen igjen.
          </p>
        </div>
      ) : (
        <div id={bodyId} className="ed__errorTurn">
          <div className="ed__errorKicker">Agenten kom ikke til kildene</div>
          <p className="ed__errorMsg">
            <em>Vi nådde ikke agenten denne gangen.</em> Sjekk at API-en kjører på port 3000, og
            prøv igjen.
          </p>
          <p className="ed__errorDetail">{detail}</p>
        </div>
      )}
    </section>
  );
}

function CollapsedArticle({
  turn,
  footnoteOffset,
}: {
  turn: Extract<Turn, { kind: 'ok' }>;
  footnoteOffset: number;
}) {
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

function ExpandedArticle({
  turn,
  footnoteOffset,
}: {
  turn: Extract<Turn, { kind: 'ok' }>;
  footnoteOffset: number;
}) {
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

function Rail({
  pending,
  onPick,
  onEdgeCase,
}: {
  pending: boolean;
  onPick: (question: string) => void;
  onEdgeCase: (edge: EdgeCase) => void;
}) {
  return (
    <aside className="ed__rail" aria-label="Foreslåtte spørsmål">
      <div className="ed__railKicker">Fra denne eiendommen</div>
      <div className="ed__railRule" aria-hidden="true" />
      <ol className="ed__railList">
        {RAIL.map((item, i) => (
          <li key={item.label}>
            <button
              type="button"
              className="ed__railItem"
              onClick={() => onPick(item.question)}
              disabled={pending}
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
        <button
          type="button"
          className="ed__railEdge"
          onClick={() => onEdgeCase(EDGE_AMBIGUOUS)}
          disabled={pending}
        >
          <em>Tvetydig adresse</em> · bytter til Storgata
        </button>
        <button
          type="button"
          className="ed__railEdge"
          onClick={() => onEdgeCase(EDGE_NO_MATCH)}
          disabled={pending}
        >
          <em>Ingen treff</em> · bytter til en tøyseadresse
        </button>
      </div>
    </aside>
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
