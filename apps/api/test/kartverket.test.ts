import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAddress, KARTVERKET_SOK_URL } from '../src/tools/kartverket.ts';

const fakeJsonFetch = (body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

test('adapter parses Kartverket response into Match[]', async () => {
  const fetchFn = fakeJsonFetch({
    adresser: [
      {
        adressetekst: 'Karl Johans gate 5',
        kommunenummer: '0301',
        kommunenavn: 'OSLO',
        gardsnummer: 207,
        bruksnummer: 264,
        seksjonsnummer: 0,
        representasjonspunkt: { lat: 59.911491, lon: 10.741234 },
      },
    ],
  });

  const matches = await resolveAddress('Karl Johans gate 5, Oslo', { fetch: fetchFn });

  assert.equal(matches.length, 1);
  const m = matches[0]!;
  assert.equal(m.address, 'Karl Johans gate 5');
  assert.equal(m.kommunenr, '0301');
  assert.equal(m.kommunenavn, 'OSLO');
  assert.deepEqual(m.matrikkel, { knr: '0301', gnr: 207, bnr: 264 });
  assert.equal(m.lat, 59.911491);
  assert.equal(m.lon, 10.741234);
});

test('adapter includes seksjonsnummer as snr when nonzero', async () => {
  const fetchFn = fakeJsonFetch({
    adresser: [
      {
        adressetekst: 'Storgata 1',
        kommunenummer: '0301',
        kommunenavn: 'OSLO',
        gardsnummer: 100,
        bruksnummer: 1,
        seksjonsnummer: 3,
        representasjonspunkt: { lat: 59.9, lon: 10.7 },
      },
    ],
  });

  const matches = await resolveAddress('Storgata 1', { fetch: fetchFn });

  assert.deepEqual(matches[0]?.matrikkel, { knr: '0301', gnr: 100, bnr: 1, snr: 3 });
});

test('adapter calls Kartverket sok endpoint with query in sok param', async () => {
  const calls: URL[] = [];
  const fetchFn: typeof fetch = async (input) => {
    calls.push(input instanceof URL ? input : new URL(String(input)));
    return new Response(JSON.stringify({ adresser: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  await resolveAddress('Karl Johans gate 5, Oslo', { fetch: fetchFn });

  assert.equal(calls.length, 1);
  const called = calls[0]!;
  assert.equal(`${called.origin}${called.pathname}`, KARTVERKET_SOK_URL);
  assert.equal(called.searchParams.get('sok'), 'Karl Johans gate 5, Oslo');
});
