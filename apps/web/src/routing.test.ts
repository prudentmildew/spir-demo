import { describe, expect, it } from 'vitest';
import { parseRoute } from './routing.ts';

describe('parseRoute', () => {
  it('maps an empty hash to the landing front door', () => {
    expect(parseRoute('')).toEqual({ kind: 'landing' });
  });

  it('maps a bare "#" to landing', () => {
    expect(parseRoute('#')).toEqual({ kind: 'landing' });
  });

  it('maps "#/" to landing', () => {
    expect(parseRoute('#/')).toEqual({ kind: 'landing' });
  });

  it('maps unrecognized junk to landing (catch-all)', () => {
    expect(parseRoute('#/nonsense')).toEqual({ kind: 'landing' });
  });

  it('maps "#/demo" to the demo', () => {
    expect(parseRoute('#/demo')).toEqual({ kind: 'demo' });
  });

  it('maps "#/prototypes" to the catalog', () => {
    expect(parseRoute('#/prototypes')).toEqual({ kind: 'catalog' });
  });

  it('maps "#/prototypes/c" to prototype c', () => {
    expect(parseRoute('#/prototypes/c')).toEqual({ kind: 'prototype', letter: 'c' });
  });

  it('maps an invalid prototype letter to landing', () => {
    expect(parseRoute('#/prototypes/z')).toEqual({ kind: 'landing' });
  });

  it('maps "#/metodikk" to metodikk', () => {
    expect(parseRoute('#/metodikk')).toEqual({ kind: 'metodikk' });
  });

  it('maps "#/data-flow" to data-flow', () => {
    expect(parseRoute('#/data-flow')).toEqual({ kind: 'data-flow' });
  });

  it('tolerates a trailing slash on a recognized route', () => {
    expect(parseRoute('#/demo/')).toEqual({ kind: 'demo' });
  });
});
