import type {ReactNode} from 'react';
import './editorial.css';

type RightLink = { href: string; label: string };

type EditorialShellProps = {
    /** Small uppercase chrome label above the title. */
    kicker: ReactNode;
    title: ReactNode;
    lede: ReactNode;
    /** The single contextual link at top-right (and mirrored in the footer). */
    right?: RightLink;
    /**
     * On the Landing page itself the brand is plain text (no self-link) and no
     * right link is shown — the front door does not link back to itself.
     */
    isLanding?: boolean;
    children: ReactNode;
};

/**
 * Shared editorial frame for all four non-demo pages (Landing, Catalog,
 * Metodikk, Dataflyt). Renders the warm-paper register and a uniform
 * brand-home nav grammar: brand "Spir Demo by Consid" at top-left linking to
 * the front door ("/"), and one optional contextual link at top-right. The
 * footer mirrors the topbar so the page reads as one documentation surface.
 */
export function EditorialShell({
                                   kicker,
                                   title,
                                   lede,
                                   right,
                                   isLanding = false,
                                   children,
                               }: EditorialShellProps) {
    // On the Landing page the brand is inert text; elsewhere it is a home link.
    const brand = <span className="editorial__brand">Spir Demo by <a
        href="mailto:erland.glad.solstrand@consid">erland.glad.solstrand@Consid</a></span>;

    // Landing never shows a right link, even if one were passed.
    const rightLink =
        !isLanding && right ? (
            <a className="editorial__navLink" href={right.href}>
                {right.label} →
            </a>
        ) : (
            <span aria-hidden="true"/>
        );

    return (
        <div className="editorial">
            <div className="editorial__grain" aria-hidden="true"/>

            <nav className="editorial__topbar" aria-label="navigasjon">
                {brand}
                {rightLink}
            </nav>

            <header className="editorial__header">
                <div className="editorial__kicker">{kicker}</div>
                <h1 className="editorial__title">{title}</h1>
                <p className="editorial__lede">{lede}</p>
            </header>

            <main className="editorial__body">{children}</main>

            <footer className="editorial__footer">
                {brand}
                {rightLink}
            </footer>
        </div>
    );
}

/** A quietly-named pillar anchor — lets short themes land in a fast read. */
export function Pillar({label, children}: { label: string; children: ReactNode }) {
    return (
        <aside className="meta__pillar">
            <div className="meta__pillarLabel">{label}</div>
            <div className="meta__pillarBody">{children}</div>
        </aside>
    );
}
