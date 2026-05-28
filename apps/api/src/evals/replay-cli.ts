// Offline replay of an eval report. Walks each recorded case, re-runs the
// orchestrator with canned tool outputs from the trace, and diffs the replayed
// answer against the original. Useful for iterating on answer-composition or
// orchestrator logic without re-burning LLM/API quota.
//
// Run: pnpm --filter api replay <report.json> [--case <id>]
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { QueryResponse } from '../domain/query.ts';
import { replayCase } from './replay.ts';

type ReportCase = {
  id: string;
  query: string;
  address: string | undefined;
  response: QueryResponse;
};

type Report = { timestamp: string; cases: ReportCase[] };

const args = process.argv.slice(2);
const reportPath = args[0];
if (reportPath === undefined) {
  console.error('usage: pnpm --filter api replay <report.json> [--case <id>]');
  process.exit(1);
}
const caseFilterIdx = args.indexOf('--case');
const caseFilter = caseFilterIdx >= 0 ? args[caseFilterIdx + 1] : undefined;

const raw = await readFile(resolve(reportPath), 'utf8');
const report = JSON.parse(raw) as Report;

const cases = caseFilter !== undefined ? report.cases.filter((c) => c.id === caseFilter) : report.cases;
if (cases.length === 0) {
  console.error(caseFilter !== undefined ? `no case with id "${caseFilter}"` : 'report has no cases');
  process.exit(1);
}

let matched = 0;
let drift = 0;
let errored = 0;

for (const c of cases) {
  // A missing plan is fine if routing was never reached (zero- or multi-match
  // resolution short-circuits before the router runs). Otherwise the report is
  // on the pre-plan schema and must be regenerated.
  const resolved = c.response.trace[0]?.output;
  const routingReached = !(Array.isArray(resolved) && resolved.length !== 1);
  if (c.response.plan === undefined && routingReached) {
    console.log(`${c.id}: SKIP (recorded response has no plan — regenerate the report on the current schema)`);
    continue;
  }
  try {
    const replayed = await replayCase(c.response, { query: c.query, address: c.address });
    const sameAnswer = replayed.answer === c.response.answer;
    const sameGrounded = replayed.grounded === c.response.grounded;
    const sameCitations =
      JSON.stringify(replayed.citations) === JSON.stringify(c.response.citations);
    if (sameAnswer && sameGrounded && sameCitations) {
      matched += 1;
      console.log(`${c.id}: MATCH`);
    } else {
      drift += 1;
      console.log(`${c.id}: DRIFT`);
      if (!sameAnswer) {
        console.log(`  recorded answer: ${c.response.answer}`);
        console.log(`  replayed answer: ${replayed.answer}`);
      }
      if (!sameGrounded) {
        console.log(`  grounded: recorded=${c.response.grounded} replayed=${replayed.grounded}`);
      }
      if (!sameCitations) {
        console.log(`  citations differ`);
        console.log(`    recorded: ${JSON.stringify(c.response.citations)}`);
        console.log(`    replayed: ${JSON.stringify(replayed.citations)}`);
      }
    }
  } catch (err) {
    errored += 1;
    console.log(`${c.id}: ERROR ${(err as Error).message}`);
  }
}

console.log(`\n${matched} match, ${drift} drift, ${errored} error (of ${cases.length})`);
process.exit(drift + errored === 0 ? 0 : 1);
