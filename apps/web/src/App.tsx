import { useEffect, useState } from 'react';
import { EditorialApp } from './app/index.tsx';
import { Catalog } from './Catalog.tsx';
import { Landing } from './Landing.tsx';
import { DataFlow } from './meta/data-flow.tsx';
import { Metodikk } from './meta/metodikk.tsx';
import { Cartographic } from './prototypes/cartographic/index.tsx';
import { Developer } from './prototypes/developer/index.tsx';
import { Editorial } from './prototypes/editorial/index.tsx';
import { Minimal } from './prototypes/minimal/index.tsx';
import { Playful } from './prototypes/playful/index.tsx';
import { Property } from './prototypes/property/index.tsx';
import { Workspace } from './prototypes/workspace/index.tsx';
import { parseHash, type Route } from './routing.ts';
import './shared/editorial.css';

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.kind === 'landing') return <Landing />;
  if (route.kind === 'demo') return <EditorialApp />;
  if (route.kind === 'catalog') return <Catalog />;
  if (route.kind === 'metodikk') return <Metodikk />;
  if (route.kind === 'data-flow') return <DataFlow />;
  if (route.letter === 'a') return <Cartographic />;
  if (route.letter === 'b') return <Editorial />;
  if (route.letter === 'c') return <Developer />;
  if (route.letter === 'd') return <Property />;
  if (route.letter === 'e') return <Workspace />;
  if (route.letter === 'f') return <Playful />;
  return <Minimal />;
}
