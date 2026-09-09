/**
 * 62L-DO Distributed Cognitive Runtime Fabric —
 * Unifies prior DN/DM (or DK fallback) cognitive layers into one fabric.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DO_LOCKS,
  HONESTY_BANNER,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type CognitiveRuntimeFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DN' | 'DM' | 'DL' | 'DK' | 'DJ' | 'DI' | 'DH' | 'CP' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  localFirst: true;
  createdAt: string;
};

type Store = {
  fabrics: CognitiveRuntimeFabric[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-cognitive-runtime-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [] });
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

export function detectCognitivePredecessorLayer(
  repoRoot?: string,
): CognitiveRuntimeFabric['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'universal-agent-runtime-os-types.ts'))) return 'DN';
  if (
    existsSync(join(brain, 'planetary-civilization-intelligence-os-types.ts')) ||
    existsSync(join(brain, 'global-neural-transit-civilization-atlas-types.ts'))
  )
    return 'DM';
  if (
    existsSync(join(brain, 'neural-transportation-os-types.ts')) ||
    existsSync(join(brain, 'global-intelligence-transit-fabric-types.ts'))
  )
    return 'DL';
  if (existsSync(join(brain, 'unified-intelligence-experience-os-types.ts'))) return 'DK';
  if (existsSync(join(brain, 'personal-intelligence-command-os-types.ts'))) return 'DJ';
  if (existsSync(join(brain, 'personalized-intelligence-companion-os-types.ts'))) return 'DI';
  if (existsSync(join(brain, 'adaptive-life-business-intelligence-os-types.ts'))) return 'DH';
  if (existsSync(join(brain, 'knowledge-supply-plugin-foundry-types.ts'))) return 'CP';
  return 'NONE';
}

export function distributedCognitiveRuntimeFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DO_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DO_LOCKS.TIP_LAND,
    productionAuthorization: DO_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DO_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DO_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    megaPrBulkIncluded: DO_LOCKS.MEGA_PR_BULK_INCLUDED,
  };
}

export async function bootstrapDistributedCognitiveRuntimeFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DoActor;
  repoRoot?: string;
}): Promise<CognitiveRuntimeFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectCognitivePredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  // Soft-wire preferred predecessor OS when PRESENT (DN→DM→DL→DK).
  if (predecessorLayer === 'DN') {
    try {
      const mod = join(brain, 'universal-agent-runtime-os.ts');
      if (existsSync(mod)) {
        const dn = await import(mod);
        if (typeof dn.bootstrapUniversalAgentRuntimeOs === 'function') {
          await dn.bootstrapUniversalAgentRuntimeOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'runtime_os_curator',
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
  } else if (predecessorLayer === 'DL') {
    try {
      const mod = join(brain, 'neural-transportation-os.ts');
      if (existsSync(mod)) {
        const dl = await import(mod);
        if (typeof dl.bootstrapNeuralTransportationOs === 'function') {
          await dl.bootstrapNeuralTransportationOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'transport_os_curator',
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
  } else if (predecessorLayer === 'DK') {
    try {
      const mod = join(brain, 'unified-intelligence-experience-os.ts');
      if (existsSync(mod)) {
        const dk = await import(mod);
        if (typeof dk.bootstrapUnifiedIntelligenceExperienceOs === 'function') {
          await dk.bootstrapUnifiedIntelligenceExperienceOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'experience_os_curator',
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

  const fabric: CognitiveRuntimeFabric = {
    id: id('dofabric'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    localFirst: true,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}
