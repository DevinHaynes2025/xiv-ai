export type ArchiveProviderStatus = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'LIVE' | 'DEGRADED' | 'UNAVAILABLE';

export type ArchiveProvider = {
  providerId: string;
  class: 'LIBRARY' | 'ARCHIVE' | 'MUSEUM' | 'UNIVERSITY' | 'GOVERNMENT' | 'PUBLIC_DOMAIN' | 'ACADEMIC';
  officialUrl: string;
  status: ArchiveProviderStatus;
};

export const ARCHIVE_PROVIDER_REGISTRY: readonly ArchiveProvider[] = [
  {
    providerId: 'us_library_of_congress',
    class: 'LIBRARY',
    officialUrl: 'https://www.loc.gov/',
    status: 'NOT_CONFIGURED',
  },
  {
    providerId: 'national_archives_unspecified',
    class: 'ARCHIVE',
    officialUrl: 'https://example.invalid/archives',
    status: 'NOT_CONFIGURED',
  },
  {
    providerId: 'public_domain_repository',
    class: 'PUBLIC_DOMAIN',
    officialUrl: 'https://example.invalid/pd',
    status: 'NOT_CONFIGURED',
  },
];

export function archiveProviderStatus(providerId: string): ArchiveProviderStatus {
  return ARCHIVE_PROVIDER_REGISTRY.find((row) => row.providerId === providerId)?.status ?? 'NOT_CONFIGURED';
}

export function libraryProviderRemainsNotConfigured(): boolean {
  return archiveProviderStatus('us_library_of_congress') === 'NOT_CONFIGURED';
}

export const HISTORICAL_RESEARCH_AGENTS = [
  'Historical Research Director',
  'Ancient Commerce Agent',
  'Trade History Agent',
  'Economic History Agent',
  'Philosophy Agent',
  'Civilization Agent',
  'Archive Agent',
  'Library Agent',
  'Chronology Agent',
  'Historical Geography Agent',
  'Translation Agent',
  'Source Criticism Agent',
  'Historical Contradiction Agent',
  'Archaeology Context Agent',
] as const;

export function historicalAgentMayElevateSpeculationToFact(): false {
  return false;
}
