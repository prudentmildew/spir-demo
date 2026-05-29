import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Repo root. The Metodikk page reports artifact counts (ADRs, prototypes, eval
// runs, test files); we derive them here at config time from the filesystem and
// inject them as constants. That keeps the numbers exact and self-updating
// without hand-maintenance — and, unlike import.meta.glob, emits no per-file
// chunks into the bundle, since we only ever needed the count.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const countIn = (dir: string, match: (name: string) => boolean): number => {
  try {
    return readdirSync(`${repoRoot}${dir}`, { withFileTypes: true }).filter(
      (e) => e.isFile() && match(e.name),
    ).length;
  } catch {
    return 0;
  }
};

const counts = {
  __ADR_COUNT__: countIn('docs/adr', (n) => n.endsWith('.md')),
  __PROTOTYPE_COUNT__: (() => {
    try {
      return readdirSync(`${repoRoot}apps/web/src/prototypes`, { withFileTypes: true }).filter(
        (e) => e.isDirectory(),
      ).length;
    } catch {
      return 0;
    }
  })(),
  __EVAL_RUN_COUNT__: countIn('apps/api/evals/runs', (n) => n.endsWith('.json')),
  __TEST_FILE_COUNT__: countIn('apps/api/test', (n) => n.endsWith('.test.ts')),
};

export default defineConfig({
  plugins: [react()],
  define: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, JSON.stringify(v)])),
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/query': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
