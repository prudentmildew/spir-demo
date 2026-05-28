import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchArticles, WIKIPEDIA_API_URL } from '../src/retrievers/wikipedia.ts';

const fakeJsonFetch = (body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

// Recorded shape from no.wikipedia.org MediaWiki Action API:
// action=query&list=search&srsearch=Oslo&format=json&srprop=snippet
const oslosearchBody = {
  batchcomplete: '',
  query: {
    searchinfo: { totalhits: 12345 },
    search: [
      {
        ns: 0,
        title: 'Oslo',
        pageid: 4097,
        size: 123456,
        wordcount: 9876,
        snippet:
          '<span class="searchmatch">Oslo</span> er hovedstaden i Norge og &amp; landets mest folkerike by.',
        timestamp: '2025-01-01T00:00:00Z',
        score: 0.9,
      },
      {
        ns: 0,
        title: 'Oslo S',
        pageid: 12345,
        size: 5000,
        wordcount: 800,
        snippet: '<span class="searchmatch">Oslo</span> sentralstasjon, forkortet Oslo S.',
        timestamp: '2025-01-02T00:00:00Z',
        score: 0.4,
      },
    ],
  },
};

test('retriever parses MediaWiki search response into Chunk[] sorted by descending score', async () => {
  const fetchFn = fakeJsonFetch(oslosearchBody);

  const chunks = await searchArticles('Oslo', { fetch: fetchFn });

  assert.equal(chunks.length, 2);
  // Sorted highest-first.
  assert.ok(chunks[0]!.score >= chunks[1]!.score);

  const first = chunks[0]!;
  assert.equal(first.title, 'Oslo');
  assert.equal(first.url, 'https://no.wikipedia.org/wiki/Oslo');
  // HTML markers stripped, entities decoded into plain text.
  assert.equal(
    first.text,
    'Oslo er hovedstaden i Norge og & landets mest folkerike by.',
  );
});

test('retriever builds article url from title with spaces and special characters', async () => {
  const fetchFn = fakeJsonFetch({
    query: {
      search: [
        {
          ns: 0,
          title: 'Oslo S',
          pageid: 1,
          snippet: 'plain snippet',
          score: 0.5,
        },
        {
          ns: 0,
          title: 'Æra (tidsperiode)',
          pageid: 2,
          snippet: 'plain snippet',
          score: 0.4,
        },
      ],
    },
  });

  const chunks = await searchArticles('whatever', { fetch: fetchFn });

  const byTitle = new Map(chunks.map((c) => [c.title, c.url]));
  assert.equal(byTitle.get('Oslo S'), 'https://no.wikipedia.org/wiki/Oslo_S');
  assert.equal(
    byTitle.get('Æra (tidsperiode)'),
    'https://no.wikipedia.org/wiki/%C3%86ra_%28tidsperiode%29',
  );
});

test('retriever calls MediaWiki endpoint with srsearch + format=json and a contact User-Agent', async () => {
  const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      init,
    });
    return new Response(JSON.stringify({ query: { search: [] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  await searchArticles('Karl Johans gate', { fetch: fetchFn });

  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(`${call.url.origin}${call.url.pathname}`, WIKIPEDIA_API_URL);
  assert.equal(call.url.searchParams.get('action'), 'query');
  assert.equal(call.url.searchParams.get('list'), 'search');
  assert.equal(call.url.searchParams.get('srsearch'), 'Karl Johans gate');
  assert.equal(call.url.searchParams.get('format'), 'json');

  const headers = new Headers(call.init?.headers);
  const ua = headers.get('user-agent');
  assert.ok(ua, 'must send a User-Agent');
  assert.match(ua!, /property-agent-demo/);
  assert.match(ua!, /https?:\/\//);
});

test('retriever returns [] (does not throw) when MediaWiki search returns no hits', async () => {
  const fetchFn = fakeJsonFetch({
    batchcomplete: '',
    query: { searchinfo: { totalhits: 0 }, search: [] },
  });

  const chunks = await searchArticles('zzzznosuchpropertytermxyz', { fetch: fetchFn });

  assert.deepEqual(chunks, []);
});
