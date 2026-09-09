/**
 * 62L-CK Global Historical Pathway Mining —
 * Global Source Atlas, archive discovery by country/region/language,
 * Global Historical Route Graph, domain packs.
 * Feed XIV root graph only after provenance + evidence checks.
 * No soul-resurrection / afterlife capability claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CK_LOCKS,
  HISTORY_ROOT_WITHOUT_EVIDENCE_DENIED,
  HONESTY_BANNER,
  SOUL_CLAIM_REJECTED,
  UNAUTHORIZED_REGION_MINING_DENIED,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type HistoryPackKind =
  | 'business_evolution'
  | 'international_law_governance'
  | 'healthcare_systems'
  | 'supply_chains'
  | 'technology_compute_history'
  | 'cultural_context';

export type SourceAtlasEntry = {
  id: string;
  label: string;
  country?: string;
  region?: string;
  language?: string;
  authorized: boolean;
  consentKnown: boolean;
  licenseKnown: boolean;
  status: 'enrolled' | 'denied' | 'waiting_data';
  reason: string;
  at: string;
};

export type HistoricalPathway = {
  id: string;
  pack: HistoryPackKind;
  label: string;
  provenanceRefs: string[];
  evidenceRefs: string[];
  hasProvenance: boolean;
  hasEvidence: boolean;
  rootGraphAdmitted: boolean;
  status: 'candidate' | 'admitted_root' | 'denied' | 'rejected';
  reason: string;
  labeledHypothesis: boolean;
  labeledSimulation: boolean;
  at: string;
};

export type RegionMineAttempt = {
  id: string;
  country?: string;
  region?: string;
  language?: string;
  authorized: boolean;
  status: 'accepted' | 'denied';
  reason: string;
  at: string;
};

export type CapabilityClaim = {
  id: string;
  claim: string;
  status: 'rejected';
  reason: string;
  at: string;
};

type Store = {
  atlas: SourceAtlasEntry[];
  pathways: HistoricalPathway[];
  regionMines: RegionMineAttempt[];
  claims: CapabilityClaim[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-historical-pathway-mining.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    atlas: [],
    pathways: [],
    regionMines: [],
    claims: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOUL_PATTERNS = [
  'soul resurrection',
  'soul-resurrection',
  'afterlife',
  'raise the dead',
  'resurrect soul',
  'communicate with dead',
  'spirit channel',
];

export function historicalPathwayMiningHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    historyWithoutProvenanceEntersRoot: CK_LOCKS.HISTORY_WITHOUT_PROVENANCE_ENTERS_ROOT,
    historyWithoutEvidenceEntersRoot: CK_LOCKS.HISTORY_WITHOUT_EVIDENCE_ENTERS_ROOT,
    unauthorizedArchiveRegionMining: CK_LOCKS.UNAUTHORIZED_ARCHIVE_REGION_MINING,
    soulResurrectionClaims: CK_LOCKS.SOUL_RESURRECTION_CLAIMS,
    afterlifeCapabilityClaims: CK_LOCKS.AFTERLIFE_CAPABILITY_CLAIMS,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function enrollSourceAtlasEntry(input: {
  label: string;
  country?: string;
  region?: string;
  language?: string;
  authorized: boolean;
  consentKnown?: boolean;
  licenseKnown?: boolean;
  root: string;
  actor: CkActor;
}): Promise<SourceAtlasEntry> {
  const store = await load(input.root);
  const ok =
    input.authorized === true &&
    input.consentKnown === true &&
    input.licenseKnown === true;

  const entry: SourceAtlasEntry = {
    id: id('atlas'),
    label: input.label,
    country: input.country,
    region: input.region,
    language: input.language,
    authorized: input.authorized === true,
    consentKnown: input.consentKnown === true,
    licenseKnown: input.licenseKnown === true,
    status: ok ? 'enrolled' : 'denied',
    reason: ok
      ? 'SOURCE_ATLAS_ENTRY_AUTHORIZED'
      : UNAUTHORIZED_REGION_MINING_DENIED,
    at: new Date().toISOString(),
  };
  store.atlas.push(entry);
  await save(input.root, store);
  return entry;
}

export async function attemptArchiveRegionMining(input: {
  country?: string;
  region?: string;
  language?: string;
  authorized: boolean;
  root: string;
  actor: CkActor;
}): Promise<RegionMineAttempt> {
  const store = await load(input.root);
  const attempt: RegionMineAttempt = {
    id: id('rmine'),
    country: input.country,
    region: input.region,
    language: input.language,
    authorized: input.authorized === true,
    status: input.authorized === true ? 'accepted' : 'denied',
    reason:
      input.authorized === true
        ? 'AUTHORIZED_REGION_MINING_BOUNDED'
        : UNAUTHORIZED_REGION_MINING_DENIED,
    at: new Date().toISOString(),
  };
  store.regionMines.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function proposeHistoricalPathway(input: {
  pack: HistoryPackKind;
  label: string;
  provenanceRefs?: string[];
  evidenceRefs?: string[];
  admitToRootGraph?: boolean;
  root: string;
  actor: CkActor;
}): Promise<HistoricalPathway> {
  const store = await load(input.root);
  const provenanceRefs = input.provenanceRefs ?? [];
  const evidenceRefs = input.evidenceRefs ?? [];
  const hasProvenance = provenanceRefs.length > 0;
  const hasEvidence = evidenceRefs.length > 0;
  const wantRoot = input.admitToRootGraph === true;

  if (wantRoot && (!hasProvenance || !hasEvidence)) {
    const pathway: HistoricalPathway = {
      id: id('hpath'),
      pack: input.pack,
      label: input.label,
      provenanceRefs,
      evidenceRefs,
      hasProvenance,
      hasEvidence,
      rootGraphAdmitted: false,
      status: 'denied',
      reason: HISTORY_ROOT_WITHOUT_EVIDENCE_DENIED,
      labeledHypothesis: !hasEvidence,
      labeledSimulation: false,
      at: new Date().toISOString(),
    };
    store.pathways.push(pathway);
    await save(input.root, store);
    return pathway;
  }

  const pathway: HistoricalPathway = {
    id: id('hpath'),
    pack: input.pack,
    label: input.label,
    provenanceRefs,
    evidenceRefs,
    hasProvenance,
    hasEvidence,
    rootGraphAdmitted: wantRoot && hasProvenance && hasEvidence,
    status: wantRoot && hasProvenance && hasEvidence ? 'admitted_root' : 'candidate',
    reason:
      wantRoot && hasProvenance && hasEvidence
        ? 'PATHWAY_ADMITTED_ROOT_AFTER_PROVENANCE_EVIDENCE'
        : 'PATHWAY_CANDIDATE_AWAITING_CHECKS',
    labeledHypothesis: !hasEvidence,
    labeledSimulation: false,
    at: new Date().toISOString(),
  };
  store.pathways.push(pathway);
  await save(input.root, store);
  return pathway;
}

export async function surfaceCapabilityClaim(input: {
  claim: string;
  root: string;
  actor: CkActor;
}): Promise<CapabilityClaim> {
  const store = await load(input.root);
  const lower = input.claim.toLowerCase();
  const isSoul = SOUL_PATTERNS.some((p) => lower.includes(p));

  const claim: CapabilityClaim = {
    id: id('claim'),
    claim: input.claim,
    status: 'rejected',
    reason: isSoul
      ? SOUL_CLAIM_REJECTED
      : 'UNSUPPORTED_CAPABILITY_CLAIM_REJECTED',
    at: new Date().toISOString(),
  };
  // Always reject soul/afterlife; never accept.
  if (isSoul || true) {
    claim.status = 'rejected';
    claim.reason = isSoul ? SOUL_CLAIM_REJECTED : claim.reason;
  }
  store.claims.push(claim);
  await save(input.root, store);
  return claim;
}
