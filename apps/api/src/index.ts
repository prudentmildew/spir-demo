import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { anthropic } from '@ai-sdk/anthropic';
import { QueryRequest } from './domain/query.ts';
import {
  handleQuery,
  type GetMunicipalityStats,
  type GetWeather,
  type ResolveAddress,
  type Route,
  type SearchArticles,
  type SearchPapers,
} from './orchestrator/handle-query.ts';
import { makeRouter } from './orchestrator/router.ts';
import { searchArticles as wikipediaSearchArticles } from './retrievers/wikipedia.ts';
import { searchPapers as arxivSearchPapers } from './retrievers/arxiv.ts';
import { resolveAddress as kartverketResolveAddress } from './tools/kartverket.ts';
import { getWeather as metGetWeather } from './tools/met.ts';
import { getMunicipalityStats as ssbGetMunicipalityStats } from './tools/ssb.ts';

const PORT = Number(process.env.PORT ?? 3000);

const resolveAddress: ResolveAddress = (query) =>
  kartverketResolveAddress(query, { fetch });

const getMunicipalityStats: GetMunicipalityStats = (kommunenr, metric) =>
  ssbGetMunicipalityStats(kommunenr, metric, { fetch });

const searchArticles: SearchArticles = (query) =>
  wikipediaSearchArticles(query, { fetch });

const getWeather: GetWeather = (lat, lon) => metGetWeather(lat, lon, { fetch });

const searchPapers: SearchPapers = (query) => arxivSearchPapers(query, { fetch });

const route: Route = makeRouter(anthropic('claude-haiku-4-5-20251001'));

type JsonResponse = { status: number; body: unknown };

const json = (status: number, body: unknown): JsonResponse => ({ status, body });

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  return JSON.parse(raw);
}

async function handle(req: IncomingMessage): Promise<JsonResponse> {
  if (req.method === 'GET' && req.url === '/health') {
    return json(200, { status: 'ok' });
  }

  if (req.method === 'POST' && req.url === '/query') {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(400, { error: 'invalid json' });
    }
    const parsed = QueryRequest.safeParse(body);
    if (!parsed.success) {
      return json(400, { error: 'invalid request', issues: parsed.error.issues });
    }
    const response = await handleQuery(parsed.data, {
      resolveAddress,
      getMunicipalityStats,
      searchArticles,
      getWeather,
      searchPapers,
      route,
    });
    return json(200, response);
  }

  return json(404, { error: 'not found' });
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  handle(req)
    .then(({ status, body }) => {
      res.statusCode = status;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
    })
    .catch((err: unknown) => {
      console.error('unhandled error', err);
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'internal' }));
    });
});

server.listen(PORT, () => {
  console.log(`property-agent api listening on http://localhost:${PORT}`);
});
