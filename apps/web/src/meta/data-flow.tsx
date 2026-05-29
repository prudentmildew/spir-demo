import { EditorialShell, Pillar } from '../shared/editorial-shell.tsx';
import './meta.css';

/** A node in the vertical pipeline spine. */
function Stage({
  no,
  label,
  title,
  children,
  note,
}: {
  no: string;
  label: string;
  title: string;
  children: React.ReactNode;
  /** A dashed "senere" future-improvement marker for this stage. */
  note?: React.ReactNode;
}) {
  return (
    <div className="meta__stage">
      <div className="meta__stageNo" aria-hidden="true">
        {no}
      </div>
      <div className="meta__stageMain">
        <div className="meta__stageLabel">{label}</div>
        <h3 className="meta__stageTitle">{title}</h3>
        <p className="meta__stageBody">{children}</p>
        {note && (
          <p className="meta__ghost">
            <span className="meta__ghostTag">senere</span>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function Connector() {
  return <div className="meta__connector" aria-hidden="true" />;
}

export function DataFlow() {
  return (
    <EditorialShell
      kicker="Eiendomsinfo-agent · bak kulissene"
      title={
        <>
          Dataflyt:
          <br />
          fra adresse til grunnet svar.
        </>
      }
      lede={
        <>
          Ett spørsmål går gjennom åtte steg. Heltrukne bokser er <em>implementert</em>; stiplede er{' '}
          <em>veien videre</em>. Det som gjør flyten verdt å vise er ikke at den er stor, men at
          hver boks er ærlig: vi cacher én kilde, bevisst, og beholder ingenting. Uttrykket flyten
          tegnes i ble valgt blant alternativene i{' '}
          <a className="meta__inlineLink" href="#/prototypes">
            prototypkatalogen
          </a>
          .
        </>
      }
      right={{ href: '#/metodikk', label: 'Metodikk' }}
    >
      <div className="meta__legend" aria-hidden="true">
        <span className="meta__legendItem">
          <span className="meta__legendSwatch meta__legendSwatch--solid" /> implementert
        </span>
        <span className="meta__legendItem">
          <span className="meta__legendSwatch meta__legendSwatch--ghost" /> senere / potensielt
        </span>
      </div>

      <section className="meta__flow" aria-label="dataflyt">
        <Stage no="1" label="Inngang" title="Adresse + spørsmål">
          Brukeren gir én adresse og ett spørsmål på fritt språk. Ingenting tolkes ennå — råstrengen
          går videre.
        </Stage>
        <Connector />

        <Stage
          no="2"
          label="Entitetsoppslag · Kartverket"
          title="Adressen forankres — alltid først"
          note={
            <>
              betinget GET (<span className="meta__mono">if-modified-since</span>) for å spare
              rundturer mot adresseregisteret.
            </>
          }
        >
          Kartverket løser adressen til <em>matrikkel</em>, <em>kommunenr</em> og{' '}
          <em>representasjonspunkt</em> (lat/lon). Alt henger på dette punktet — uten et rent treff
          kjører ingen kilde. Hentes per forespørsel (ingen cache).
        </Stage>
        <Connector />

        <Stage no="3" label="Ruting · Claude Haiku 4.5" title="Rutplan, eller ærlig avslag">
          Det eneste probabilistiske steget. Ruteren gjør resolvert treff + spørsmål om til en
          ordnet plan over tools/retrievers — eller et <em>utenfor-scope</em>-avslag når ingen kilde
          ærlig kan svare (eierskap, heftelser, byggeår).
        </Stage>
        <Connector />

        <div className="meta__fanLabel">
          <span className="meta__stageLabel">Kjøring · steg etter plan</span>
        </div>
        <div className="meta__lanes">
          <div className="meta__lane">
            <div className="meta__laneKind">tool · spørres</div>
            <h4 className="meta__laneTitle">SSB</h4>
            <p className="meta__laneBody">
              Folketall på <span className="meta__mono">kommunenr</span>. Eksakte felt, sitert med
              tabell-URL.
            </p>
            <div className="meta__laneCache meta__laneCache--none">hentes per forespørsel</div>
            <p className="meta__ghost meta__ghost--lane">
              <span className="meta__ghostTag">senere</span>
              cache med kort TTL — statistikk endres sjelden.
            </p>
          </div>

          <div className="meta__lane">
            <div className="meta__laneKind">retriever · siteres</div>
            <h4 className="meta__laneTitle">Web (Sonnet 4.6)</h4>
            <p className="meta__laneBody">
              Grunnet websøk. Returnerer <em>verbatim</em> passasjer — aldri en syntese — hver med
              egen sitering. Nabolag, historikk, nære steder.
            </p>
            <div className="meta__laneCache meta__laneCache--none">hentes per forespørsel</div>
          </div>

          <div className="meta__lane meta__lane--cached">
            <div className="meta__laneKind">tool · spørres</div>
            <h4 className="meta__laneTitle">MET</h4>
            <p className="meta__laneBody">
              Værvarsel ved <em>representasjonspunktet</em>.
            </p>
            <div className="meta__laneCache meta__laneCache--real">
              cache: in-memory Map
              <span className="meta__laneCacheDetail">
                <span className="meta__mono">Expires</span>-styrt TTL (~30 min) ·{' '}
                <span className="meta__mono">if-modified-since</span> → 304 fornyer vinduet uten å
                re-parse kroppen
              </span>
            </div>
          </div>
        </div>
        <Connector />

        <Stage no="5" label="Transformasjon" title="Rånyttelast → domenetyper">
          Hvert svar valideres med Zod og kartlegges til en domenetype —{' '}
          <span className="meta__mono">Match</span>, <span className="meta__mono">StatPoint</span>,{' '}
          <span className="meta__mono">Chunk</span>, <span className="meta__mono">Forecast</span> —
          så resten av systemet aldri rører rå JSON. MET dropper f.eks.{' '}
          <span className="meta__mono">next_6_hours</span> forbi ~50t; adapteren validerer strengt
          og fanger det.
        </Stage>
        <Connector />

        <Stage no="6" label="Sammenstilling" title="Sitering, grounded-håndhevelse, trace">
          Hver påstand får en <em>citation</em> mot kilden den kom fra.{' '}
          <span className="meta__mono">grounded</span> er sann kun hvis alle påstander sporer til en
          kilde fra denne runden — ellers sier agenten det ærlig. Svaret komponeres på norsk, og en{' '}
          <em>trace</em> registrerer hva som faktisk ble kjørt.
        </Stage>
        <Connector />

        <Stage no="7" label="Fremvisning" title="Koreografert avdekking">
          Frontenden mottar hele svaret som én blob og avdekker det i tre akter — Plan → Kjøring →
          Svar — med kontrollert tempo. Ikke ekte streaming; en bevisst fortellermekanikk
          (ADR-0008).
        </Stage>
      </section>

      <div className="meta__pillars">
        <Pillar label="Caching">
          Nøyaktig én kilde caches: MET, i minnet, med <span className="meta__mono">Expires</span>
          -styrt TTL og betinget revalidering. De andre hentes friskt hver gang —{' '}
          <em>ferskhet over øyeblikksbilder</em> for strukturerte registre (ADR-0004). Hver
          cache-boks på siden er ekte; ingen pyntes på.
        </Pillar>
        <Pillar label="Datalagring">
          Ingenting persisteres. Cachen lever i prosessminnet og forsvinner ved omstart; det finnes
          ingen database, ingen logging av brukerspørsmål, og oppfriskning tømmer transkriptet.
          Tilstandsløst mellom økter — den enkleste forsvarlige retensjonen for en demo.
        </Pillar>
        <Pillar label="Tillit">
          Tillit produseres i steg 6: <span className="meta__mono">citation</span> per påstand,{' '}
          <span className="meta__mono">grounded</span> som del av API-kontrakten, og et ærlig avslag
          framfor en gjetning. Sporet ligger ved svaret så ikke-deterministiske feil kan
          etterprøves.
        </Pillar>
      </div>

      <p className="meta__veien">
        <span className="meta__veienTag">Veien videre</span>
        Persistert cache-lag med kort TTL på SSB og betinget GET på Kartverket, retry/backoff på
        hente-grensen, og flere kilder (NILU, Entur, NVE) — alt stiplet ovenfor, ingen av dem
        nødvendige for å vise prinsippet.
      </p>
    </EditorialShell>
  );
}
