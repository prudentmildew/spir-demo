import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV3 } from 'ai/test';
import { makeRouter } from '../src/orchestrator/router.ts';
import type { Match } from '../src/domain/match.ts';

const sampleMatch: Match = {
  address: 'Karl Johans gate 5, 0154 Oslo',
  matrikkel: { knr: '0301', gnr: 207, bnr: 264 },
  kommunenr: '0301',
  kommunenavn: 'Oslo',
  lat: 59.911491,
  lon: 10.741234,
};

const mockGenerate = (jsonText: string) =>
  new MockLanguageModelV3({
    doGenerate: async () => ({
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      content: [{ type: 'text', text: jsonText }],
      warnings: [],
    }),
  });

test('router parses a population-only plan from the model', async () => {
  const model = mockGenerate(
    '{"steps":[{"tool":"get_municipality_stats","metric":"population"}]}',
  );
  const route = makeRouter(model);

  const plan = await route('how many people live there?', sampleMatch);

  assert.deepEqual(plan, {
    steps: [{ tool: 'get_municipality_stats', metric: 'population' }],
  });
});

test('router parses a search-only plan with a focused query', async () => {
  const model = mockGenerate(
    '{"steps":[{"tool":"search_web","query":"Grünerløkka"}]}',
  );
  const route = makeRouter(model);

  const plan = await route('tell me about Grünerløkka', sampleMatch);

  assert.deepEqual(plan, {
    steps: [{ tool: 'search_web', query: 'Grünerløkka' }],
  });
});

test('router parses an empty plan when the question needs only the locator', async () => {
  const model = mockGenerate('{"steps":[]}');
  const route = makeRouter(model);

  const plan = await route("what's the matrikkel?", sampleMatch);

  assert.deepEqual(plan, { steps: [] });
});

test('router prompt includes the user question and the resolved match', async () => {
  const calls: { prompt: unknown; system: unknown }[] = [];
  const model = new MockLanguageModelV3({
    doGenerate: async (options) => {
      calls.push({ prompt: options.prompt, system: undefined });
      return {
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
        content: [{ type: 'text', text: '{"steps":[]}' }],
        warnings: [],
      };
    },
  });
  const route = makeRouter(model);

  await route('how many people live in Oslo?', sampleMatch);

  assert.equal(calls.length, 1);
  const promptString = JSON.stringify(calls[0]?.prompt);
  assert.match(promptString, /how many people live in Oslo\?/);
  assert.match(promptString, /Karl Johans gate 5/);
  assert.match(promptString, /0301/);
});
