import type { TradeCorridor } from './types';

export function tradeCorridor(fromCountry: string, toCountry: string): TradeCorridor {
  return {
    corridorId: `tc_${fromCountry}_${toCountry}`.toLowerCase(),
    fromCountry,
    toCountry,
    status: 'not_configured',
    statistics: null,
  };
}

export function tradeStatisticsAvailable() {
  return false;
}
