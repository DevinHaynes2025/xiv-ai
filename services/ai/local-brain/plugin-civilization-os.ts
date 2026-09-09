/**
 * 62L-DP Plugin Civilization OS —
 * Governed plugin ecosystem OS over DO Plugin Intelligence Mesh (soft-wire when PRESENT).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { agentToolchainFederationHonesty } from './agent-toolchain-federation';
import { crossCloudDataAdapterFabricHonesty } from './cross-cloud-data-adapter-fabric';
import { enterpriseIntegrationHighwayHonesty } from './enterprise-integration-highway';
import { offlinePluginRuntimeHonesty } from './offline-plugin-runtime';
import { pluginActionRiskGateHonesty } from './plugin-action-risk-gate';
import { pluginSecurityOperationsCenterHonesty } from './plugin-security-operations-center';
import { selfExpandingCapabilityGraphHonesty } from './self-expanding-capability-graph';
import { universalConnectorMarketplaceHonesty } from './universal-connector-marketplace';
import {
  DP_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  UNVERIFIED_SEALED_DATA_DENIED,
  detectPredecessorLayer,
  type DpActor,
} from './plugin-civilization-os-types';

export type PluginCivilizationOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  doMeshSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionPluginCivilizationShipped: false;
  createdAt: string;
};

export type SealedRouteAttempt = {
  id: string;
  pluginId: string;
  pluginVerified: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  systems: PluginCivilizationOs[];
  sealedRoutes: SealedRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-civilization-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [], sealedRoutes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectDoMesh(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-intelligence-mesh.ts')) ||
    existsSync(join(brain, 'distributed-cognitive-runtime-plugin-mesh-types.ts')) ||
    existsSync(join(brain, 'distributed-cognitive-runtime-plugin-mesh.ts'))
  );
}

export function pluginCivilizationOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DP_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DP_LOCKS.TIP_LAND,
    productionAuthorization: DP_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DP_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DP_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionPluginCivilizationShipped:
      DP_LOCKS.FULL_PRODUCTION_PLUGIN_CIVILIZATION_SHIPPED,
    liveSupabaseApply: DP_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DP_LOCKS.DB_CANDIDATES_APPLIED,
    marketplaceListingEqTrusted: DP_LOCKS.MARKETPLACE_LISTING_EQ_TRUSTED,
    marketplaceListingEqAuthority: DP_LOCKS.MARKETPLACE_LISTING_EQ_AUTHORITY,
    capabilityGraphAutoGrants: DP_LOCKS.CAPABILITY_GRAPH_GROWTH_AUTO_GRANTS_PERMISSIONS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    doMeshSoftWired: detectDoMesh(repoRoot),
    subsystems: {
      marketplace: universalConnectorMarketplaceHonesty(),
      toolchainFederation: agentToolchainFederationHonesty(),
      offlineRuntime: offlinePluginRuntimeHonesty(),
      crossCloudAdapters: crossCloudDataAdapterFabricHonesty(),
      enterpriseHighway: enterpriseIntegrationHighwayHonesty(),
      pluginSecOps: pluginSecurityOperationsCenterHonesty(),
      capabilityGraph: selfExpandingCapabilityGraphHonesty(),
      actionRiskGate: pluginActionRiskGateHonesty(),
    },
  };
}

export async function bootstrapPluginCivilizationOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DpActor;
  repoRoot?: string;
}): Promise<PluginCivilizationOs> {
  const store = await load(input.root);
  void input.actor;
  const os: PluginCivilizationOs = {
    id: id('dpcos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    doMeshSoftWired: detectDoMesh(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionPluginCivilizationShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

export async function routeSealedDataViaPlugin(input: {
  pluginId: string;
  pluginVerified: boolean;
  root: string;
  actor: DpActor;
}): Promise<SealedRouteAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: SealedRouteAttempt = {
    id: id('dpsealed'),
    pluginId: input.pluginId,
    pluginVerified: input.pluginVerified,
    status: input.pluginVerified ? 'allowed' : 'denied',
    reason: input.pluginVerified
      ? 'SEALED_ROUTE_VERIFIED_PLUGIN'
      : UNVERIFIED_SEALED_DATA_DENIED,
    at: new Date().toISOString(),
  };
  store.sealedRoutes.push(attempt);
  await save(input.root, store);
  return attempt;
}
