/**
 * 62L-CN Historical Infrastructure Intelligence Atlas —
 * Temporal atlas of ports, shipping, roads, rail, aviation, energy, telecom,
 * data centers, manufacturing clusters, institutional/financial infrastructure.
 * Provenance required for VERIFIED; sim/incomplete labeled; all-world claims rejected without evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_WORLD_COVERAGE_REJECTED,
  ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE,
  CN_LOCKS,
  HONESTY_BANNER,
  type CnActor,
  type CnEvidenceState,
} from './world-knowledge-routing-os-types';

export type InfrastructureDomain =
  | 'ports'
  | 'shipping'
  | 'roads'
  | 'rail'
  | 'aviation'
  | 'energy'
  | 'telecom'
  | 'data_centers'
  | 'manufacturing_clusters'
  | 'institutional_financial';

export type AtlasCoverageLabel =
  | 'VERIFIED'
  | 'LABELED_SIMULATION'
  | 'LABELED_INCOMPLETE'
  | 'DOCUMENTED'
  | 'REJECTED'
  | 'UNKNOWN';

export type AtlasEntry = {
  id: string;
  domain: InfrastructureDomain;
  region: string;
  eraStart: string;
  eraEnd: string | null;
  summary: string;
  provenanceRefs: string[];
  coverageLabel: AtlasCoverageLabel;
  verificationState: CnEvidenceState;
  createdAt: string;
};

export type AtlasClaimResult = {
  accepted: boolean;
  reason: string;
  entry?: AtlasEntry;
  at: string;
};

type Store = {
  entries: AtlasEntry[];
  claimDenials: Array<{ id: string; at: string; reason: string; claim: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-infrastructure-intelligence-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [], claimDenials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function atlasHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    atlasWithoutProvenanceVerified: CN_LOCKS.ATLAS_WITHOUT_PROVENANCE_VERIFIED,
    allWorldCoverageWithoutEvidence: CN_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE,
  };
}

export async function upsertAtlasEntry(input: {
  domain: InfrastructureDomain;
  region: string;
  eraStart: string;
  eraEnd?: string | null;
  summary: string;
  provenanceRefs?: string[];
  simulation?: boolean;
  incomplete?: boolean;
  root: string;
  actor: CnActor;
}): Promise<AtlasClaimResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const provenance = (input.provenanceRefs ?? []).filter(Boolean);

  let coverageLabel: AtlasCoverageLabel = 'UNKNOWN';
  let verificationState: CnEvidenceState = 'UNKNOWN';

  if (input.simulation === true) {
    coverageLabel = 'LABELED_SIMULATION';
    verificationState = 'LABELED_SIMULATION';
  } else if (input.incomplete === true || provenance.length === 0) {
    coverageLabel = provenance.length === 0 ? 'LABELED_INCOMPLETE' : 'LABELED_INCOMPLETE';
    verificationState =
      provenance.length === 0
        ? ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE.includes('NOT_LABELED')
          ? 'LABELED_INCOMPLETE'
          : 'LABELED_INCOMPLETE'
        : 'LABELED_INCOMPLETE';
    if (provenance.length === 0) {
      const entry: AtlasEntry = {
        id: id('atlas'),
        domain: input.domain,
        region: input.region,
        eraStart: input.eraStart,
        eraEnd: input.eraEnd ?? null,
        summary: input.summary,
        provenanceRefs: [],
        coverageLabel: 'LABELED_INCOMPLETE',
        verificationState: 'DOCUMENTED',
        createdAt: now,
      };
      store.entries.push(entry);
      await save(input.root, store);
      return {
        accepted: true,
        reason: ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE,
        entry,
        at: now,
      };
    }
  } else if (provenance.length > 0) {
    coverageLabel = 'VERIFIED';
    verificationState = 'VERIFIED';
  }

  const entry: AtlasEntry = {
    id: id('atlas'),
    domain: input.domain,
    region: input.region,
    eraStart: input.eraStart,
    eraEnd: input.eraEnd ?? null,
    summary: input.summary,
    provenanceRefs: provenance,
    coverageLabel,
    verificationState,
    createdAt: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return {
    accepted: true,
    reason:
      coverageLabel === 'VERIFIED'
        ? 'ATLAS_ENTRY_VERIFIED_WITH_PROVENANCE'
        : coverageLabel === 'LABELED_SIMULATION'
          ? 'ATLAS_ENTRY_LABELED_SIMULATION'
          : 'ATLAS_ENTRY_RECORDED',
    entry,
    at: now,
  };
}

export async function claimAllWorldCoverage(input: {
  claim: string;
  evidenceRefs?: string[];
  root: string;
  actor: CnActor;
}): Promise<AtlasClaimResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const evidence = (input.evidenceRefs ?? []).filter(Boolean);

  // Unsupported all-world claims without comprehensive evidence are REJECTED / not VERIFIED.
  if (evidence.length === 0) {
    store.claimDenials.push({
      id: id('aclaim'),
      at: now,
      reason: ALL_WORLD_COVERAGE_REJECTED,
      claim: input.claim,
    });
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALL_WORLD_COVERAGE_REJECTED,
      at: now,
    };
  }

  // Even with some evidence, do not auto-label VERIFIED for all-world claims.
  store.claimDenials.push({
    id: id('aclaim'),
    at: now,
    reason: ALL_WORLD_COVERAGE_REJECTED,
    claim: input.claim,
  });
  await save(input.root, store);
  return {
    accepted: false,
    reason: ALL_WORLD_COVERAGE_REJECTED,
    at: now,
  };
}
