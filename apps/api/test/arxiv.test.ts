import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchPapers, ARXIV_QUERY_URL } from '../src/retrievers/arxiv.ts';

const emptyFeedXml = '<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>';
const xmlResponse = (xml: string): Response =>
  new Response(xml, { status: 200, headers: { 'content-type': 'application/atom+xml' } });

test('retriever wraps free-text queries with all: prefix (arXiv default field often returns 0)', async () => {
  const calls: Array<{ url: URL }> = [];
  const fetchFn: typeof fetch = async (input) => {
    calls.push({ url: input instanceof URL ? input : new URL(String(input)) });
    return xmlResponse(emptyFeedXml);
  };

  await searchPapers('Oslo housing market', { fetch: fetchFn });

  assert.equal(calls[0]!.url.searchParams.get('search_query'), 'all:Oslo housing market');
});

test('retriever throws on non-2xx response (arXiv 503 "Rate exceeded" must not be silently empty)', async () => {
  const fetchFn: typeof fetch = async () =>
    new Response('Rate exceeded.', { status: 503, statusText: 'Service Unavailable' });

  await assert.rejects(
    () => searchPapers('Oslo', { fetch: fetchFn }),
    /503/,
  );
});

test('retriever passes field-qualified queries through unchanged', async () => {
  const calls: Array<{ url: URL }> = [];
  const fetchFn: typeof fetch = async (input) => {
    calls.push({ url: input instanceof URL ? input : new URL(String(input)) });
    return xmlResponse(emptyFeedXml);
  };

  await searchPapers('ti:housing', { fetch: fetchFn });

  assert.equal(calls[0]!.url.searchParams.get('search_query'), 'ti:housing');
});


const fakeXmlFetch = (xml: string): typeof fetch =>
  async () =>
    new Response(xml, {
      status: 200,
      headers: { 'content-type': 'application/atom+xml' },
    });

// Recorded shape from export.arxiv.org/api/query — two entries with alternate link.
const twoEntryFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2105.12345v1</id>
    <title>Demographics of Oslo
      and surrounding municipalities</title>
    <summary>This paper studies
       population trends   in Oslo
across multiple decades.</summary>
    <published>2021-05-26T00:00:00Z</published>
    <author><name>Alice</name></author>
    <link href="http://arxiv.org/abs/2105.12345v1" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/2105.12345v1" rel="related" type="application/pdf"/>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2202.54321v2</id>
    <title>Housing markets &amp; urban density</title>
    <summary>Urban density study.</summary>
    <published>2022-02-14T00:00:00Z</published>
    <author><name>Bob</name></author>
    <link href="http://arxiv.org/abs/2202.54321v2" rel="alternate" type="text/html"/>
  </entry>
</feed>`;

test('retriever parses multi-entry Atom XML into ordered Chunk[] with descending scores', async () => {
  const fetchFn = fakeXmlFetch(twoEntryFeed);

  const chunks = await searchPapers('oslo demographics', { fetch: fetchFn });

  assert.equal(chunks.length, 2);
  assert.ok(chunks[0]!.score > chunks[1]!.score);
  assert.equal(chunks[0]!.score, 1);
  assert.equal(chunks[1]!.score, 0.5);
});

test('retriever collapses internal whitespace and newlines in title and summary', async () => {
  const fetchFn = fakeXmlFetch(twoEntryFeed);

  const chunks = await searchPapers('oslo demographics', { fetch: fetchFn });

  const first = chunks[0]!;
  assert.equal(first.title, 'Demographics of Oslo and surrounding municipalities');
  assert.equal(
    first.text,
    'This paper studies population trends in Oslo across multiple decades.',
  );
});

test('retriever returns [] when feed has no entries (does not throw)', async () => {
  const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>arXiv Query</title>
</feed>`;

  const chunks = await searchPapers('zzznosuchtermxyz', {
    fetch: fakeXmlFetch(emptyFeed),
  });

  assert.deepEqual(chunks, []);
});

test('retriever calls arXiv with search_query + max_results and a contact User-Agent', async () => {
  const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      init,
    });
    return new Response(
      `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>`,
      { status: 200, headers: { 'content-type': 'application/atom+xml' } },
    );
  };

  await searchPapers('oslo demographics', { fetch: fetchFn });

  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(`${call.url.origin}${call.url.pathname}`, ARXIV_QUERY_URL);
  assert.equal(call.url.searchParams.get('search_query'), 'all:oslo demographics');
  assert.equal(call.url.searchParams.get('max_results'), '5');

  const headers = new Headers(call.init?.headers);
  const ua = headers.get('user-agent');
  assert.ok(ua, 'must send a User-Agent');
  assert.match(ua!, /property-agent-demo/);
  assert.match(ua!, /https?:\/\//);
});

test('retriever prefers <link rel="alternate" type="text/html"> href; falls back to <id>', async () => {
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/1111.11111v1</id>
    <title>With alternate</title>
    <summary>x</summary>
    <link href="http://arxiv.org/abs/1111.11111v1" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/1111.11111v1" rel="related" type="application/pdf"/>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2222.22222v1</id>
    <title>No alternate</title>
    <summary>y</summary>
    <link href="http://arxiv.org/pdf/2222.22222v1" rel="related" type="application/pdf"/>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/3333.33333v1</id>
    <title>No links at all</title>
    <summary>z</summary>
  </entry>
</feed>`;

  const chunks = await searchPapers('whatever', { fetch: fakeXmlFetch(feed) });

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0]!.url, 'http://arxiv.org/abs/1111.11111v1');
  assert.equal(chunks[1]!.url, 'http://arxiv.org/abs/2222.22222v1');
  assert.equal(chunks[2]!.url, 'http://arxiv.org/abs/3333.33333v1');
});
