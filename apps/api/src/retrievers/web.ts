import { anthropic } from '@ai-sdk/anthropic';
import { generateText, type LanguageModel } from 'ai';
import type { Chunk } from '../domain/chunk.ts';

// citedText only populates when the system prompt forces the model to quote
// verbatim and cite inline. Without this instruction the Anthropic web-search
// tool returns sources with no citedText, leaving us nothing citable.
const SYSTEM_PROMPT = [
  'You are a research assistant with access to a web search tool.',
  'When answering, first search the web for the most relevant sources.',
  'Surface several complementary sources rather than stopping at the first good hit.',
  'Then quote relevant, VERBATIM passages from the best sources and cite each one inline.',
  'Do not paraphrase or summarise the quoted material: reproduce the source text exactly,',
  'word for word, and attach an inline citation to every quoted passage so each quote is',
  'tied to the URL it came from.',
].join(' ');

/**
 * Claude web-search retriever. Returns citable chunks whose `text` is a verbatim
 * passage drawn from a real web source.
 *
 * The orchestrator injects the model and catches retriever failures, so we let
 * generateText errors propagate rather than swallowing them.
 */
export async function searchWeb(query: string, deps: { model: LanguageModel }): Promise<Chunk[]> {
  const result = await generateText({
    model: deps.model,
    system: SYSTEM_PROMPT,
    prompt: query,
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 5 }),
    },
  });

  // result.sources is a mix: some url-sources are bare search hits with no
  // citedText. Keep only url-sources carrying a non-empty verbatim citedText.
  const cited = result.sources.filter(
    (source): source is typeof source & { url: string; title?: string } => {
      if (source.sourceType !== 'url') return false;
      const citedText = source.providerMetadata?.anthropic?.citedText;
      return typeof citedText === 'string' && citedText.length > 0;
    },
  );

  return cited.map((source, rank) => ({
    text: source.providerMetadata!.anthropic!.citedText as string,
    title: source.title ?? '',
    url: source.url,
    score: 1 / (rank + 1),
  }));
}
