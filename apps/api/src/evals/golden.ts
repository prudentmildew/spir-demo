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
        'get_municipality_stats' | 'search_web' | 'get_weather'
      >;
    };
    answer: {
      mustContain: Array<string | RegExp>;
      citationSources: Array<'kartverket' | 'ssb' | 'web' | 'met'>;
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
      routing: { tools: ['search_web'] },
      answer: {
        mustContain: ['kommune 0301', /Fra «.+»:/],
        citationSources: ['kartverket', 'web'],
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
      routing: { tools: ['get_municipality_stats', 'search_web'] },
      answer: {
        mustContain: [
          'kommune 0301',
          /Folketallet i 20\d{2} var \d{3} \d{3}/,
          /Fra «.+»:/,
        ],
        citationSources: ['kartverket', 'ssb', 'web'],
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
      routing: { tools: ['search_web'] },
      answer: {
        // Web result content is non-deterministic; assert only the sentence frame and the `web`
        // citation source, never the content. Keeping this case alongside `story-only` proves that
        // both a "character" question ("What is the area like?") and a "research" question route to
        // the single `search_web` step. Frame is Norwegian per ADR-0009.
        mustContain: ['kommune 0301', /Fra «.+»:/],
        citationSources: ['kartverket', 'web'],
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
