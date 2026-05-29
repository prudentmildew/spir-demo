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
    title: 'En grunnet eiendomsagent — skjerpet gjennom utspørring',
    body: (
      <>
        Jeg ville bygge en agent som svarer på spørsmål om en norsk eiendom og omgivelsene den
        ligger i — kun fra åpne data — og som <em>nekter ærlig</em> når svaret bare finnes i
        autoritative registre. Før jeg skrev en linje kode, skjerpet jeg idéen i utspørringsøkter
        mot domeneordlisten i <span className="meta__mono">CONTEXT.md</span>: hvert begrep (
        <em>matrikkel</em>, <em>grounded</em>, <em>tool</em> mot <em>retriever</em>) ble presset til
        det satt.
      </>
    ),
    avvik: (
      <>
        Der rammeverket bare sier «raffiner idéen», prøvde jeg den mot en kritisk utspørring som
        lette etter sprekkene — knyttet til ordlisten. Ikke en notatblokk, men en disiplin.
      </>
    ),
  },
  {
    no: '2',
    frame: 'Research',
    title: 'Levende sondering av de åpne API-ene',
    body: (
      <>
        Jeg utforsket Kartverket, SSB, MET og grunnet websøk mot ekte endepunkter — ikke
        dokumentasjonen alene, for den tar ofte feil. Funnene fanget jeg opp: SSB v2-betas{' '}
        <span className="meta__mono">selection</span>-kropp (ikke{' '}
        <span className="meta__mono">query</span>
        ), at MET dropper <span className="meta__mono">next_6_hours</span> forbi ~50 timer, og
        Kartverkets statusside for når adresseoppslaget svikter.
      </>
    ),
    avvik: (
      <>
        Rammeverket holder utforskningen kortlevd for å unngå at den blir foreldet. Jeg gjorde den i
        stedet <em>varig</em> — løftet funnene til prosjektminne og ADR-er — fordi fallgruvene mot
        levende kilder er dyre å oppdage på nytt.
      </>
    ),
  },
  {
    no: '3',
    frame: 'Prototyping',
    title: `${PROTOTYPE_COUNT} visuelle registre, side om side`,
    body: (
      <>
        I stedet for å gjette meg fram til uttrykket bygde jeg {PROTOTYPE_COUNT} fullstendige
        registre på engangsruter — fra et kartografisk forvaltningsverktøy til en redaksjonell
        publikasjon til et mørkt utviklerkonsoll — alle matet fra de samme kontrollerte testdataene.
        Jeg valgte register B (det redaksjonelle) for v1; det er flaten du ser på{' '}
        <span className="meta__mono">#/demo</span>.
      </>
    ),
    avvik: (
      <>
        Både rammeverket <em>og</em> min egen PRD sa: slett taperne. Jeg lot alle {PROTOTYPE_COUNT}{' '}
        leve videre under{' '}
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
        Med utforskningen og prototypene på plass beskrev jeg målet: én PRD for agent-kjernen (
        <span className="meta__mono">property-agent-scaffold.md</span>) og én for frontenden (
        <span className="meta__mono">frontend-prd.md</span>) — hva brukeren ser, hvordan det
        oppfører seg, og hva som bevisst ligger <em>utenfor</em> v1.
      </>
    ),
  },
  {
    no: '5',
    frame: 'Issues / Kanban',
    title: 'Arbeidet skåret i tracer-bullet-skiver',
    body: (
      <>
        Jeg brøt PRD-ene ned til uavhengige saker på en lokal markdown-tavle (
        <span className="meta__mono">.scratch/</span>) — vertikale skiver heller enn lagdelte
        oppgaver, hver skive en tynn ende-til-ende-tråd med sin egen tilbakemeldingssløyfe.
      </>
    ),
  },
  {
    no: '6',
    frame: 'Execution',
    title: 'Test-drevet, mot et egenbygd skall',
    body: (
      <>
        Jeg skrev koden test-først (rød → grønn → refaktor) mot et bevisst <em>deterministisk</em>{' '}
        skall: orkestratoren er håndskrevet, og det eneste probabilistiske steget er ruteren (Claude
        Haiku 4.5). {ADR_COUNT} ADR-er fanger de bærende valgene — fra «entitetsoppslag alltid
        først» til «strukturert = tool, ustrukturert = retriever».
      </>
    ),
  },
  {
    no: '7',
    frame: 'QA',
    title: 'To porter for kvalitet: tester og evals',
    body: (
      <>
        Enhetstester ({TEST_FILE_COUNT} testfiler) dekker adaptere og orkestrering deterministisk,
        med kontrollerte avhengigheter. Men korrektheten til en LLM-agent måles ikke av enhetstester
        alene.
      </>
    ),
    avvik: (
      <>
        Der rammeverket lar agenten skrive en QA-plan for menneskelig gjennomgang, la jeg på et eget
        lag: <em>evals</em> kjører fasitsaker mot levende kilder via en CLI ({EVAL_RUN_COUNT}{' '}
        loggførte kjøringer), og <span className="meta__mono">replay</span> rekjører en innspilt
        plan med kontrollerte utdata frakoblet — bevisst skilt fra testløperen (ADR-0006, ADR-0007).
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
        Rammeverket og PRD-en sa slett dem; jeg lot alle {PROTOTYPE_COUNT} leve videre under{' '}
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
        Jeg lot ikke QA bli bare en sjekkliste for et menneske. Evals mot levende kilder og
        frakoblet <span className="meta__mono">replay</span>, skilt fra enhetstestene, fordi
        korrektheten til en agent ligger i rutevalg og svarkvalitet — ikke bare i ren
        funksjonsatferd.
      </>
    ),
  },
  {
    title: 'Utspørring som idé-raffinering',
    value: 'stringens',
    body: (
      <>
        «Raffiner idéen» ble for meg en kritisk utspørring mot domeneordlisten — jeg presset
        designvalgene til de holdt, og løste uenigheter før jeg skrev kode.
      </>
    ),
  },
  {
    title: 'Research gjort varig',
    value: 'kunnskap',
    body: (
      <>
        I stedet for kortlevd utforskning løftet jeg dyrekjøpte funn mot levende API-er til
        prosjektminne og ADR-er — så de slipper å oppdages på nytt neste gang.
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
          En strukturert vei fra idé til kjørende agent — skjerpet gjennom utspørring, prototypet
          bredt, spesifisert, skåret i skiver og bygd test-først. Skjelettet låner jeg fra Matt
          Pococks{' '}
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
          Rammeverket er en form, ikke en fasit. Fire bevisste avvik, hvert knyttet til en verdi
          avviket tjener.
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
        Korrektheten bæres av to porter, ikke én: {TEST_FILE_COUNT} deterministiske testfiler for
        adaptere og orkestrering, og {EVAL_RUN_COUNT} loggførte eval-kjøringer som måler rutevalg og
        svarkvalitet mot levende kilder. Tester fanger regresjoner; evals fanger feil dømmekraft.
      </Pillar>
    </EditorialShell>
  );
}
