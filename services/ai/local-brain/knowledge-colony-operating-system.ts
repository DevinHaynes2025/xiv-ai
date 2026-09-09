/**
 * 62L-CY Knowledge Colony Operating System façade —
 * Unified OS layer over research societies, multi-model compiler,
 * nervous system, compute economy, AI service foundry, and universe routing.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  type CyActor,
} from './knowledge-colony-operating-system-types';
import { researchSocietiesHonesty } from './persistent-agent-research-societies';
import { multiModelIntelligenceCompilerHonesty } from './multi-model-intelligence-compiler';
import { nervousSystemHonesty } from './distributed-memory-experiment-nervous-system';
import { computeEconomyHonesty } from './adaptive-gpu-quantum-compute-economy';
import { aiServiceFoundryHonesty } from './agent-built-ai-service-foundry';
import { universeKnowledgeRoutingHonesty } from './universe-knowledge-routing-grid';

export type KnowledgeColonyOperatingSystem = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'CX' | 'CW' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  createdAt: string;
};

type Store = { systems: KnowledgeColonyOperatingSystem[] };

function storePath(root: string) {
  return xivLocalPath(root, 'knowledge-colony-operating-system.json');
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

export function detectPredecessorLayer(repoRoot?: string): 'CX' | 'CW' | 'NONE' {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'persistent-knowledge-civilization-types.ts'))) return 'CX';
  if (existsSync(join(brain, 'autonomous-research-infrastructure-os-types.ts'))) {
    return 'CW';
  }
  return 'NONE';
}

export function knowledgeColonyOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CY_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: CY_LOCKS.TIP_LAND,
    productionAuthorization: CY_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: CY_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: CY_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      societies: researchSocietiesHonesty(),
      compiler: multiModelIntelligenceCompilerHonesty(),
      nervousSystem: nervousSystemHonesty(),
      computeEconomy: computeEconomyHonesty(),
      aiServiceFoundry: aiServiceFoundryHonesty(),
      universeRouting: universeKnowledgeRoutingHonesty(),
    },
  };
}

export async function bootstrapKnowledgeColonyOperatingSystem(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CyActor;
  repoRoot?: string;
}): Promise<KnowledgeColonyOperatingSystem> {
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

  // Soft-wire CX civilization façade when PRESENT (coexistence; not production auth).
  if (predecessorLayer === 'CX') {
    try {
      const cxMod = join(brain, 'persistent-knowledge-civilization.ts');
      if (existsSync(cxMod)) {
        const cx = await import(cxMod);
        if (typeof cx.bootstrapPersistentKnowledgeCivilization === 'function') {
          await cx.bootstrapPersistentKnowledgeCivilization({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'civilization_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
          });
        }
      }
    } catch {
      // CX wire optional — WAITING_DATA / partial tip tolerated
    }
  }

  const system: KnowledgeColonyOperatingSystem = {
    id: id('kcos'),
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
