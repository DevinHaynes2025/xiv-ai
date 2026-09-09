/**
 * 62L-DQ Universal Integration Brain —
 * Intelligent integration brain over plugin civilization (soft-wire DP when PRESENT).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { agentApiGatewayCivilizationHonesty } from './agent-api-gateway-civilization';
import { capabilityDiscoveryCompositionBrainHonesty } from './capability-discovery-composition-brain';
import { enterpriseDataTranslationGridHonesty } from './enterprise-data-translation-grid';
import { globalBusinessSystemsInteropLayerHonesty } from './global-business-systems-interop-layer';
import { localEdgeConnectorRuntimeHonesty } from './local-edge-connector-runtime';
import { pluginMarketplaceIntelligenceHonesty } from './plugin-marketplace-intelligence';
import { securityTrustScoringEngineHonesty } from './security-trust-scoring-engine';
import {
  DQ_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  detectPredecessorLayer,
  type DqActor,
} from './universal-integration-brain-types';

export type UniversalIntegrationBrain = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  dpCivilizationSoftWired: boolean;
  doMeshSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionUniversalIntegrationBrainShipped: false;
  createdAt: string;
};

type Store = {
  brains: UniversalIntegrationBrain[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-integration-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { brains: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectDpCivilization(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-civilization-os-types.ts')) ||
    existsSync(join(brain, 'plugin-civilization-os.ts')) ||
    existsSync(join(brain, 'plugin-action-risk-gate.ts'))
  );
}

function detectDoMesh(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-intelligence-mesh.ts')) ||
    existsSync(join(brain, 'distributed-cognitive-runtime-plugin-mesh-types.ts'))
  );
}

export function universalIntegrationBrainHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DQ_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DQ_LOCKS.TIP_LAND,
    productionAuthorization: DQ_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DQ_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DQ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionUniversalIntegrationBrainShipped:
      DQ_LOCKS.FULL_PRODUCTION_UNIVERSAL_INTEGRATION_BRAIN_SHIPPED,
    liveSupabaseApply: DQ_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DQ_LOCKS.DB_CANDIDATES_APPLIED,
    perCallAuthorizationRequired: DQ_LOCKS.PER_CALL_AUTHORIZATION_REQUIRED,
    trustScoreGrantsBroaderScopes: DQ_LOCKS.TRUST_SCORE_GRANTS_BROADER_SCOPES,
    compositionEscalatesPermissions: DQ_LOCKS.COMPOSITION_ESCALATES_PERMISSIONS,
    learningEqPermission: DQ_LOCKS.LEARNING_EQ_PERMISSION,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    dpCivilizationSoftWired: detectDpCivilization(repoRoot),
    doMeshSoftWired: detectDoMesh(repoRoot),
    subsystems: {
      apiGateway: agentApiGatewayCivilizationHonesty(),
      edgeConnectorRuntime: localEdgeConnectorRuntimeHonesty(),
      translationGrid: enterpriseDataTranslationGridHonesty(),
      marketplaceIntelligence: pluginMarketplaceIntelligenceHonesty(),
      trustScoring: securityTrustScoringEngineHonesty(),
      capabilityComposition: capabilityDiscoveryCompositionBrainHonesty(),
      interopLayer: globalBusinessSystemsInteropLayerHonesty(),
    },
  };
}

export async function bootstrapUniversalIntegrationBrain(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DqActor;
  repoRoot?: string;
}): Promise<UniversalIntegrationBrain> {
  const store = await load(input.root);
  void input.actor;
  const brain: UniversalIntegrationBrain = {
    id: id('dqbrain'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    dpCivilizationSoftWired: detectDpCivilization(input.repoRoot),
    doMeshSoftWired: detectDoMesh(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionUniversalIntegrationBrainShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.brains.push(brain);
  await save(input.root, store);
  return brain;
}
