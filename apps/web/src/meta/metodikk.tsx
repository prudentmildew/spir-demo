import { EditorialShell, Pillar } from '../shared/editorial-shell.tsx';
import { ADR_COUNT, EVAL_RUN_COUNT, PROTOTYPE_COUNT, TEST_FILE_COUNT } from './counts.ts';
import './meta.css';

type Phase = {
  no: string;
  /** The phase as named in the 7-phase frame (kept in English — terms-of-art). */
  frame: string;
  /** What this project actually did at this phase. */
  title: string;
  body: React.ReactNode;
  /** A divergence anchored to this phase, if any. */
  avvik?: React.ReactNode;
};

const PHASES: Phase[] = [
  {
    no: '1',
    frame: 'Idea',
    title: 'En grunnet eiendomsagent — skjerpet ved utspørring',
    body: (
      <>
        Idéen var en agent som svarer på spørsmål om en norsk eiendom og omgivelsene, kun fra åpne
        data, og som <em>nekter ærlig</em> når svaret bare finnes i autoritative registre. Før noe
        ble bygd, ble idéen skjerpet gjennom utspørringsøkter mot domeneordlisten i{' '}
        <span className="meta__mono">CONTEXT.md</span> — hvert begrep (<em>matrikkel</em>,{' '}
        <em>grounded</em>, <em>tool</em> vs <em>retriever</em>) presset til det satt.
      </>
    ),
    avvik: (
      <>
        Der rammeverket bare sier «raffiner idéen», ble den her brynt mot en <em>adversarial</em>{' '}
        utspørring koblet til ordlisten — ikke en notatblokk, men en disiplin.
      </>
    ),
  },
  {
    no: '2',
    frame: 'Research',
    title: 'Levende sondering av de åpne API-ene',
    body: (
      <>
        Kartverket, SSB, MET og grunnet websøk ble utforsket mot ekte endepunkter — ikke
        dokumentasjonen alene, som ofte tar feil. Funnene ble fanget: SSB v2-betas{' '}
        <span className="meta__mono">selection</span>-kropp (ikke{' '}
        <span className="meta__mono">query</span>
        ), MET som dropper <span className="meta__mono">next_6_hours</span> forbi ~50 timer,
        Kartverkets statusside når oppslag degraderer.
      </>
    ),
    avvik: (
      <>
        Rammeverket holder research kortlevd for å unngå at den blir foreldet. Her ble den i stedet
        gjort <em>varig</em> — promotert til prosjektminne og ADR-er — fordi gotchaene mot levende
        kilder er dyre å gjenoppdage.
      </>
    ),
  },
  {
    no: '3',
    frame: 'Prototyping',
    title: `${PROTOTYPE_COUNT} visuelle registre, side om side`,
    body: (
      <>
        I stedet for å gjette på uttrykket ble {PROTOTYPE_COUNT} fullstendige registre bygd på
        kast-ruter — fra kartografisk offentlig-verktøy til redaksjonell publikasjon til mørkt
        utviklerkonsoll — alle matet fra samme kontrollerte fixtures. Register B (redaksjonell) ble
        valgt for v1; det er flaten du ser på <span className="meta__mono">#/demo</span>.
      </>
    ),
    avvik: (
      <>
        Både rammeverket <em>og</em> min egen PRD sa: slett taperne. Jeg beholdt alle{' '}
        {PROTOTYPE_COUNT} i live under{' '}
        <a className="meta__inlineLink" href="#/prototypes">
          #/prototypes
        </a>{' '}
        — for en porteføljedemo er de utforskede alternativene en del av historien, ikke avfall.
      </>
    ),
  },
  {
    no: '4',
    frame: 'PRD',
    title: 'To kravdokumenter som beskriver målet',
    body: (
      <>
        Med research og prototyping på plass ble destinasjonen beskrevet: én PRD for agent-kjernen (
        <span className="meta__mono">property-agent-scaffold.md</span>) og én for frontenden (
        <span className="meta__mono">frontend-prd.md</span>) — hva brukeren ser, hvordan det
        oppfører seg, og hva som bevisst er <em>utenfor</em> v1.
      </>
    ),
  },
  {
    no: '5',
    frame: 'Issues / Kanban',
    title: 'Arbeidet skåret i tracer-bullet-skiver',
    body: (
      <>
        PRD-ene ble brutt ned til uavhengig gripbare issues på en lokal markdown-tavle (
        <span className="meta__mono">.scratch/</span>), som vertikale skiver heller enn lagdelte
        oppgaver — hver skive en tynn ende-til-ende-tråd med sin egen tilbakemeldingssløyfe.
      </>
    ),
  },
  {
    no: '6',
    frame: 'Execution',
    title: 'Test-drevet, mot et håndsveivet skall',
    body: (
      <>
        Koden ble skrevet test-først (rød → grønn → refaktor) mot et bevisst <em>deterministisk</em>{' '}
        skall: orkestratoren er håndskrevet, og det eneste probabilistiske steget er ruteren (Claude
        Haiku 4.5). {ADR_COUNT} ADR-er fanger de bærende valgene — fra «entitetsoppslag alltid
        først» til «strukturert = tool, ustrukturert = retriever».
      </>
    ),
  },
  {
    no: '7',
    frame: 'QA',
    title: 'To kvalitetsporter: tester og evals',
    body: (
      <>
        Enhetstester ({TEST_FILE_COUNT} testfiler) dekker adaptere og orkestrering deterministisk,
        med kontrollerte avhengigheter. Men korrekthet for en LLM-agent måles ikke av enhetstester
        alene.
      </>
    ),
    avvik: (
      <>
        Der rammeverket lar agenten skrive en QA-plan for menneskelig gjennomgang, la jeg på et eget
        lag: <em>evals</em> kjører gyldne saker mot levende kilder via en CLI ({EVAL_RUN_COUNT}{' '}
        loggførte kjøringer), og <span className="meta__mono">replay</span> rekjører en innspilt
        plan med kontrollerte utdata offline — bevisst skilt fra testløperen (ADR-0006, ADR-0007).
      </>
    ),
  },
];

const DIVERGENCES: { title: string; value: string; body: React.ReactNode }[] = [
  {
    title: 'Beholdt de forkastede prototypene',
    value: 'smak',
    body: (
      <>
        Rammeverket og PRD-en sa slett dem; alle {PROTOTYPE_COUNT} lever under{' '}
        <a className="meta__inlineLink" href="#/prototypes">
          #/prototypes
        </a>
        . Utforskningen er bevis på vurderingsevne, ikke avfall.
      </>
    ),
  },
  {
    title: 'Evals som eget kvalitetslag',
    value: 'kvalitetsterskel',
    body: (
      <>
        QA ble ikke bare en sjekkliste for et menneske. Live-evals + offline{' '}
        <span className="meta__mono">replay</span>, skilt fra enhetstestene, fordi en agents
        korrekthet ligger i rutevalg og svarkvalitet — ikke bare i ren funksjonsatferd.
      </>
    ),
  },
  {
    title: 'Utspørring som idé-raffinering',
    value: 'stringens',
    body: (
      <>
        «Raffiner idéen» ble en adversarial utspørring mot domeneordlisten — designvalg ble presset
        til de holdt, og uenigheter løst før kode ble skrevet.
      </>
    ),
  },
  {
    title: 'Research gjort varig',
    value: 'kunnskap',
    body: (
      <>
        I stedet for kortlevd research ble dyrekjøpte funn mot levende API-er promotert til
        prosjektminne og ADR-er — så de ikke må gjenoppdages neste gang.
      </>
    ),
  },
];

export function Metodikk() {
  return (
    <EditorialShell
      kicker="Eiendomsinfo-agent · bak kulissene"
      title={
        <>
          Metodikk:
          <br />
          hvordan dette ble bygd.
        </>
      }
      lede={
        <>
          En strukturert vei fra idé til kjørende agent — skjerpet ved utspørring, prototypet bredt,
          spesifisert, skåret i skiver, og bygd test-først. Skjelettet er inspirert av Matt Pococks{' '}
          <a
            className="meta__inlineLink"
            href="https://www.aihero.dev/my-7-phases-of-ai-development"
            target="_blank"
            rel="noreferrer"
          >
            7 phases of AI development
          </a>{' '}
          — fulgt der det tjente arbeidet, og bevisst forlatt der det ikke gjorde det. De forkastede
          uttrykkene ligger fortsatt i{' '}
          <a className="meta__inlineLink" href="#/prototypes">
            prototypkatalogen
          </a>
          .
        </>
      }
      right={{ href: '#/data-flow', label: 'Dataflyt' }}
    >
      <section className="meta__section" aria-labelledby="metodikk-faser">
        <h2 className="meta__sectionTitle" id="metodikk-faser">
          De syv fasene — slik de faktisk forløp
        </h2>
        <ol className="meta__phases">
          {PHASES.map((p) => (
            <li className="meta__phase" key={p.no}>
              <div className="meta__phaseMark" aria-hidden="true">
                {p.no}
              </div>
              <div className="meta__phaseMain">
                <div className="meta__phaseFrame">{p.frame}</div>
                <h3 className="meta__phaseTitle">{p.title}</h3>
                <p className="meta__phaseBody">{p.body}</p>
                {p.avvik && (
                  <p className="meta__avvik">
                    <span className="meta__avvikTag">↪ avvik</span>
                    {p.avvik}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="meta__section" aria-labelledby="metodikk-avvik">
        <h2 className="meta__sectionTitle" id="metodikk-avvik">
          Hvor jeg avvek — og hvorfor
        </h2>
        <p className="meta__sectionLede">
          Rammeverket er en form, ikke en fasit. Fire bevisste avvik, hvert knyttet til en verdi det
          tjener.
        </p>
        <div className="meta__divergences">
          {DIVERGENCES.map((d) => (
            <div className="meta__divergence" key={d.title}>
              <div className="meta__divergenceValue">{d.value}</div>
              <h3 className="meta__divergenceTitle">{d.title}</h3>
              <p className="meta__divergenceBody">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Pillar label="Kvalitet">
        Korrekthet bæres av to porter, ikke én: {TEST_FILE_COUNT} deterministiske testfiler for
        adaptere og orkestrering, og {EVAL_RUN_COUNT} loggførte eval-kjøringer som måler rutevalg og
        svarkvalitet mot levende kilder. Tester fanger regresjoner; evals fanger feil dømmekraft.
      </Pillar>
    </EditorialShell>
  );
}
