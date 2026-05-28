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
      tools: Array<
        'get_municipality_stats' | 'search_articles' | 'get_weather' | 'search_papers'
      >;
    };
    answer: {
      mustContain: Array<string | RegExp>;
      citationSources: Array<'kartverket' | 'ssb' | 'wikipedia' | 'met' | 'arxiv'>;
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
    query: 'How many people live here, and what is the area like?',
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
    id: 'identity-only',
    query: 'What is the matrikkel number for this property?',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: [] },
      answer: {
        mustContain: ['kommune 0301'],
        citationSources: ['kartverket'],
      },
    },
  },
  {
    id: 'stats-non-oslo',
    query: 'How many people live there?',
    address: 'Torgallmenningen 8, Bergen',
    expect: {
      matchKommunenr: '4601',
      grounded: true,
      routing: { tools: ['get_municipality_stats'] },
      answer: {
        mustContain: ['kommune 4601', /Population in 20\d{2} was \d{5,7}/],
        citationSources: ['kartverket', 'ssb'],
      },
    },
  },
  {
    id: 'norwegian-query',
    query: 'Hvor mange bor det her?',
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
    id: 'weather-only',
    query: "What's the weather like at this address right now?",
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: ['get_weather'] },
      answer: {
        // Forecast sentence template: "Current weather at the property: X°C, code, Y mm ...".
        // Temperature can be negative; symbol_code is snake_case lowercase.
        mustContain: ['kommune 0301', /-?\d+(\.\d+)?°C/, /[a-z_]+(day|night|polartwilight)/],
        citationSources: ['kartverket', 'met'],
      },
    },
  },
  {
    id: 'papers-only',
    query: 'Are there academic research papers about Oslo housing markets?',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: true,
      routing: { tools: ['search_papers'] },
      answer: {
        // arXiv result content is unstable; assert only the sentence frame and the citation source.
        mustContain: ['kommune 0301', /Relevant research:/],
        citationSources: ['kartverket', 'arxiv'],
      },
    },
  },
  {
    id: 'wrong-tool-trap',
    query: 'When was this building built?',
    address: 'Karl Johans gate 5, Oslo',
    expect: {
      matchKommunenr: '0301',
      grounded: false,
      routing: { tools: [] },
      answer: {
        mustContain: [/don't have|can't|cannot|no .* data|unable|out of scope|not available/i],
        citationSources: ['kartverket'],
      },
    },
  },
  {
    id: 'ambiguous-multimatch',
    query: 'Tell me about this address.',
    address: 'Storgata 1',
    expect: {
      matchKommunenr: null,
      grounded: false,
      routing: { tools: [] },
      answer: {
        mustContain: [/candidates|disambiguate/i],
        citationSources: [],
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
