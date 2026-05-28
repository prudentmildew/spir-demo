import { XMLParser } from 'fast-xml-parser';
import type { Chunk } from '../domain/chunk.ts';

export const ARXIV_QUERY_URL = 'https://export.arxiv.org/api/query';

const ARXIV_USER_AGENT = 'property-agent-demo (https://example.invalid)';

const ARXIV_MAX_RESULTS = 5;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// fast-xml-parser collapses a single-element array into an object. Normalize
// so callers can iterate without checking. Returns [] for undefined/null.
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function collapseWhitespace(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

type AtomLink = {
  '@_href'?: string;
  '@_rel'?: string;
  '@_type'?: string;
};

type AtomEntry = {
  id?: string;
  title?: string;
  summary?: string;
  link?: AtomLink | AtomLink[];
};

function entryUrl(entry: AtomEntry): string {
  const links = asArray(entry.link);
  const alternate = links.find(
    (l) => l['@_rel'] === 'alternate' && l['@_type'] === 'text/html',
  );
  return alternate?.['@_href'] ?? entry.id ?? '';
}

// arXiv's search_query DSL defaults to no field, which often returns nothing
// for free-text input. The router supplies natural language, so wrap with
// `all:` unless the query already specifies a field prefix (ti:, abs:, all:, …).
function normalizeSearchQuery(query: string): string {
  if (/^[a-z]+:/i.test(query.trim())) return query;
  return `all:${query}`;
}

export async function searchPapers(
  query: string,
  deps: { fetch: typeof fetch },
): Promise<Chunk[]> {
  const url = new URL(ARXIV_QUERY_URL);
  url.searchParams.set('search_query', normalizeSearchQuery(query));
  url.searchParams.set('max_results', String(ARXIV_MAX_RESULTS));

  const res = await deps.fetch(url, {
    headers: { 'user-agent': ARXIV_USER_AGENT },
  });

  // arXiv replies "Rate exceeded." (plain text, status 503) under load. The
  // XML parser would happily produce {} from that and we'd silently emit zero
  // results — indistinguishable from a legitimate empty search. Fail loud so
  // the orchestrator records ok:false and the eval surfaces the issue.
  if (!res.ok) {
    throw new Error(`arXiv responded ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const parsed = parser.parse(xml) as { feed?: { entry?: AtomEntry | AtomEntry[] } };

  const entries = asArray(parsed.feed?.entry);

  // Preserve arXiv's ranking; 1/(rank+1) is already monotonically decreasing.
  return entries.map((entry, rank) => ({
    text: collapseWhitespace(entry.summary),
    title: collapseWhitespace(entry.title),
    url: entryUrl(entry),
    score: 1 / (rank + 1),
  }));
}
