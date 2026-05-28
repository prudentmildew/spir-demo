import { z } from 'zod';
import type { Chunk } from '../domain/chunk.ts';

export const WIKIPEDIA_API_URL = 'https://no.wikipedia.org/w/api.php';

const WIKIPEDIA_USER_AGENT =
  'property-agent-demo (https://example.invalid)';

const MediaWikiSearchHit = z.object({
  title: z.string(),
  snippet: z.string(),
  score: z.number().optional(),
});

const MediaWikiSearchResponse = z.object({
  query: z.object({
    search: z.array(MediaWikiSearchHit),
  }),
});

// MediaWiki snippets are HTML fragments: <span class="searchmatch">…</span>
// wraps each hit, and entities like &amp; / &quot; appear inline. Strip tags
// and decode the common entities so `Chunk.text` is plain text.
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function stripHtml(snippet: string): string {
  const withoutTags = snippet.replace(/<[^>]*>/g, '');
  return withoutTags.replace(
    /&(?:amp|lt|gt|quot|#039|apos|nbsp);/g,
    (m) => HTML_ENTITIES[m] ?? m,
  );
}

function articleUrl(title: string): string {
  // Wikipedia URLs use underscores for spaces; everything else is
  // percent-encoded. encodeURIComponent leaves `()` unencoded, but the safer
  // canonical form (and what MediaWiki itself often emits) encodes them too.
  const encoded = encodeURIComponent(title.replace(/ /g, '_'))
    .replace(/%2F/g, '/')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `https://no.wikipedia.org/wiki/${encoded}`;
}

export async function searchArticles(
  query: string,
  deps: { fetch: typeof fetch },
): Promise<Chunk[]> {
  const url = new URL(WIKIPEDIA_API_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('srprop', 'snippet');
  url.searchParams.set('format', 'json');
  url.searchParams.set('utf8', '1');

  const res = await deps.fetch(url, {
    headers: { 'user-agent': WIKIPEDIA_USER_AGENT },
  });
  const body = MediaWikiSearchResponse.parse(await res.json());

  const chunks: Chunk[] = body.query.search.map((hit, rank) => ({
    text: stripHtml(hit.snippet),
    title: hit.title,
    url: articleUrl(hit.title),
    score: hit.score ?? 1 / (rank + 1),
  }));

  // Sort descending by score; for hits without an API score, the fallback
  // 1/(rank+1) already produces a monotonically decreasing sequence, but
  // sorting keeps the contract explicit.
  return chunks.sort((a, b) => b.score - a.score);
}
