import { z } from 'zod';
import type { Match } from '../domain/match.ts';

export const KARTVERKET_SOK_URL = 'https://ws.geonorge.no/adresser/v1/sok';

const KartverketAdresse = z.object({
  adressetekst: z.string(),
  kommunenummer: z.string(),
  kommunenavn: z.string(),
  gardsnummer: z.number().int(),
  bruksnummer: z.number().int(),
  seksjonsnummer: z.number().int().optional(),
  representasjonspunkt: z.object({ lat: z.number(), lon: z.number() }),
});

const KartverketResponse = z.object({
  adresser: z.array(KartverketAdresse),
});

export async function resolveAddress(
  query: string,
  deps: { fetch: typeof fetch },
): Promise<Match[]> {
  const url = new URL(KARTVERKET_SOK_URL);
  url.searchParams.set('sok', query);
  const res = await deps.fetch(url);
  const body = KartverketResponse.parse(await res.json());

  return body.adresser.map((a) => ({
    address: a.adressetekst,
    kommunenr: a.kommunenummer,
    kommunenavn: a.kommunenavn,
    matrikkel: {
      knr: a.kommunenummer,
      gnr: a.gardsnummer,
      bnr: a.bruksnummer,
      ...(a.seksjonsnummer && a.seksjonsnummer > 0 ? { snr: a.seksjonsnummer } : {}),
    },
    lat: a.representasjonspunkt.lat,
    lon: a.representasjonspunkt.lon,
  }));
}
