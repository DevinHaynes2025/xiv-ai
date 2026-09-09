/**
 * 62L-DC Multi-Universe State Compiler & Disaster Recovery Fabric —
 * Signed Multi-Universe state compilation with DR simulation and rollback planning.
 * Unsigned/revoked packs REJECTED.
 * DR simulation ≠ auto production restore / real disaster authorization.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DC_LOCKS,
  DR_SIMULATION_NOT_AUTO_RESTORE,
  HONESTY_BANNER,
  MAX_DR_PLANS,
  MAX_STATE_COMPILE_PACKS,
  UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
  type DcActor,
} from './superbrain-service-fabric-types';

export type StateCompilePack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type DrPlan = {
  id: string;
  packId: string | null;
  mode: 'simulation' | 'rollback_plan' | 'auto_production_restore';
  labeledSimulation: boolean;
  productionRestoreAuthorized: false;
  status: 'PLAN_ONLY' | 'LABELED_SIMULATION' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type CompilerDrResult = {
  accepted: boolean;
  reason: string;
  pack?: StateCompilePack;
  plan?: DrPlan;
  at: string;
};

type Store = {
  packs: StateCompilePack[];
  plans: DrPlan[];
  revokedPackIds: string[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-universe-state-compiler-dr-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    packs: [],
    plans: [],
    revokedPackIds: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signStateCompilePayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function multiUniverseStateCompilerDrHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DC_LOCKS.UNSIGNED_STATE_COMPILE_PACK_ACCEPTED,
    revokedAccepted: DC_LOCKS.REVOKED_STATE_COMPILE_PACK_ACCEPTED,
    drSimulationAutoProductionRestore: DC_LOCKS.DR_SIMULATION_AUTO_PRODUCTION_RESTORE,
    productionAuthorization: DC_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function compileMultiUniverseStatePack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  revoked?: boolean;
  packIdToReuse?: string | null;
  root: string;
  actor: DcActor;
}): Promise<CompilerDrResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_STATE_COMPILE_PACKS) {
    return { accepted: false, reason: 'MAX_STATE_COMPILE_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const packId = input.packIdToReuse?.trim() || id('musc');

  if (input.revoked === true || store.revokedPackIds.includes(packId)) {
    const pack: StateCompilePack = {
      id: packId,
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature: input.signature ?? null,
      signed: Boolean(input.signature),
      revoked: true,
      status: 'REJECTED',
      reason: UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    if (!store.revokedPackIds.includes(packId)) store.revokedPackIds.push(packId);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!input.signature?.trim()) {
    const pack: StateCompilePack = {
      id: packId,
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature: null,
      signed: false,
      revoked: false,
      status: 'REJECTED',
      reason: UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.signingKey) {
    const expected = signStateCompilePayload(input.payload, input.signingKey);
    if (expected !== input.signature) {
      const pack: StateCompilePack = {
        id: packId,
        sourceUniverseId: input.sourceUniverseId,
        targetUniverseId: input.targetUniverseId,
        payloadDigest: digest,
        signature: input.signature,
        signed: false,
        revoked: false,
        status: 'REJECTED',
        reason: UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
        createdAt: now,
      };
      store.packs.push(pack);
      await save(input.root, store);
      return { accepted: false, reason: pack.reason, pack, at: now };
    }
  }

  const pack: StateCompilePack = {
    id: packId,
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    payloadDigest: digest,
    signature: input.signature,
    signed: true,
    revoked: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_MULTI_UNIVERSE_STATE_COMPILE_PACK_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function revokeStateCompilePack(input: {
  packId: string;
  root: string;
  actor: DcActor;
}): Promise<CompilerDrResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.packId);
  if (!pack) {
    return { accepted: false, reason: 'STATE_COMPILE_PACK_NOT_FOUND', at: now };
  }
  pack.revoked = true;
  pack.status = 'REJECTED';
  pack.reason = UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED;
  if (!store.revokedPackIds.includes(pack.id)) store.revokedPackIds.push(pack.id);
  await save(input.root, store);
  return { accepted: true, reason: 'STATE_COMPILE_PACK_REVOKED', pack, at: now };
}

export async function planDisasterRecovery(input: {
  packId?: string | null;
  mode: 'simulation' | 'rollback_plan' | 'auto_production_restore';
  root: string;
  actor: DcActor;
}): Promise<CompilerDrResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.plans.length >= MAX_DR_PLANS) {
    return { accepted: false, reason: 'MAX_DR_PLANS_BOUNDED', at: now };
  }

  if (input.mode === 'auto_production_restore') {
    const plan: DrPlan = {
      id: id('dr'),
      packId: input.packId ?? null,
      mode: 'auto_production_restore',
      labeledSimulation: false,
      productionRestoreAuthorized: false,
      status: 'DENIED',
      reason: DR_SIMULATION_NOT_AUTO_RESTORE,
      createdAt: now,
    };
    store.plans.push(plan);
    await save(input.root, store);
    return { accepted: false, reason: plan.reason, plan, at: now };
  }

  const plan: DrPlan = {
    id: id('dr'),
    packId: input.packId ?? null,
    mode: input.mode,
    labeledSimulation: input.mode === 'simulation',
    productionRestoreAuthorized: false,
    status: input.mode === 'simulation' ? 'LABELED_SIMULATION' : 'PLAN_ONLY',
    reason:
      input.mode === 'simulation'
        ? 'DR_SIMULATION_LABELED_NOT_PRODUCTION_RESTORE'
        : 'DR_ROLLBACK_PLAN_ONLY_NO_AUTO_PROD_RESTORE',
    createdAt: now,
  };
  store.plans.push(plan);
  await save(input.root, store);
  return { accepted: true, reason: plan.reason, plan, at: now };
}
