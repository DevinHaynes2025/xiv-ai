import type { DataSurfaceState } from '@/lib/surface-state';

export const WORKSPACE_NOTICE =
  'WORKSPACE FOUNDATION. Offline sync, international registries, video documentaries, and translation providers are NOT_CONFIGURED.';

export const DISCOVERY_ROWS = [
  {
    name: 'Sample emerging manufacturer',
    country: 'NG',
    signal: 'REQUIRES_REVIEW',
    state: 'DEMO' as DataSurfaceState,
    note: 'Not a stock pick. Investment recommendation: none.',
  },
  {
    name: 'Public U.S. filer context',
    country: 'US',
    signal: 'WATCH',
    state: 'HISTORICAL' as DataSurfaceState,
    note: 'SEC adapter may be LIVE. This card is not a live ticker.',
  },
];

export const SHEET_ROWS = [
  { company: 'Company A', revenue: '42M', growth: '+18%', risk: 'Medium', signal: 'EMERGING', evidence: '7 DEMO sources' },
  { company: 'Company B', revenue: '11M', growth: '+41%', risk: 'High', signal: 'WATCH', evidence: '5 DEMO sources' },
];

export const DAILY_CHANNELS = [
  'XIV Business',
  'XIV Startups',
  'XIV Global',
  'XIV Wealth',
  'XIV Wellness',
  'XIV Security',
  'XIV Research',
  'XIV Stories',
  'XIV Ideas',
] as const;
