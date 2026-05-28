import type { ReactNode } from 'react';
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

const REVEAL_MS = 280;

type CellKey = ScenarioKey;

type Cell = {
  key: CellKey;
  label: string;
  metric: string;
  delayMs: number;
};

const CELLS: Cell[] = [
  { key: 'population', label: 'Demografi', metric: 'Folketall (siste)', delayMs: 500 },
  { key: 'weather', label: 'Forhold', metric: 'Vær nå', delayMs: 1_100 },
  { key: 'neighborhood', label: 'Områdeprofil', metric: 'Bydelens karakter', delayMs: 1_700 },
];

const ASK_OPTIONS: { label: string; scenarioKey: ScenarioKey }[] = [
  { label: 'Hvem eier denne eiendommen?', scenarioKey: 'refusal' },
  { label: 'Folketall + karakter sammen', scenarioKey: 'both' },
  { label: 'Befolkningstrend (3 år)', scenarioKey: 'population' },
  { label: 'Været ved eiendommen akkurat nå', scenarioKey: 'weather' },
];

export function Workspace() {
  return (
    <div className="ws">
      <Sidebar />
      <div className="ws__main">
        <Topbar />
        <PropertyHeader />
        <Tabs />
        <CellGrid />
        <AskPanel />
        <ActivityLog />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="ws__sidebar" aria-label="Arbeidsflate-navigasjon">
      <div className="ws__brand">
        <span className="ws__brandMark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <title>workspace logo</title>
            <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.7" />
            <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.4" />
            <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.4" />
            <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" />
          </svg>
        </span>
        <div className="ws__brandText">
          <div className="ws__brandName">Grunnboka</div>
          <div className="ws__brandPlan">arbeidsflate · register E</div>
        </div>
      </div>

      <nav className="ws__nav" aria-label="Primær">
        <NavSection title="Arbeidsflate">
          <NavItem label="Hjem" hint="oversikt" />
          <NavItem label="Portefølje" count="14" />
          <NavItem label="Sammenligninger" count="3" />
          <NavItem label="Lagrede søk" hint="2 nye" />
        </NavSection>

        <NavSection title="Nylige eiendommer">
          <NavItem label="Dronning Mauds g. 10" active />
          <NavItem label="Karl Johans gate 5" inert />
          <NavItem label="Storgata 35" inert />
          <NavItem label="Bygdøy allé 67" inert />
        </NavSection>

        <NavSection title="Agent">
          <NavItem label="Rutingsplaner" count="124" />
          <NavItem label="Avslagslogg" count="9" />
          <NavItem label="Kildehelse" hint="alle ok" healthy />
        </NavSection>
      </nav>

      <div className="ws__sidebarFoot">
        <div className="ws__userChip">
          <span className="ws__userInitials" aria-hidden="true">
            EG
          </span>
          <div className="ws__userMeta">
            <div className="ws__userName">Erland G.</div>
            <div className="ws__userRole">Analytiker · proptech</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ws__navSection">
      <div className="ws__navTitle">{title}</div>
      <ul className="ws__navList">{children}</ul>
    </div>
  );
}

function NavItem({
  label,
  hint,
  count,
  active,
  inert,
  healthy,
}: {
  label: string;
  hint?: string;
  count?: string;
  active?: boolean;
  inert?: boolean;
  healthy?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        className={`ws__navItem ${active ? 'ws__navItem--active' : ''} ${
          inert ? 'ws__navItem--inert' : ''
        }`}
      >
        <span className="ws__navLabel">{label}</span>
        {count && <span className="ws__navCount">{count}</span>}
        {hint && (
          <span className={`ws__navHint ${healthy ? 'ws__navHint--ok' : ''}`}>
            {healthy && <span className="ws__navHintDot" aria-hidden="true" />}
            {hint}
          </span>
        )}
      </button>
    </li>
  );
}

function Topbar() {
  return (
    <header className="ws__topbar">
      <div className="ws__crumbs">
        <span className="ws__crumb ws__crumb--mute">portefølje</span>
        <span className="ws__crumbSep" aria-hidden="true">
          /
        </span>
        <span className="ws__crumb ws__crumb--mute">Oslo</span>
        <span className="ws__crumbSep" aria-hidden="true">
          /
        </span>
        <span className="ws__crumb">Dronning Mauds gate 10</span>
      </div>
      <div className="ws__topActions">
        <button type="button" className="ws__topBtn">
          <span aria-hidden="true">↗</span> Eksporter PDF
        </button>
        <button type="button" className="ws__topBtn">
          <span aria-hidden="true">＋</span> Legg til notat
        </button>
        <button type="button" className="ws__topBtn ws__topBtn--primary">
          Sammenlign
        </button>
      </div>
    </header>
  );
}

function PropertyHeader() {
  return (
    <section className="ws__propHead">
      <div className="ws__propHeadLeft">
        <div className="ws__propKicker">
          <span className="ws__verifiedDot" aria-hidden="true" />
          Verifisert av Kartverket · slått opp 2025·05·28
        </div>
        <h1 className="ws__propTitle">Dronning Mauds gate 10</h1>
        <div className="ws__propLocality">
          {SEEDED_MATCH.address.split(',').slice(1).join(',').trim()} · Frogner
        </div>
      </div>

      <dl className="ws__propMeta">
        <MetaPair label="Kommune">
          <span className="ws__mono ws__metaStrong">{SEEDED_MATCH.kommunenr}</span>
          <span className="ws__metaSoft">{SEEDED_MATCH.kommunenavn}</span>
        </MetaPair>
        <MetaPair label="Matrikkel">
          <span className="ws__mono ws__metaStrong">{formatMatrikkel(SEEDED_MATCH.matrikkel)}</span>
        </MetaPair>
        <MetaPair label="Lat / Lon">
          <span className="ws__mono ws__metaStrong">
            {formatLatLon(SEEDED_MATCH.lat, SEEDED_MATCH.lon)}
          </span>
        </MetaPair>
        <MetaPair label="Status">
          <span className="ws__pill ws__pill--ok">aktiv</span>
        </MetaPair>
      </dl>
    </section>
  );
}

function MetaPair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ws__metaPair">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Tabs() {
  return (
    <nav className="ws__tabs" aria-label="Eiendomsvisninger">
      <button type="button" className="ws__tab ws__tab--active">
        Oversikt
      </button>
      <button type="button" className="ws__tab">
        Demografi
      </button>
      <button type="button" className="ws__tab">
        Klima
      </button>
      <button type="button" className="ws__tab">
        Områdeundersøkelse
      </button>
      <button type="button" className="ws__tab ws__tab--mute">
        Aktivitet
        <span className="ws__tabCount">12</span>
      </button>
    </nav>
  );
}

function CellGrid() {
  return (
    <section className="ws__cellGrid" aria-label="Eiendomsinnsikt">
      {CELLS.map((cell) => (
        <CellCard key={cell.key} cell={cell} />
      ))}
    </section>
  );
}

function CellCard({ cell }: { cell: Cell }) {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [totalMs, setTotalMs] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const handle = window.setTimeout(() => {
      setTotalMs(Math.round(performance.now() - started));
      setResponse(FIXTURES[cell.key]);
    }, cell.delayMs);
    return () => window.clearTimeout(handle);
  }, [cell.delayMs, cell.key]);

  return (
    <article className="ws__cell">
      <header className="ws__cellHead">
        <span className="ws__cellLabel">{cell.label}</span>
        <span
          className={`ws__cellStatus ${response ? 'ws__cellStatus--ok' : 'ws__cellStatus--load'}`}
        >
          {response ? (
            <>
              <span className="ws__cellStatusDot" aria-hidden="true" /> live
            </>
          ) : (
            'laster'
          )}
        </span>
      </header>

      <div className="ws__cellMetric">{cell.metric}</div>

      {response ? <CellBody cell={cell} response={response} totalMs={totalMs} /> : <CellSkeleton />}
    </article>
  );
}

function CellBody({
  cell,
  response,
  totalMs,
}: {
  cell: Cell;
  response: QueryResponse;
  totalMs: number;
}) {
  return (
    <div className="ws__cellBody ws__cellBody--in">
      {cell.key === 'population' && <PopulationVisual />}
      {cell.key === 'weather' && <WeatherVisual />}
      {cell.key === 'neighborhood' && <NeighborhoodVisual />}

      <p className="ws__cellSummary">{stripAddressLead(response.answer)}</p>

      <footer className="ws__cellFoot">
        <div className="ws__cellSources">
          {response.citations
            .filter((c) => c.source !== 'kartverket')
            .map((c) => (
              <SourceTag key={citationKey(c)} c={c} />
            ))}
        </div>
        <div className="ws__cellTime ws__mono">{totalMs} ms</div>
      </footer>
    </div>
  );
}

function PopulationVisual() {
  return (
    <div className="ws__viz">
      <div className="ws__vizPrimary">
        <span className="ws__vizNumber">717 710</span>
        <span className="ws__vizUnit">innbyggere · 2024</span>
      </div>
      <div className="ws__sparkline" aria-hidden="true">
        <svg viewBox="0 0 100 28" preserveAspectRatio="none">
          <title>population trend</title>
          <path
            d="M0 22 L25 18 L50 14 L75 8 L100 4"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx="100" cy="4" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="ws__vizTrend">
        <span className="ws__vizDelta">+1,22 %</span> vs. 2023
      </div>
    </div>
  );
}

function WeatherVisual() {
  return (
    <div className="ws__viz">
      <div className="ws__vizPrimary">
        <span className="ws__vizNumber">9 °C</span>
        <span className="ws__vizUnit">delvis skyet</span>
      </div>
      <div className="ws__weatherIcon" aria-hidden="true">
        <svg viewBox="0 0 36 36" width="36" height="36">
          <title>weather icon</title>
          <circle cx="14" cy="14" r="5" fill="#e0a23a" opacity="0.85" />
          <ellipse cx="22" cy="22" rx="11" ry="6" fill="#a8b0b8" opacity="0.92" />
          <ellipse cx="14" cy="24" rx="9" ry="5" fill="#c6cdd4" />
        </svg>
      </div>
      <div className="ws__vizTrend">
        <span className="ws__vizDelta ws__vizDelta--mute">0,4 mm</span> neste 6 t
      </div>
    </div>
  );
}

function NeighborhoodVisual() {
  return (
    <div className="ws__neighborGrid" aria-hidden="true">
      {[
        { label: 'Velstand', value: '8,2' },
        { label: 'Tetthet', value: '11,4 k/km²' },
        { label: 'Snittalder', value: '38' },
        { label: 'Ambassader', value: '12' },
      ].map((it) => (
        <div key={it.label} className="ws__neighborTile">
          <div className="ws__neighborValue">{it.value}</div>
          <div className="ws__neighborLabel">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function CellSkeleton() {
  return (
    <div className="ws__cellBody ws__cellBody--loading">
      <div className="ws__skelLine ws__skelLine--big" />
      <div className="ws__skelLine" />
      <div className="ws__skelLine ws__skelLine--short" />
    </div>
  );
}

function SourceTag({ c }: { c: Citation }) {
  return (
    <a className="ws__sourceTag" href={c.url} target="_blank" rel="noopener noreferrer">
      <span className="ws__sourceTagDot" aria-hidden="true" />
      <span className="ws__sourceTagText">{prettySource(c.source)}</span>
    </a>
  );
}

function AskPanel() {
  const [active, setActive] = useState<Turn | null>(null);
  const [pending, setPending] = useState<ScenarioKey | null>(null);
  const turnSeq = useRef(0);
  const [draft, setDraft] = useState('');

  function ask(scenarioKey: ScenarioKey, question: string) {
    if (pending) return;
    setPending(scenarioKey);
    setActive(null);
    setDraft('');
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
    <section className="ws__ask">
      <header className="ws__askHead">
        <div>
          <div className="ws__cellLabel">Spør agenten</div>
          <h2 className="ws__askTitle">Hva som helst om denne eiendommen</h2>
        </div>
        <div className="ws__askMeta ws__mono">
          <span>ruter →</span> kartverket · ssb · met · wikipedia · arxiv
        </div>
      </header>

      <div className="ws__askRow">
        <div className="ws__askInputWrap">
          <span className="ws__askPrompt ws__mono">?</span>
          <input
            className="ws__askInput"
            placeholder="f.eks. sammenlign folketall med andre Frogner-adresser"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim() && !pending) {
                ask('both', draft.trim());
              }
            }}
            disabled={pending !== null}
          />
        </div>
        <button
          type="button"
          className="ws__askBtn"
          disabled={pending !== null || !draft.trim()}
          onClick={() => ask('both', draft.trim() || 'Folketall og karakter')}
        >
          Kjør
          <span className="ws__kbd" aria-hidden="true">
            ⏎
          </span>
        </button>
      </div>

      <div className="ws__askSuggestRow">
        <span className="ws__askSuggestLabel">Lagrede søk</span>
        {ASK_OPTIONS.map((o) => (
          <button
            key={o.label}
            type="button"
            className={`ws__askSuggest ${pending ? 'ws__askSuggest--disabled' : ''} ${
              active?.scenarioKey === o.scenarioKey ? 'ws__askSuggest--active' : ''
            }`}
            disabled={pending !== null}
            onClick={() => ask(o.scenarioKey, o.label)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <AskResult active={active} pending={pending} />
    </section>
  );
}

function AskResult({ active, pending }: { active: Turn | null; pending: ScenarioKey | null }) {
  if (pending) {
    return (
      <div className="ws__askResult ws__askResult--loading">
        <div className="ws__skelLine ws__skelLine--big" />
        <div className="ws__skelLine" />
      </div>
    );
  }

  if (!active) {
    return (
      <div className="ws__askEmpty">
        <span className="ws__askEmptyGlyph" aria-hidden="true">
          ⌖
        </span>
        Svar vises her med rutingsplan, sporing per kilde og et grunnet-merke.
      </div>
    );
  }

  if (active.response.plan?.outOfScope) {
    return <RefusalResult turn={active} />;
  }

  return <GroundedResult turn={active} />;
}

function GroundedResult({ turn }: { turn: Turn }) {
  const runSteps = turn.response.trace.filter((s) => s.step !== 'resolve_address');
  const totalActs = 1 + runSteps.length + 1;
  const visible = useChoreography(totalActs, REVEAL_MS);

  return (
    <article className="ws__askResult ws__askResult--ok">
      <div className="ws__askResultBar">
        <span className="ws__cellLabel">Svar</span>
        <div className="ws__askResultBarRight">
          <span className="ws__pill ws__pill--ok">grunnet</span>
          <span className="ws__mono ws__totalChip">{turn.totalMs} ms</span>
        </div>
      </div>

      <div className={`ws__planRow ${visible >= 1 ? 'ws__planRow--in' : ''}`}>
        <span className="ws__planLabel">PLAN</span>
        {turn.response.plan?.steps.map((s) => (
          <span
            key={`${s.tool}-${('metric' in s && s.metric) || ('query' in s && s.query) || 'k'}`}
            className="ws__planTool ws__mono"
          >
            {s.tool}
          </span>
        ))}
      </div>

      <ol className="ws__traceList">
        {runSteps.map((step, i) => (
          <li
            key={`${step.step}-${step.tool}`}
            className={`ws__traceItem ${visible >= 2 + i ? 'ws__traceItem--in' : ''}`}
          >
            <span
              className={`ws__traceDot ws__traceDot--${step.ok ? 'ok' : 'soft'}`}
              aria-hidden="true"
            />
            <span className="ws__mono ws__traceTool">{step.tool}</span>
            <span className="ws__mono ws__traceInput">{summariseInput(step.input)}</span>
            <span className={`ws__pill ${step.ok ? 'ws__pill--ok' : 'ws__pill--soft'}`}>
              {step.ok ? 'ok' : 'delvis'}
            </span>
          </li>
        ))}
      </ol>

      <p
        className={`ws__resultText ${visible >= 1 + runSteps.length + 1 ? 'ws__resultText--in' : ''}`}
      >
        {stripAddressLead(turn.response.answer)}
      </p>

      <footer className="ws__resultFoot">
        <div className="ws__cellSources">
          {turn.response.citations.map((c) => (
            <SourceTag key={citationKey(c)} c={c} />
          ))}
        </div>
      </footer>
    </article>
  );
}

function RefusalResult({ turn }: { turn: Turn }) {
  const reason = turn.response.plan?.outOfScope?.reason ?? '';
  return (
    <article className="ws__askResult ws__askResult--refused">
      <div className="ws__askResultBar">
        <span className="ws__cellLabel">Svar</span>
        <div className="ws__askResultBarRight">
          <span className="ws__pill ws__pill--refused">avslått</span>
          <span className="ws__mono ws__totalChip">{turn.totalMs} ms</span>
        </div>
      </div>

      <div className="ws__refusalBlock">
        <div className="ws__refusalHead">
          <span className="ws__mono ws__refusalKey">router.out_of_scope</span>
        </div>
        <p className="ws__refusalReason">{reason}.</p>
        <div className="ws__refusalNeed">
          <span className="ws__refusalNeedLabel">Nødvendig kilde</span>
          <span className="ws__mono ws__refusalNeedSrc">hjemmelshaver · matrikkelregisteret</span>
        </div>
      </div>
    </article>
  );
}

type ActivityEntry = {
  id: string;
  when: string;
  who: 'agent' | 'system';
  what: string;
  meta?: string;
  tone?: 'ok' | 'refused' | 'mute';
};

const ACTIVITY: ActivityEntry[] = [
  {
    id: '1',
    when: '14:32',
    who: 'agent',
    what: 'Avslo eierskapsspørsmål',
    meta: 'router.out_of_scope · 1 kilde',
    tone: 'refused',
  },
  {
    id: '2',
    when: '14:28',
    who: 'agent',
    what: 'Løste folketall + nabolag',
    meta: 'ssb · wikipedia · 3 kilder',
    tone: 'ok',
  },
  {
    id: '3',
    when: '14:21',
    who: 'system',
    what: 'Værcache oppfrisket',
    meta: 'MET · last-modified 14:01',
    tone: 'mute',
  },
  {
    id: '4',
    when: '14:18',
    who: 'agent',
    what: 'Løste 1 av 1 kandidat via Kartverket',
    meta: 'matrikkel 0301-208-456-12',
    tone: 'ok',
  },
];

function ActivityLog() {
  return (
    <section className="ws__activity">
      <header className="ws__activityHead">
        <div className="ws__cellLabel">Aktivitet</div>
        <span className="ws__mono ws__activityFilter">siste 24 t · denne eiendommen</span>
      </header>
      <ol className="ws__activityList">
        {ACTIVITY.map((a) => (
          <li key={a.id} className="ws__activityItem">
            <span className="ws__mono ws__activityTime">{a.when}</span>
            <span
              className={`ws__activityDot ws__activityDot--${a.tone ?? 'mute'}`}
              aria-hidden="true"
            />
            <span className="ws__activityWhat">
              <strong>{a.who === 'agent' ? 'Agent' : 'System'}</strong> · {a.what}
            </span>
            {a.meta && <span className="ws__mono ws__activityMeta">{a.meta}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '{ }';
  return `{ ${entries
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join(', ')} }`;
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
