import type { Match, QueryResponse, TraceStep } from '../shared/types.ts';

export type QueryResult =
  | { kind: 'ok'; response: QueryResponse; totalMs: number }
  | { kind: 'http-error'; status: number; message: string; totalMs: number }
  | { kind: 'network-error'; message: string; totalMs: number };

export async function postQuery(
  input: { query: string; address?: string },
  opts?: { signal?: AbortSignal },
): Promise<QueryResult> {
  const started = performance.now();
  try {
    const res = await fetch('/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      signal: opts?.signal,
    });
    const totalMs = Math.round(performance.now() - started);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        kind: 'http-error',
        status: res.status,
        message: text || res.statusText,
        totalMs,
      };
    }
    const response = (await res.json()) as QueryResponse;
    return { kind: 'ok', response, totalMs };
  } catch (err) {
    const totalMs = Math.round(performance.now() - started);
    return {
      kind: 'network-error',
      message: err instanceof Error ? err.message : String(err),
      totalMs,
    };
  }
}

export type Resolution =
  | { kind: 'one'; match: Match }
  | { kind: 'none' }
  | { kind: 'many'; candidates: Match[] }
  | { kind: 'failed' }
  | { kind: 'missing' };

// Reads the resolve_address step from a QueryResponse trace. The orchestrator
// always emits exactly one resolve step; we map it onto the four meaningful
// UI states (one / none / many / failed) plus a missing fallback.
export function readResolution(response: QueryResponse): Resolution {
  const step = response.trace.find((s: TraceStep) => s.step === 'resolve_address');
  if (!step) return { kind: 'missing' };
  if (!step.ok) return { kind: 'failed' };
  const out = step.output;
  if (Array.isArray(out)) {
    if (out.length === 0) return { kind: 'none' };
    return { kind: 'many', candidates: out as Match[] };
  }
  if (out && typeof out === 'object') {
    return { kind: 'one', match: out as Match };
  }
  return { kind: 'missing' };
}
