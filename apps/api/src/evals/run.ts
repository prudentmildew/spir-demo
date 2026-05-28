import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anthropic } from '@ai-sdk/anthropic';
import type { QueryResponse } from '../domain/query.ts';
import { handleQuery, type Route } from '../orchestrator/handle-query.ts';
import { makeRouter } from '../orchestrator/router.ts';
import { searchArticles } from '../retrievers/wikipedia.ts';
import { searchPapers } from '../retrievers/arxiv.ts';
import { resolveAddress } from '../tools/kartverket.ts';
import { getWeather } from '../tools/met.ts';
import { getMunicipalityStats } from '../tools/ssb.ts';
import { goldenSet, type GoldenCase } from './golden.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = resolve(__dirname, '../../evals/runs');

type CaseResult = {
  id: string;
  query: string;
  address: string | undefined;
  retrievalPass: boolean;
  retrievalDetails: { expected: string[]; actual: string[] };
  answerPass: boolean;
  answerDetails: {
    grounded: { expected: boolean; actual: boolean };
    missingPatterns: string[];
    missingCitationSources: string[];
  };
  response: QueryResponse;
};

const sortedKey = (xs: readonly string[]) => [...xs].sort().join('|');
const setEquals = (a: readonly string[], b: readonly string[]) => sortedKey(a) === sortedKey(b);

function scoreCase(c: GoldenCase, response: QueryResponse): CaseResult {
  const actualTools = response.trace
    .filter((s) => s.step !== 'resolve_address')
    .map((s) => s.step);
  const expectedTools = c.expect.routing.tools;
  const retrievalPass = setEquals(actualTools, expectedTools);

  const missingPatterns = c.expect.answer.mustContain
    .filter((p) =>
      typeof p === 'string' ? !response.answer.includes(p) : !p.test(response.answer),
    )
    .map((p) => p.toString());
  const actualSources = new Set(response.citations.map((cit) => cit.source));
  const missingCitationSources = c.expect.answer.citationSources.filter(
    (s) => !actualSources.has(s),
  );

  const answerPass =
    response.grounded === c.expect.grounded &&
    missingPatterns.length === 0 &&
    missingCitationSources.length === 0;

  return {
    id: c.id,
    query: c.query,
    address: c.address,
    retrievalPass,
    retrievalDetails: { expected: [...expectedTools], actual: actualTools },
    answerPass,
    answerDetails: {
      grounded: { expected: c.expect.grounded, actual: response.grounded },
      missingPatterns,
      missingCitationSources,
    },
    response,
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is required to run evals (the router calls Claude).');
    process.exit(1);
  }

  const route: Route = makeRouter(anthropic('claude-haiku-4-5-20251001'));
  const deps = {
    resolveAddress: (q: string) => resolveAddress(q, { fetch }),
    getMunicipalityStats: (k: string, m: 'population') =>
      getMunicipalityStats(k, m, { fetch }),
    searchArticles: (q: string) => searchArticles(q, { fetch }),
    getWeather: (lat: number, lon: number) => getWeather(lat, lon, { fetch }),
    searchPapers: (q: string) => searchPapers(q, { fetch }),
    route,
  };

  const results: CaseResult[] = [];
  for (const c of goldenSet) {
    process.stderr.write(`running ${c.id}... `);
    const response = await handleQuery({ query: c.query, address: c.address }, deps);
    const result = scoreCase(c, response);
    results.push(result);
    process.stderr.write(
      `retrieval=${result.retrievalPass ? 'pass' : 'FAIL'} answer=${result.answerPass ? 'pass' : 'FAIL'}\n`,
    );
  }

  const summary = {
    totalCases: results.length,
    retrievalScore: results.filter((r) => r.retrievalPass).length,
    answerScore: results.filter((r) => r.answerPass).length,
  };

  const timestamp = new Date().toISOString();
  const report = { timestamp, summary, cases: results };

  await mkdir(REPORT_DIR, { recursive: true });
  const reportPath = resolve(REPORT_DIR, `${timestamp.replace(/[:.]/g, '-')}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('');
  console.log(`Retrieval: ${summary.retrievalScore}/${summary.totalCases}`);
  console.log(`Answer:    ${summary.answerScore}/${summary.totalCases}`);
  console.log(`\nReport: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
