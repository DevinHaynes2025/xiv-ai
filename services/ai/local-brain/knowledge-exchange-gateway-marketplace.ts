/**
 * 62L-DE Knowledge Exchange Gateway Marketplace façade —
 * Unified kernel over knowledge exchange, marketplace, fabric, competition lab,
 * capacity planner, incubator, and resilience/recovery orchestrator.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  type DeActor,
} from './knowledge-exchange-gateway-marketplace-types';
import { knowledgeExchangeKernelHonesty } from './superbrain-knowledge-exchange-kernel';
import { agentGatewayMarketplaceHonesty } from './agent-gateway-marketplace';
import { federatedDataMemoryFabricHonesty } from './federated-data-memory-fabric';
import { continuousModelCompetitionLabHonesty } from './continuous-model-competition-lab';
import { computeCapacityPlannerHonesty } from './distributed-compute-capacity-planner';
import { aiCompanyIncubatorHonesty } from './autonomous-ai-company-incubator';
import { resilienceRecoveryOrchestratorHonesty } from './multi-universe-resilience-recovery-orchestrator';

export type KnowledgeExchangeGatewayMarketplace = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DD' | 'DC' | 'DB' | 'DA' | 'CZ' | 'CY' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  createdAt: string;
};

type Store = { systems: KnowledgeExchangeGatewayMarketplace[] };

function storePath(root: string) {
  return xivLocalPath(root, 'knowledge-exchange-gateway-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBrainPath(repoRoot?: string): string {
  if (repoRoot) return join(repoRoot, 'services/ai/local-brain');
  return join(process.cwd(), 'services/ai/local-brain');
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DD' | 'DC' | 'DB' | 'DA' | 'CZ' | 'CY' | 'NONE' {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-service-fabric-types.ts'))) return 'DC';
  if (existsSync(join(brain, 'superbrain-control-plane-types.ts'))) return 'DB';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  if (existsSync(join(brain, 'intelligence-civilization-kernel-types.ts'))) return 'CZ';
  if (existsSync(join(brain, 'knowledge-colony-operating-system-types.ts'))) return 'CY';
  return 'NONE';
}

export function knowledgeExchangeGatewayMarketplaceHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DE_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DE_LOCKS.TIP_LAND,
    productionAuthorization: DE_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DE_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DE_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      knowledgeExchange: knowledgeExchangeKernelHonesty(),
      marketplace: agentGatewayMarketplaceHonesty(),
      fabric: federatedDataMemoryFabricHonesty(),
      competitionLab: continuousModelCompetitionLabHonesty(),
      capacityPlanner: computeCapacityPlannerHonesty(),
      incubator: aiCompanyIncubatorHonesty(),
      resilienceRecovery: resilienceRecoveryOrchestratorHonesty(),
    },
  };
}

export async function bootstrapKnowledgeExchangeGatewayMarketplace(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DeActor;
  repoRoot?: string;
}): Promise<KnowledgeExchangeGatewayMarketplace> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  // Soft-wire DD cognitive service mesh façade when PRESENT (coexistence).
  if (predecessorLayer === 'DD') {
    try {
      const ddMod = join(brain, 'cognitive-service-mesh.ts');
      if (existsSync(ddMod)) {
        const dd = await import(ddMod);
        if (typeof dd.bootstrapCognitiveServiceMesh === 'function') {
          await dd.bootstrapCognitiveServiceMesh({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'mesh_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional; absence is WAITING_DATA not failure.
    }
  }

  // Soft-wire CY colony OS when PRESENT and DD absent.
  if (predecessorLayer === 'CY' || predecessorLayer === 'CZ' || predecessorLayer === 'DA') {
    try {
      const cyMod = join(brain, 'knowledge-colony-operating-system.ts');
      if (existsSync(cyMod)) {
        const cy = await import(cyMod);
        if (typeof cy.bootstrapKnowledgeColonyOperatingSystem === 'function') {
          await cy.bootstrapKnowledgeColonyOperatingSystem({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'colony_os_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  }

  const system: KnowledgeExchangeGatewayMarketplace = {
    id: id('kegm'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
