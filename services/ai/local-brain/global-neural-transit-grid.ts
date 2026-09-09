/**
 * 62L-DM Global Neural Transit Grid —
 * Expands DL neural transportation / DK neural highways into a global transit grid.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DM_LOCKS,
  HONESTY_BANNER,
  MAX_TRANSIT_CORRIDORS,
  type DmActor,
} from './global-neural-transit-civilization-atlas-types';

export type GlobalNeuralTransitGrid = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DL' | 'DK' | 'DJ' | 'DI' | 'DH' | 'DG' | 'NONE';
  physicalVehicleControl: false;
  createdAt: string;
};

export type TransitCorridor = {
  id: string;
  gridId: string;
  name: string;
  fromRegion: string;
  toRegion: string;
  sealedBypassAttempt: boolean;
  status: 'OPEN' | 'DENIED' | 'BOUNDED';
  reason: string;
  createdAt: string;
};

type Store = { grids: GlobalNeuralTransitGrid[]; corridors: TransitCorridor[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-neural-transit-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { grids: [], corridors: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectTransitPredecessor(repoRoot?: string): GlobalNeuralTransitGrid['predecessorLayer'] {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  if (existsSync(join(brain, 'neural-transportation-os-types.ts'))) return 'DL';
  if (existsSync(join(brain, 'unified-intelligence-experience-os-types.ts'))) return 'DK';
  if (existsSync(join(brain, 'personal-intelligence-command-os-types.ts'))) return 'DJ';
  if (existsSync(join(brain, 'personalized-intelligence-companion-os-types.ts'))) return 'DI';
  if (existsSync(join(brain, 'adaptive-life-business-intelligence-os-types.ts'))) return 'DH';
  if (existsSync(join(brain, 'universal-personal-business-ai-os-types.ts'))) return 'DG';
  return 'NONE';
}

export function globalNeuralTransitGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    physicalVehicleControl: false,
    expandsDlNeuralTransportation: true,
    softWiresDkNeuralHighwayWhenPresent: true,
    sealedBypassDenied: true,
    localFirst: DM_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DM_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function bootstrapGlobalNeuralTransitGrid(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
  repoRoot?: string;
}): Promise<GlobalNeuralTransitGrid> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.grids.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectTransitPredecessor(input.repoRoot);
  const brain = input.repoRoot
    ? join(input.repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');

  if (predecessorLayer === 'DL') {
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
            actor: input.actor,
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  } else if (predecessorLayer === 'DK') {
    try {
      const mod = join(brain, 'neural-highway-expansion.ts');
      if (existsSync(mod)) {
        const dk = await import(mod);
        if (typeof dk.bootstrapNeuralHighwayExpansion === 'function') {
          await dk.bootstrapNeuralHighwayExpansion({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'neural_highway_governor',
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
      // Soft-wire optional.
    }
  }

  const grid: GlobalNeuralTransitGrid = {
    id: id('dmgrid'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    physicalVehicleControl: false,
    createdAt: new Date().toISOString(),
  };
  store.grids.push(grid);
  await save(input.root, store);
  return grid;
}

export async function openTransitCorridor(input: {
  gridId: string;
  name: string;
  fromRegion: string;
  toRegion: string;
  attemptSealedBypass?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; corridor?: TransitCorridor; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const grid = store.grids.find((g) => g.id === input.gridId);
  if (!grid) return { accepted: false, reason: 'GRID_NOT_FOUND', at: now };

  if (store.corridors.length >= MAX_TRANSIT_CORRIDORS) {
    return { accepted: false, reason: 'MAX_TRANSIT_CORRIDORS_REACHED', at: now };
  }

  if (input.attemptSealedBypass === true) {
    const corridor: TransitCorridor = {
      id: id('dmcorr'),
      gridId: input.gridId,
      name: input.name,
      fromRegion: input.fromRegion,
      toRegion: input.toRegion,
      sealedBypassAttempt: true,
      status: 'DENIED',
      reason: 'TRANSIT_CORRIDOR_SEALED_BYPASS_DENIED',
      createdAt: now,
    };
    store.corridors.push(corridor);
    await save(input.root, store);
    return { accepted: false, reason: corridor.reason, corridor, at: now };
  }

  const corridor: TransitCorridor = {
    id: id('dmcorr'),
    gridId: input.gridId,
    name: input.name.trim() || 'unnamed-corridor',
    fromRegion: input.fromRegion,
    toRegion: input.toRegion,
    sealedBypassAttempt: false,
    status: 'BOUNDED',
    reason: 'GLOBAL_NEURAL_TRANSIT_CORRIDOR_OPEN_BOUNDED',
    createdAt: now,
  };
  store.corridors.push(corridor);
  await save(input.root, store);
  return { accepted: true, reason: corridor.reason, corridor, at: now };
}
