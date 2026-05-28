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
        mustContain: ['kommune 0301', /Folketallet i 20\d{2} var \d{3} \d{3}/],
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
        mustContain: ['kommune 0301', /om oslo/i],
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
          /Folketallet i 20\d{2} var \d{3} \d{3}/,
          /om oslo/i,
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
        mustContain: ['kommune 4601', /Folketallet i 20\d{2} var \d{3} \d{3}/],
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
        mustContain: ['kommune 0301', /Folketallet i 20\d{2} var \d{3} \d{3}/],
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
        // Forecast sentence template: "Aktuelt vær ved eiendommen: X °C, <symbol-nb>, Y mm nedbør ...".
        // Temperature uses nb-NO comma decimal; symbol is Norwegian per orchestrator/format.ts.
        mustContain: [
          'kommune 0301',
          /-?\d+(,\d+)? °C/,
          /klarvær|lettskyet|delvis skyet|skyet|tåke|regn|snø|sludd/,
        ],
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
        // Frame is Norwegian; the quoted title/abstract stays in source language per ADR-0009.
        mustContain: ['kommune 0301', /Relevant forskning:/],
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
        // Out-of-scope: orchestrator frames "X ligger i kommune Y, men <reason>." (NB),
        // router writes the reason in NB per its system prompt.
        mustContain: [/, men /, /ikke|matrikkel|hjemmelshaver|register|kilde/i],
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
        mustContain: [/kandidater|velg/i],
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
        mustContain: [/ingen treff|mer presis/i],
        citationSources: [],
      },
    },
  },
];
