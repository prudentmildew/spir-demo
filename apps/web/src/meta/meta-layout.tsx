import type { ReactNode } from 'react';
import './meta.css';

type MetaLayoutProps = {
  /** Small uppercase chrome label above the title. */
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  /** The sibling meta page to cross-link to. */
  sibling: { href: string; label: string };
  children: ReactNode;
};

/**
 * Shared shell for the two "behind the curtain" meta pages (Metodikk, Dataflyt).
 * Holds the editorial visual register (paper / ink / teal, serif + Inter + mono)
 * and the navigation that ties the pair to each other and back to the catalog,
 * so both pages read as one documentation surface distinct from the agent UI.
 */
export function MetaLayout({ kicker, title, lede, sibling, children }: MetaLayoutProps) {
  return (
    <div className="meta">
      <div className="meta__grain" aria-hidden="true" />

      <nav className="meta__topbar" aria-label="meta-navigasjon">
        <a className="meta__navLink" href="#/prototypes">
          ← prototypkatalog
        </a>
        <a className="meta__navLink meta__navLink--sibling" href={sibling.href}>
          {sibling.label} →
        </a>
      </nav>

      <header className="meta__header">
        <div className="meta__kicker">{kicker}</div>
        <h1 className="meta__title">{title}</h1>
        <p className="meta__lede">{lede}</p>
      </header>

      <main className="meta__body">{children}</main>

      <footer className="meta__footer">
        <a className="meta__navLink" href="#/prototypes">
          ← prototypkatalog
        </a>
        <a className="meta__navLink meta__navLink--sibling" href={sibling.href}>
          {sibling.label} →
        </a>
      </footer>
    </div>
  );
}

/** A quietly-named pillar anchor — lets the four signal themes land in a short read. */
export function Pillar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="meta__pillar">
      <div className="meta__pillarLabel">{label}</div>
      <div className="meta__pillarBody">{children}</div>
    </aside>
  );
}
