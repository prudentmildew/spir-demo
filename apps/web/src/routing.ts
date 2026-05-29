/**
 * Pure hash-route parsing for the app's HASH router.
 *
 * Kept free of React and `window` so it can be unit-tested in isolation;
 * `parseHash()` is the thin runtime wrapper that reads `window.location`.
 *
 * The route vocabulary intentionally separates two front doors:
 *   - `landing`  — the new editorial front door at the bare URL / catch-all.
 *   - `demo`     — the chosen v1 interface (register B), reachable only at #/demo.
 *   - `catalog`  — the prototype catalog (the old "landing"), at #/prototypes.
 */

export type PrototypeLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export type Route =
  | { kind: 'landing' }
  | { kind: 'demo' }
  | { kind: 'catalog' }
  | { kind: 'metodikk' }
  | { kind: 'data-flow' }
  | { kind: 'prototype'; letter: PrototypeLetter };

const PROTOTYPE_LETTERS = new Set<PrototypeLetter>(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

/** Parse a raw `location.hash` (e.g. "#/demo") into a typed Route. */
export function parseRoute(hash: string): Route {
  // Mirror the existing normalization: strip a leading "#/" and a trailing "/".
  const h = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (h === '' || h === '/') return { kind: 'landing' };
  if (h === 'demo') return { kind: 'demo' };
  if (h === 'prototypes') return { kind: 'catalog' };
  if (h === 'metodikk') return { kind: 'metodikk' };
  if (h === 'data-flow') return { kind: 'data-flow' };
  const m = h.match(/^prototypes\/([a-g])$/);
  if (m && PROTOTYPE_LETTERS.has(m[1] as PrototypeLetter)) {
    return { kind: 'prototype', letter: m[1] as PrototypeLetter };
  }
  // Anything unrecognized falls through to the front door.
  return { kind: 'landing' };
}

/** Read the live `window.location.hash` and parse it. */
export function parseHash(): Route {
  return parseRoute(window.location.hash);
}
