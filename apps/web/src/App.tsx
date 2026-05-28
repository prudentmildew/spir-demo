import { useEffect, useState } from 'react';
import { EditorialApp } from './app/index.tsx';
import { Cartographic } from './prototypes/cartographic/index.tsx';
import { Developer } from './prototypes/developer/index.tsx';
import { Editorial } from './prototypes/editorial/index.tsx';
import { Minimal } from './prototypes/minimal/index.tsx';
import { Playful } from './prototypes/playful/index.tsx';
import { Property } from './prototypes/property/index.tsx';
import { Workspace } from './prototypes/workspace/index.tsx';
import './landing.css';

type PrototypeLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
type Route = { kind: 'app' } | { kind: 'landing' } | { kind: 'prototype'; letter: PrototypeLetter };

const PROTOTYPE_LETTERS = new Set<PrototypeLetter>(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

const parseHash = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (h === '' || h === '/') return { kind: 'app' };
  if (h === 'prototypes') return { kind: 'landing' };
  const m = h.match(/^prototypes\/([a-g])$/);
  if (m && PROTOTYPE_LETTERS.has(m[1] as PrototypeLetter)) {
    return { kind: 'prototype', letter: m[1] as PrototypeLetter };
  }
  return { kind: 'app' };
};

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.kind === 'app') return <EditorialApp />;
  if (route.kind === 'landing') return <Landing />;
  if (route.letter === 'a') return <Cartographic />;
  if (route.letter === 'b') return <Editorial />;
  if (route.letter === 'c') return <Developer />;
  if (route.letter === 'd') return <Property />;
  if (route.letter === 'e') return <Workspace />;
  if (route.letter === 'f') return <Playful />;
  return <Minimal />;
}

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

function Landing() {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__kicker">Eiendomsinfo-agent · prototypkatalog</div>
        <h1 className="landing__title">
          Syv prototyper,
          <br />
          tre innramminger.
        </h1>
        <p className="landing__lede">
          Den første raden behandler agenten <em>som</em> produktet — en samtale-sentrert flate i
          tre estetiske registre. Den andre behandler agenten som <em>motoren</em> inne i et
          produkt, i to innramminger (B2C-annonse, B2B-arbeidsflate). Den tredje retter seg mot folk
          som <em>leter etter et sted å bo</em>: en leken, bildedrevet flate og en stille,
          adresse-først-flate. Samme data, helt ulike fortellinger.
        </p>
        <p className="landing__lede">
          <a href="#/" className="landing__backLink">
            ← tilbake til den valgte v1 (register B, koblet til API)
          </a>
        </p>
      </header>

      <section className="landing__section" aria-labelledby="landing-transcript">
        <div className="landing__sectionHead">
          <h2 className="landing__sectionTitle" id="landing-transcript">
            Samtale-sentrert
          </h2>
          <p className="landing__sectionDesc">
            Agenten <em>er</em> produktet. Plan → Kjøring → Svar avdekkes for hver runde.
          </p>
        </div>
        <div className="landing__grid landing__grid--three">
          {TRANSCRIPT_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} variant={spec.letter.toLowerCase()} />
          ))}
        </div>
      </section>

      <section className="landing__section" aria-labelledby="landing-product">
        <div className="landing__sectionHead">
          <h2 className="landing__sectionTitle" id="landing-product">
            Agent-i-produkt
          </h2>
          <p className="landing__sectionDesc">
            Agenten er <em>motoren</em> bak en produktflate. Seksjoner lastes inn av seg selv;
            interaksjonen er én funksjon blant mange.
          </p>
        </div>
        <div className="landing__grid landing__grid--two">
          {PRODUCT_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} variant={spec.letter.toLowerCase()} />
          ))}
        </div>
      </section>

      <section className="landing__section" aria-labelledby="landing-place">
        <div className="landing__sectionHead">
          <h2 className="landing__sectionTitle" id="landing-place">
            Boligsøk
          </h2>
          <p className="landing__sectionDesc">
            For folk som leter etter et sted å <em>bo</em>. Rikere forhåndsdefinert
            spørsmålsbibliotek (15 spørsmål fordelt på 5 temaer), klargjort for å gi rom for
            fremtidige kilder (SSB, NILU, NVE, Entur, Skoleporten, Riksantikvaren, OpenStreetMap).
          </p>
        </div>
        <div className="landing__grid landing__grid--two">
          {PLACE_FINDING_REGISTERS.map((spec) => (
            <RegisterCard key={spec.hash} spec={spec} variant={spec.letter.toLowerCase()} />
          ))}
        </div>
      </section>

      <footer className="landing__footer">
        Kanonisk scenario, alle syv: <em>Hvem eier denne eiendommen?</em> (avslag), så{' '}
        <em>Hva er befolkningen?</em> (grunnet svar). I tillegg vær, nabolag, og begge-kilder for
        D–G. F og G utvider spørsmålsbiblioteket til 15 tematiske spørsmål, med blikk mot fremtidige
        kilder. Agenten er forhåndsskrevet — dette er render-problemet.
      </footer>
    </div>
  );
}

function RegisterCard({ spec, variant }: { spec: CardSpec; variant: string }) {
  return (
    <a className={`landing__card landing__card--${variant}`} href={spec.hash}>
      <div className="landing__cardLetter" aria-hidden="true">
        {spec.letter}
      </div>
      <div className="landing__cardKicker">Register {spec.letter}</div>
      <div className="landing__cardTitle">{spec.title}</div>
      <div className="landing__cardDesc">{spec.desc}</div>
      <div className="landing__cardAppeal">{spec.appeal}</div>
      <div className="landing__cardArrow" aria-hidden="true">
        →
      </div>
    </a>
  );
}
