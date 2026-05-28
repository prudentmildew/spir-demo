export type GoldenCase = {
  id: string;
  query: string;
  address?: string;
  expect: {
    matchKommunenr: string | null;
    grounded: boolean;
    routing: {
      // Tools the router is expected to invoke after resolve_address.
      // Empty array means the case should be answered from kartverket alone (or, for bad-address, never reach the router).
      tools: Array<'get_municipality_stats' | 'search_articles'>;
    };
    answer: {
      mustContain: Array<string | RegExp>;
      citationSources: Array<'kartverket' | 'ssb' | 'wikipedia'>;
    };
  };
};

export const goldenSet: GoldenCase[] = [
  {
    id: 'stats-only',
    query: 'How many people live there?',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: ['get_municipality_stats'] },
      answer: {
        mustContain: ['kommune 0301', /Population in 20\d{2} was \d{5,7}/],
        citationSources: ['kartverket', 'ssb'],
      },
    },
  },
  {
    id: 'story-only',
    query: 'What is the area like?',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: ['search_articles'] },
      answer: {
        // kommunenavn comes back upper-cased from Kartverket; match case-insensitively.
        mustContain: ['kommune 0301', /about oslo/i],
        citationSources: ['kartverket', 'wikipedia'],
      },
    },
  },
  {
    id: 'both-sources',
    query: 'Tell me about the property and the area around it.',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: ['get_municipality_stats', 'search_articles'] },
      answer: {
        mustContain: [
          'kommune 0301',
          /Population in 20\d{2} was \d{5,7}/,
          /about oslo/i,
        ],
        citationSources: ['kartverket', 'ssb', 'wikipedia'],
      },
    },
  },
  {
    id: 'bad-address',
    query: 'Tell me about this place.',
    address: 'Nonexistent vei 99999, Nowhere',
    expect: {
      matchKommunenr: null,
      grounded: false,
      routing: { tools: [] },
      answer: {
        mustContain: [/no match|refine/i],
        citationSources: [],
      },
    },
  },
];
