/**
 * 62L-DN Sovereign Privacy & Security Kernel —
 * Deny-by-default; sealed never silent leak via plugin or device fabric.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_SEALED_ATTEMPTS,
  SEALED_SILENT_LEAK_DENIED,
  type DnActor,
} from './universal-agent-runtime-os-types';

export type SovereignPrivacySecurityKernel = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  denyByDefault: true;
  sealedSilentLeak: false;
  createdAt: string;
};

export type SealedLeakAttempt = {
  id: string;
  kernelId: string;
  channel: 'plugin' | 'device_fabric' | 'direct';
  silent: boolean;
  status: 'DENIED' | 'AUTHORIZED';
  reason: string;
  at: string;
};

type Store = {
  kernels: SovereignPrivacySecurityKernel[];
  leakAttempts: SealedLeakAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'sovereign-privacy-security-kernel.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { kernels: [], leakAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sovereignPrivacySecurityKernelHonesty() {
  return {
    banner: HONESTY_BANNER,
    denyByDefault: DN_LOCKS.PRIVACY_KERNEL_DENY_BY_DEFAULT,
    sealedSilentLeak: DN_LOCKS.SEALED_SILENT_LEAK,
    sealedSilentLeakViaPlugin: DN_LOCKS.SEALED_SILENT_LEAK_VIA_PLUGIN,
    sealedSilentLeakViaDeviceFabric: DN_LOCKS.SEALED_SILENT_LEAK_VIA_DEVICE_FABRIC,
    founderSealedDenyByDefault: DN_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function bootstrapSovereignPrivacySecurityKernel(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<SovereignPrivacySecurityKernel> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.kernels.find(
    (k) =>
      k.orgId === input.orgId &&
      k.tenantId === input.tenantId &&
      k.universeId === input.universeId,
  );
  if (existing) return existing;
  const kernel: SovereignPrivacySecurityKernel = {
    id: id('dnpriv'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    denyByDefault: true,
    sealedSilentLeak: false,
    createdAt: new Date().toISOString(),
  };
  store.kernels.push(kernel);
  await save(input.root, store);
  return kernel;
}

export async function attemptSealedSilentLeak(input: {
  kernelId: string;
  channel: SealedLeakAttempt['channel'];
  silent?: boolean;
  authorizedExplicit?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; attempt: SealedLeakAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const kernel = store.kernels.find((k) => k.id === input.kernelId);
  const now = new Date().toISOString();
  if (!kernel) {
    const attempt: SealedLeakAttempt = {
      id: id('dnleak'),
      kernelId: input.kernelId,
      channel: input.channel,
      silent: input.silent !== false,
      status: 'DENIED',
      reason: 'SOVEREIGN_PRIVACY_KERNEL_NOT_FOUND',
      at: now,
    };
    store.leakAttempts.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  if (store.leakAttempts.length >= MAX_SEALED_ATTEMPTS) {
    const attempt: SealedLeakAttempt = {
      id: id('dnleak'),
      kernelId: input.kernelId,
      channel: input.channel,
      silent: input.silent !== false,
      status: 'DENIED',
      reason: 'MAX_SEALED_ATTEMPTS_REACHED',
      at: now,
    };
    store.leakAttempts.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  const silent = input.silent !== false;
  if (silent || input.authorizedExplicit !== true) {
    const attempt: SealedLeakAttempt = {
      id: id('dnleak'),
      kernelId: input.kernelId,
      channel: input.channel,
      silent,
      status: 'DENIED',
      reason: SEALED_SILENT_LEAK_DENIED,
      at: now,
    };
    store.leakAttempts.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  // Explicit non-silent authorized path still deny-by-default for sealed content
  // in this contract layer (no silent leak, no production export).
  const attempt: SealedLeakAttempt = {
    id: id('dnleak'),
    kernelId: input.kernelId,
    channel: input.channel,
    silent: false,
    status: 'DENIED',
    reason: SEALED_SILENT_LEAK_DENIED,
    at: now,
  };
  store.leakAttempts.push(attempt);
  await save(input.root, store);
  return { accepted: false, reason: attempt.reason, attempt };
}
