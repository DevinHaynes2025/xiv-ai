/**
 * 62L-BW Founder Avatar Delegate Universe — sparse logical pathways, bounded
 * activation. Hard denies: impersonation, deal approval, money movement,
 * production deploy, external publish.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACTIVATION_BOUNDED,
  AVATAR_DEAL_APPROVAL_DENIED,
  AVATAR_DEPLOY_DENIED,
  AVATAR_IMPERSONATION_DENIED,
  AVATAR_MONEY_MOVE_DENIED,
  AVATAR_PUBLISH_DENIED,
  BW_LOCKS,
  HONESTY_BANNER,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type AvatarAction =
  | 'advise'
  | 'research'
  | 'route'
  | 'draft'
  | 'impersonate_founder'
  | 'approve_deal'
  | 'move_money'
  | 'deploy_production'
  | 'external_publish';

export type FounderAvatarDelegate = {
  id: string;
  pathwayKey: string;
  logicalOnly: true;
  sparse: true;
  active: boolean;
  canImpersonateFounder: false;
  canApproveDeals: false;
  canMoveMoney: false;
  canDeployProduction: false;
  canPublishExternally: false;
  productionAuthorization: false;
  createdAt: string;
  actorId: string;
};

type Store = {
  delegates: FounderAvatarDelegate[];
  denials: Array<{ id: string; action: AvatarAction; reason: string; at: string; actorId: string }>;
  activeCount: number;
};

/** Soft bound on concurrent activated sparse pathways (not live founder processes). */
export const MAX_ACTIVE_AVATAR_PATHWAYS = 64 as const;

function storePath(root: string) {
  return xivLocalPath(root, 'founder-avatar-delegate-universe.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    delegates: [],
    denials: [],
    activeCount: 0,
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function founderAvatarHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    founderImpersonation: BW_LOCKS.FOUNDER_IMPERSONATION,
    approveDeals: BW_LOCKS.AVATAR_APPROVE_DEALS,
    moveMoney: BW_LOCKS.AVATAR_MOVE_MONEY,
    deployProduction: BW_LOCKS.AVATAR_DEPLOY_PRODUCTION,
    externalPublish: BW_LOCKS.AVATAR_EXTERNAL_PUBLISH,
    sparseLogicalOnly: BW_LOCKS.SPARSE_LOGICAL_ONLY,
    maxActivePathways: MAX_ACTIVE_AVATAR_PATHWAYS,
  };
}

export async function activateSparseFounderAvatar(input: {
  pathwayKey: string;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const active = store.delegates.filter((d) => d.active).length;
  if (active >= MAX_ACTIVE_AVATAR_PATHWAYS) {
    return {
      accepted: false as const,
      reason: ACTIVATION_BOUNDED,
      activeCount: active,
      maxActive: MAX_ACTIVE_AVATAR_PATHWAYS,
      delegate: null,
    };
  }
  const delegate: FounderAvatarDelegate = {
    id: id('avatar'),
    pathwayKey: input.pathwayKey.trim() || 'default',
    logicalOnly: true,
    sparse: true,
    active: true,
    canImpersonateFounder: false,
    canApproveDeals: false,
    canMoveMoney: false,
    canDeployProduction: false,
    canPublishExternally: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.delegates.push(delegate);
  store.activeCount = store.delegates.filter((d) => d.active).length;
  await save(root, store);
  return {
    accepted: true as const,
    reason: 'SPARSE_FOUNDER_AVATAR_ACTIVATED_BOUNDED',
    activeCount: store.activeCount,
    maxActive: MAX_ACTIVE_AVATAR_PATHWAYS,
    delegate,
  };
}

export async function attemptFounderAvatarAction(input: {
  delegateId: string;
  action: AvatarAction;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const delegate = store.delegates.find((d) => d.id === input.delegateId);
  if (!delegate || !delegate.active) {
    return {
      accepted: false as const,
      reason: 'AVATAR_DELEGATE_NOT_ACTIVE',
      action: input.action,
    };
  }

  const denyMap: Partial<Record<AvatarAction, string>> = {
    impersonate_founder: AVATAR_IMPERSONATION_DENIED,
    approve_deal: AVATAR_DEAL_APPROVAL_DENIED,
    move_money: AVATAR_MONEY_MOVE_DENIED,
    deploy_production: AVATAR_DEPLOY_DENIED,
    external_publish: AVATAR_PUBLISH_DENIED,
  };

  const deniedReason = denyMap[input.action];
  if (deniedReason) {
    store.denials.push({
      id: id('deny'),
      action: input.action,
      reason: deniedReason,
      at: new Date().toISOString(),
      actorId: input.actor.id,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: deniedReason,
      action: input.action,
      canImpersonateFounder: false as const,
      canApproveDeals: false as const,
      canMoveMoney: false as const,
      canDeployProduction: false as const,
      canPublishExternally: false as const,
      productionAuthorization: false as const,
    };
  }

  return {
    accepted: true as const,
    reason: 'AVATAR_BOUNDED_ADVISORY_ACTION',
    action: input.action,
    canImpersonateFounder: false as const,
    canApproveDeals: false as const,
    canMoveMoney: false as const,
    canDeployProduction: false as const,
    canPublishExternally: false as const,
    productionAuthorization: false as const,
  };
}

export async function listFounderAvatarDelegates(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.delegates;
}
