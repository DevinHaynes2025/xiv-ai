import type { ThinkerDomain } from './types';

export const THINKERS_GRAPH_V2_DOMAINS: readonly ThinkerDomain[] = [
  'business',
  'commerce',
  'technology',
  'science',
  'engineering',
  'mathematics',
  'economics',
  'philosophy',
  'leadership',
  'innovation',
  'supply chain',
  'physics',
  'computing',
  'human thought',
];

export type ThinkerNodeV2 = {
  thinkerId: string;
  name: string;
  domain: ThinkerDomain;
  rankedByRace: false;
  rankedByNationality: false;
  rankedByGender: false;
  rankedByReligion: false;
  rankedByCivilization: false;
};

export function createThinkerNodeV2(name: string, domain: ThinkerDomain): ThinkerNodeV2 {
  return {
    thinkerId: `thinker-v2:${domain}:${name}`,
    name,
    domain,
    rankedByRace: false,
    rankedByNationality: false,
    rankedByGender: false,
    rankedByReligion: false,
    rankedByCivilization: false,
  };
}

export function rankIntellectualValueByProtectedAttribute(): false {
  return false;
}
