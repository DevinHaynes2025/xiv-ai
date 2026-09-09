/**
 * 62L-CJ Historical Knowledge Reconstruction Engine — evidence-backed only.
 * facts ≠ hypotheses ≠ simulations; no soul/afterlife capability claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CJ_LOCKS,
  HONESTY_BANNER,
  RECONSTRUCTION_NOT_VERIFIED_FACT,
  SOUL_CLAIM_REJECTED,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type ReconstructionLabel =
  | 'verified_fact'
  | 'hypothesis'
  | 'simulation'
  | 'rejected';

export type ReconstructionRecord = {
  id: string;
  subject: string;
  claim: string;
  evidenceRefs: string[];
  label: ReconstructionLabel;
  accepted: boolean;
  reason: string;
  soulOrAfterlifeClaim: boolean;
  productionAuthorized: false;
  at: string;
};

type Store = {
  records: ReconstructionRecord[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-knowledge-reconstruction-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { records: [], denials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOUL_PATTERNS = [
  /soul\s*resurrect/i,
  /afterlife\s*communicat/i,
  /speak\s*with\s*the\s*dead/i,
  /resurrect\s*(a\s*)?(person|soul|spirit)/i,
  /channel\s*(the\s*)?(dead|spirit|soul)/i,
];

export function reconstructionHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    reconstructionWithoutEvidenceIsVerifiedFact:
      CJ_LOCKS.RECONSTRUCTION_WITHOUT_EVIDENCE_IS_VERIFIED_FACT,
    factsEqHypotheses: CJ_LOCKS.FACTS_EQ_HYPOTHESES,
    factsEqSimulations: CJ_LOCKS.FACTS_EQ_SIMULATIONS,
    soulResurrectionClaims: CJ_LOCKS.SOUL_RESURRECTION_CLAIMS,
    afterlifeCapabilityClaims: CJ_LOCKS.AFTERLIFE_CAPABILITY_CLAIMS,
  };
}

export function isSoulOrAfterlifeClaim(claim: string): boolean {
  return SOUL_PATTERNS.some((p) => p.test(claim));
}

export async function rejectSoulResurrectionClaim(input: {
  subject: string;
  claim: string;
  root: string;
  actor: CjActor;
}): Promise<ReconstructionRecord> {
  const store = await load(input.root);
  const record: ReconstructionRecord = {
    id: id('recon'),
    subject: input.subject,
    claim: input.claim,
    evidenceRefs: [],
    label: 'rejected',
    accepted: false,
    reason: SOUL_CLAIM_REJECTED,
    soulOrAfterlifeClaim: true,
    productionAuthorized: false,
    at: new Date().toISOString(),
  };
  store.records.push(record);
  store.denials.push({
    id: id('deny'),
    at: record.at,
    reason: SOUL_CLAIM_REJECTED,
  });
  await save(input.root, store);
  return record;
}

export async function reconstructHistoricalKnowledge(input: {
  subject: string;
  claim: string;
  evidenceRefs?: string[];
  intendedLabel?: 'verified_fact' | 'hypothesis' | 'simulation';
  root: string;
  actor: CjActor;
}): Promise<ReconstructionRecord> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const claim = input.claim;

  if (isSoulOrAfterlifeClaim(claim)) {
    return rejectSoulResurrectionClaim({
      subject: input.subject,
      claim,
      root: input.root,
      actor: input.actor,
    });
  }

  const evidenceRefs = Array.isArray(input.evidenceRefs)
    ? input.evidenceRefs.filter((e) => typeof e === 'string' && e.trim().length > 0)
    : [];
  const intended = input.intendedLabel ?? 'hypothesis';

  // Without evidence, never label as verified_fact.
  if (intended === 'verified_fact' && evidenceRefs.length === 0) {
    const record: ReconstructionRecord = {
      id: id('recon'),
      subject: input.subject,
      claim,
      evidenceRefs: [],
      label: 'hypothesis',
      accepted: false,
      reason: RECONSTRUCTION_NOT_VERIFIED_FACT,
      soulOrAfterlifeClaim: false,
      productionAuthorized: false,
      at: now,
    };
    store.records.push(record);
    store.denials.push({
      id: id('deny'),
      at: now,
      reason: RECONSTRUCTION_NOT_VERIFIED_FACT,
    });
    await save(input.root, store);
    return record;
  }

  const label: ReconstructionLabel =
    intended === 'verified_fact' && evidenceRefs.length > 0
      ? 'verified_fact'
      : intended === 'simulation'
        ? 'simulation'
        : 'hypothesis';

  const record: ReconstructionRecord = {
    id: id('recon'),
    subject: input.subject,
    claim,
    evidenceRefs,
    label,
    accepted: true,
    reason:
      label === 'verified_fact'
        ? 'EVIDENCE_BACKED_VERIFIED_FACT'
        : label === 'simulation'
          ? 'LABELED_SIMULATION_NOT_VERIFIED_FACT'
          : 'LABELED_HYPOTHESIS_NOT_VERIFIED_FACT',
    soulOrAfterlifeClaim: false,
    productionAuthorized: false,
    at: now,
  };
  store.records.push(record);
  await save(input.root, store);
  return record;
}
