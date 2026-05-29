import { EditorialShell } from './shared/editorial-shell';
import './catalog.css';

type CardSpec = {
  hash: string;
  letter: string;
  title: string;
  desc: string;
  appeal: string;
};

const TRANSCRIPT_REGISTERS: CardSpec[] = [
  {
    hash: '#/prototypes/a',
    letter: 'A',
    title: 'Kartografisk',
    desc: 'Offentlig-sektor-verktøy. Kartverket / SSB-uttrykk. Karttegn-legender, kapiteler, dempet blå.',
    appeal: 'Treffer: PM og domeneanmelder.',
  },
  {
    hash: '#/prototypes/b',
    letter: 'B',
    title: 'Redaksjonell',
    desc: 'NYT Upshot, FT data-fortelling, Stripe Press. Antikva-prosa, fotnotekilder, sporing som sluttnoter.',
    appeal: 'Treffer: lederen. — valgt for v1.',
  },
  {
    hash: '#/prototypes/c',
    letter: 'C',
    title: 'Utviklerverktøy',
    desc: 'Linear / Vercel / Anthropic-konsoll. Mørkt tema, tett JSON, ⌘K-palett.',
    appeal: 'Treffer: utviklerne.',
  },
];

const PRODUCT_REGISTERS: CardSpec[] = [
  {
    hash: '#/prototypes/d',
    letter: 'D',
    title: 'B2C-eiendomsside',
    desc: 'Finn.no / Hemnet / Zillow. Eiendommen er helten; agenten fyller seksjoner automatisk og driver en «spør om eiendommen»-panel.',
    appeal: 'Treffer: forbrukere, og PM som ser for seg lansering til sluttbrukere.',
  },
  {
    hash: '#/prototypes/e',
    letter: 'E',
    title: 'B2B-arbeidsflate',
    desc: 'Linear / Stripe / Notion / proptech-aktsomhetsverktøy. Sidemeny + eiendomshode + levende dataceller + spør-panel + aktivitetslogg.',
    appeal: 'Treffer: proptech-utviklere og PM-er som ser for seg å bygge agenten inn.',
  },
];

const PLACE_FINDING_REGISTERS: CardSpec[] = [
  {
    hash: '#/prototypes/f',
    letter: 'F',
    title: 'Lekent, bildedrevet',
    desc: 'Airbnb / Hemnet / Apartamento. Riso-palett, bento-hero med bilde-plassholdere, tematiske spørsmålsgrupper i fem farger. Bygd for når bildene kommer.',
    appeal: 'Treffer: boligsøkere; PM som ser for seg et B2C-merke.',
  },
  {
    hash: '#/prototypes/g',
    letter: 'G',
    title: 'Minimalistisk, adresse-først',
    desc: 'Google-hjemmesiden / Vipps. Ett stort adressefelt, ett rolig kart, en hårfin liste med grupperte spørsmål. Bygd for at live Kartverket-autocomplete og tile-kart skal kunne kobles på.',
    appeal: 'Treffer: anmeldere som stoler på brukeren med ett felt og roen.',
  },
];

export function Catalog() {
  return (
    <EditorialShell
      kicker="Eiendomsinfo-agent · prototypkatalog"
      title={
        <>
          Syv prototyper,
          <br />
          tre innramminger.
        </>
      }
      lede={
        <>
          Den første raden behandler agenten <em>som</em> produktet — en samtale-sentrert flate i
          tre estetiske registre. Den andre behandler agenten som <em>motoren</em> inne i et
          produkt, i to innramminger (B2C-annonse, B2B-arbeidsflate). Den tredje retter seg mot folk
          som <em>leter etter et sted å bo</em>: en leken, bildedrevet flate og en stille,
          adresse-først-flate. Samme data, helt ulike fortellinger.
        </>
      }
      right={{ href: '#/demo', label: 'den valgte v1' }}
    >
      <section className="catalog__section" aria-labelledby="catalog-transcript">
        <div className="catalog__sectionHead">
          <h2 className="catalog__sectionTitle" id="catalog-transcript">
            Samtale-sentrert
          </h2>
          <p className="catalog__sectionDesc">
            Agenten <em>er</em> produktet. Plan → Kjøring → Svar avdekkes for hver runde.
          </p>
        </div>
        <div className="catalog__grid catalog__grid--three">
          {TRANSCRIPT_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} />
          ))}
        </div>
      </section>

      <section className="catalog__section" aria-labelledby="catalog-product">
        <div className="catalog__sectionHead">
          <h2 className="catalog__sectionTitle" id="catalog-product">
            Agent-i-produkt
          </h2>
          <p className="catalog__sectionDesc">
            Agenten er <em>motoren</em> bak en produktflate. Seksjoner lastes inn av seg selv;
            interaksjonen er én funksjon blant mange.
          </p>
        </div>
        <div className="catalog__grid catalog__grid--two">
          {PRODUCT_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} />
          ))}
        </div>
      </section>

      <section className="catalog__section" aria-labelledby="catalog-place">
        <div className="catalog__sectionHead">
          <h2 className="catalog__sectionTitle" id="catalog-place">
            Boligsøk
          </h2>
          <p className="catalog__sectionDesc">
            For folk som leter etter et sted å <em>bo</em>. Rikere forhåndsdefinert
            spørsmålsbibliotek (15 spørsmål fordelt på 5 temaer), klargjort for å gi rom for
            fremtidige kilder (SSB, NILU, NVE, Entur, Skoleporten, Riksantikvaren, OpenStreetMap).
          </p>
        </div>
        <div className="catalog__grid catalog__grid--two">
          {PLACE_FINDING_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} />
          ))}
        </div>
      </section>

      <p className="catalog__coda">
        Kanonisk scenario, alle syv: <em>Hvem eier denne eiendommen?</em> (avslag), så{' '}
        <em>Hva er befolkningen?</em> (grunnet svar). I tillegg vær, nabolag, og begge-kilder for
        D–G. F og G utvider spørsmålsbiblioteket til 15 tematiske spørsmål, med blikk mot fremtidige
        kilder. Agenten er forhåndsskrevet — dette er render-problemet.
      </p>

      <p className="catalog__metaLinks">
        Bak kulissene:{' '}
        <a className="catalog__inlineLink" href="#/metodikk">
          Metodikk
        </a>{' '}
        ·{' '}
        <a className="catalog__inlineLink" href="#/data-flow">
          Dataflyt
        </a>
      </p>
    </EditorialShell>
  );
}

function RegisterCard({ spec }: { spec: CardSpec }) {
  return (
    <a className="catalog__card" href={spec.hash}>
      <div className="catalog__cardLetter" aria-hidden="true">
        {spec.letter}
      </div>
      <div className="catalog__cardKicker">Register {spec.letter}</div>
      <div className="catalog__cardTitle">{spec.title}</div>
      <div className="catalog__cardDesc">{spec.desc}</div>
      <div className="catalog__cardAppeal">{spec.appeal}</div>
      <div className="catalog__cardArrow" aria-hidden="true">
        →
      </div>
    </a>
  );
}
