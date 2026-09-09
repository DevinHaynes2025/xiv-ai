import { appendLearning } from './learning-ledger';
import { decisionGate } from './decision-gate';
import { providerSlots, registerVerifiedProvider } from './provider-fabric';
import { GlobalBrainHighways, type BrainHighwayLane } from './global-brain-highways';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath, cortexId } from './cortex-store';
import {
  COGNITIVE_COMPILER_LOCKS,
  type EvidenceState,
  type SpecialistMethod,
} from './cognitive-compiler-types';

export type PathwayKey = {
  method: SpecialistMethod | 'operations_research';
  agent: string;
  highway: BrainHighwayLane;
};

export type PathwayScore = PathwayKey & {
  id: string;
  verifiedState: EvidenceState;
  verifiedQuality: number;
  permissionChange: false;
  authorityExpanded: false;
  productionAuthorization: false;
  createdAt: string;
};

type Store = { scores: PathwayScore[] };

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-pathway-learning.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { scores: [] });
  return { scores: Array.isArray(parsed.scores) ? parsed.scores : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { scores: store.scores.slice(-4_000) });
}

function qualityOf(state: EvidenceState): number {
  if (state === 'PASS') return 1;
  if (state === 'FAIL') return 0;
  if (state === 'WAITING_DATA' || state === 'UNAVAILABLE') return 0.1;
  return 0.2;
}

export async function recordPathwayOutcome(input: {
  tenantId: string;
  universeId: string;
  key: PathwayKey;
  verifiedState: EvidenceState;
  requestPermissionExpansion?: boolean;
  impersonateFounder?: boolean;
  highways: GlobalBrainHighways;
  root: string;
}): Promise<
  | { accepted: true; score: PathwayScore; authorityExpanded: false; permissionChange: false }
  | { accepted: false; state: 'FAIL'; reason: string; authorityExpanded: false; permissionChange: false; locks: typeof COGNITIVE_COMPILER_LOCKS }
> {
  if (input.requestPermissionExpansion || input.impersonateFounder) {
    const gate = decisionGate({
      id: 'as29-deny',
      action: 'grant_permission_via_pathway_learning',
      consequence: 'CRITICAL',
      production: false,
      financialCommitment: false,
      legalCommitment: false,
      permissionChange: true,
      externalPublication: false,
    });
    return {
      accepted: false,
      state: 'FAIL',
      reason: `AS29 learning cannot expand permissions or authority. gate.executableByAgent=${gate.executableByAgent}`,
      authorityExpanded: false,
      permissionChange: false,
      locks: COGNITIVE_COMPILER_LOCKS,
    };
  }

  const route = input.highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'evidence',
    toLane: 'learning',
    topic: `pathway:${input.key.method}`,
    body: `${input.key.agent}/${input.key.highway}/${input.verifiedState}`,
    evidenceRefs: ['62L-AS:pathway-learning'],
  });
  if (!route.accepted) {
    return {
      accepted: false,
      state: 'FAIL',
      reason: route.reason,
      authorityExpanded: false,
      permissionChange: false,
      locks: COGNITIVE_COMPILER_LOCKS,
    };
  }

  const score: PathwayScore = {
    id: cortexId('path'),
    ...input.key,
    verifiedState: input.verifiedState,
    verifiedQuality: qualityOf(input.verifiedState),
    permissionChange: false,
    authorityExpanded: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  const store = await load(input.root);
  store.scores.push(score);
  await save(input.root, store);

  const learned = await appendLearning(
    {
      domain: 'science',
      subject: `pathway:${input.key.method}:${input.key.agent}:${input.key.highway}`,
      claimState: input.verifiedState === 'PASS' ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
      summary: `verifiedState=${input.verifiedState}; quality=${score.verifiedQuality}; smarterBecauseMoreAgents=false`,
      sourceRefs: ['62L-AS:pathway-learning'],
      evidence: [score.id],
      confidence: score.verifiedQuality,
    },
    input.root,
  );

  if (learned.permissionChange !== false || learned.productionChange !== false) {
    return {
      accepted: false,
      state: 'FAIL',
      reason: 'Learning ledger attempted a permission or production change.',
      authorityExpanded: false,
      permissionChange: false,
      locks: COGNITIVE_COMPILER_LOCKS,
    };
  }

  return { accepted: true, score, authorityExpanded: false, permissionChange: false };
}

export async function routeByLearnedPathways(input: {
  candidates: PathwayKey[];
  root: string;
}): Promise<{ winner: PathwayKey | null; smarterBecauseMoreAgents: false; usedUnverified: false }> {
  const store = await load(input.root);
  let winner: PathwayKey | null = null;
  let best = -1;
  for (const candidate of input.candidates) {
    const hits = store.scores.filter(
      (item) => item.method === candidate.method && item.agent === candidate.agent && item.highway === candidate.highway && item.verifiedState === 'PASS',
    );
    const score = hits.reduce((s, item) => s + item.verifiedQuality, 0);
    if (score > best) {
      best = score;
      winner = candidate;
    }
  }
  return { winner, smarterBecauseMoreAgents: false, usedUnverified: false };
}

export function learningCannotGrantPermissions(): {
  locksUnchanged: true;
  providersStillUnavailable: boolean;
  registerWithoutEvidenceStaysUnavailable: boolean;
  autoPermissionExpansion: false;
  l4: false;
} {
  const before = providerSlots().map((slot) => ({ provider: slot.provider, state: slot.state }));
  const attempted = registerVerifiedProvider({
    provider: 'aws',
    capabilities: ['compute'],
    configured: false,
    authorized: false,
    evidenceRefs: [],
    notes: 'AS29 learning must not mark providers available.',
  });
  const after = providerSlots();
  const stillUnavailable = after.every((slot) => slot.state === 'UNAVAILABLE' || (slot.configured && slot.authorized && slot.evidenceRefs.length > 0));
  return {
    locksUnchanged: true,
    providersStillUnavailable: before.every((slot) => slot.state === 'UNAVAILABLE') && after.every((slot) => slot.provider !== 'aws' || slot.state === 'UNAVAILABLE'),
    registerWithoutEvidenceStaysUnavailable: attempted.state === 'UNAVAILABLE',
    autoPermissionExpansion: COGNITIVE_COMPILER_LOCKS.AUTO_PERMISSION_EXPANSION,
    l4: COGNITIVE_COMPILER_LOCKS.L4_AUTONOMY_ENABLED,
  };
}
