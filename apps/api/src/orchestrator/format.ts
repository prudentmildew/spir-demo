export const nb = (n: number): string => {
  const [int, frac] = String(n).split('.');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac !== undefined ? `${grouped},${frac}` : grouped;
};

const SYMBOL_NB: Record<string, string> = {
  clearsky: 'klarvær',
  fair: 'lettskyet',
  partlycloudy: 'delvis skyet',
  cloudy: 'skyet',
  fog: 'tåke',
  lightrain: 'lett regn',
  rain: 'regn',
  heavyrain: 'kraftig regn',
  lightrainshowers: 'lette regnbyger',
  rainshowers: 'regnbyger',
  heavyrainshowers: 'kraftige regnbyger',
  lightsnow: 'lett snø',
  snow: 'snø',
  heavysnow: 'kraftig snø',
  lightsnowshowers: 'lette snøbyger',
  snowshowers: 'snøbyger',
  heavysnowshowers: 'kraftige snøbyger',
  sleet: 'sludd',
  sleetshowers: 'sluddbyger',
  rainandthunder: 'regn og torden',
  snowandthunder: 'snø og torden',
  sleetandthunder: 'sludd og torden',
};

export const symbolNb = (code: string): string => {
  const base = code.replace(/_(day|night|polartwilight)$/, '');
  return SYMBOL_NB[base] ?? code;
};
