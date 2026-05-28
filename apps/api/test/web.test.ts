import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV3 } from 'ai/test';
import { searchWeb } from '../src/retrievers/web.ts';

// The provider content-part type lives in the transitive @ai-sdk/provider
// package, which isn't a direct dependency here. The constructor argument of
// MockLanguageModelV3 carries the exact doGenerate return type, so we derive
// the content element type from it rather than importing the provider package.
type GenerateResult = Awaited<
  ReturnType<MockLanguageModelV3['doGenerate']>
>;
type ContentPart = GenerateResult['content'][number];

// Build a MockLanguageModelV3 whose doGenerate returns the given content parts.
// generateText derives `result.sources` from content parts of type 'source'.
function modelReturning(content: ContentPart[]): MockLanguageModelV3 {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      content,
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 5, text: 5, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}

function urlSource(opts: {
  id: string;
  url: string;
  title?: string;
  citedText?: string;
}): ContentPart {
  return {
    type: 'source',
    sourceType: 'url',
    id: opts.id,
    url: opts.url,
    ...(opts.title !== undefined ? { title: opts.title } : {}),
    ...(opts.citedText !== undefined
      ? { providerMetadata: { anthropic: { citedText: opts.citedText } } }
      : {}),
  };
}

test('maps url-sources with citedText to Chunks: verbatim text, url, title, descending score', async () => {
  const model = modelReturning([
    { type: 'text', text: 'Here is what I found.' },
    urlSource({
      id: 's1',
      url: 'https://example.com/oslo',
      title: 'Oslo facts',
      citedText: 'Oslo is the capital of Norway.',
    }),
    urlSource({
      id: 's2',
      url: 'https://example.com/bergen',
      title: 'Bergen facts',
      citedText: 'Bergen is the second-largest city in Norway.',
    }),
  ]);

  const chunks = await searchWeb('norwegian cities', { model });

  assert.equal(chunks.length, 2);
  assert.deepEqual(chunks[0], {
    text: 'Oslo is the capital of Norway.',
    title: 'Oslo facts',
    url: 'https://example.com/oslo',
    score: 1, // 1/(0+1)
  });
  assert.deepEqual(chunks[1], {
    text: 'Bergen is the second-largest city in Norway.',
    title: 'Bergen facts',
    url: 'https://example.com/bergen',
    score: 0.5, // 1/(1+1)
  });
  // scores strictly descending
  assert.ok(chunks[0]!.score > chunks[1]!.score);
});

test('filters out url-sources lacking citedText (rank is over the filtered list)', async () => {
  const model = modelReturning([
    // bare search hit, no citedText -> excluded
    urlSource({ id: 'bare', url: 'https://example.com/bare', title: 'Bare hit' }),
    urlSource({
      id: 's1',
      url: 'https://example.com/quoted',
      title: 'Quoted source',
      citedText: 'A verbatim passage.',
    }),
  ]);

  const chunks = await searchWeb('q', { model });

  assert.equal(chunks.length, 1);
  // The surviving source becomes rank 0 in the filtered list -> score 1.
  assert.deepEqual(chunks[0], {
    text: 'A verbatim passage.',
    title: 'Quoted source',
    url: 'https://example.com/quoted',
    score: 1,
  });
});

test('uses empty-string title when source has no title', async () => {
  const model = modelReturning([
    urlSource({
      id: 's1',
      url: 'https://example.com/x',
      citedText: 'Some quoted text.',
    }),
  ]);

  const chunks = await searchWeb('q', { model });

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]!.title, '');
});

test('returns [] when no source carries citedText (found nothing, does not throw)', async () => {
  const model = modelReturning([
    { type: 'text', text: 'I searched but found nothing quotable.' },
    urlSource({ id: 'bare', url: 'https://example.com/a', title: 'A' }),
  ]);

  const chunks = await searchWeb('q', { model });

  assert.deepEqual(chunks, []);
});

test('lets generateText errors propagate (does not swallow)', async () => {
  const model = new MockLanguageModelV3({
    doGenerate: async () => {
      throw new Error('web search upstream failure');
    },
  });

  await assert.rejects(searchWeb('q', { model }), /web search upstream failure/);
});
