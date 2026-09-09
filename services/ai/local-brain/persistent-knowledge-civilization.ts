/**
 * 62L-CX Persistent Knowledge Civilization façade —
 * Civilization-layer bootstrap over offline colonies, evolution lab,
 * memory fabric, accelerator grid, tool ecosystem, and compiler.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  type CxActor,
} from './persistent-knowledge-civilization-types';
import { offlineColonyNetworkHonesty } from './offline-research-colony-network';
import { multiModelEvolutionLabHonesty } from './multi-model-evolution-laboratory';
import { scientificMemoryFabricHonesty } from './distributed-scientific-memory-fabric';
import { adaptiveAcceleratorGridHonesty } from './adaptive-accelerator-grid';
import { toolEcosystemHonesty } from './agent-built-research-tool-ecosystem';
import { intelligenceCompilerHonesty } from './cross-universe-intelligence-compiler';

export type PersistentKnowledgeCivilization = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  createdAt: string;
};

type Store = { civilizations: PersistentKnowledgeCivilization[] };

function storePath(root: string) {
  return xivLocalPath(root, 'persistent-knowledge-civilization.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { civilizations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function persistentKnowledgeCivilizationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CX_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: CX_LOCKS.TIP_LAND,
    productionAuthorization: CX_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: CX_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: CX_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      colonies: offlineColonyNetworkHonesty(),
      evolutionLab: multiModelEvolutionLabHonesty(),
      memoryFabric: scientificMemoryFabricHonesty(),
      acceleratorGrid: adaptiveAcceleratorGridHonesty(),
      toolEcosystem: toolEcosystemHonesty(),
      compiler: intelligenceCompilerHonesty(),
    },
  };
}

export async function bootstrapPersistentKnowledgeCivilization(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CxActor;
}): Promise<PersistentKnowledgeCivilization> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.civilizations.find(
    (c) =>
      c.orgId === input.orgId &&
      c.tenantId === input.tenantId &&
      c.universeId === input.universeId,
  );
  if (existing) return existing;
  const civ: PersistentKnowledgeCivilization = {
    id: id('pkc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    createdAt: new Date().toISOString(),
  };
  store.civilizations.push(civ);
  await save(input.root, store);
  return civ;
}
