/**
 * 62L-CG Edge Superbrain Deployment Orchestrator —
 * Explicit edge deployment profiles for approved PCs/mobile/edge nodes.
 * Profile ≠ stealth install; deploy candidate ≠ production authority;
 * unapproved devices DENIED / UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  DEPLOY_CANDIDATE_NOT_AUTHORITY,
  EDGE_PROFILE_NOT_STEALTH,
  HONESTY_BANNER,
  UNAPPROVED_EDGE_DEPLOY_DENIED,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type EdgeDeviceKind = 'pc' | 'mobile' | 'edge_appliance' | 'server' | 'unknown';

export type EdgeDeploymentProfile = {
  id: string;
  deviceId: string;
  kind: EdgeDeviceKind;
  approved: boolean;
  compatibilityProfileOnly: true;
  stealthInstall: false;
  installedOnDevice: false;
  status: 'profile' | 'denied' | 'unavailable';
  reason: string;
  productionAuthorized: false;
  createdAt: string;
};

export type EdgeDeployCandidate = {
  id: string;
  profileId: string;
  deviceId: string;
  status: 'candidate' | 'denied' | 'unavailable';
  productionAuthority: false;
  stealthInstall: false;
  reason: string;
  at: string;
};

type Store = {
  profiles: EdgeDeploymentProfile[];
  candidates: EdgeDeployCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'edge-superbrain-deployment-orchestrator.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { profiles: [], candidates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeDeployOrchestratorHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    unapprovedEdgeDeploy: CG_LOCKS.UNAPPROVED_EDGE_DEPLOY,
    edgeProfileStealthInstall: CG_LOCKS.EDGE_PROFILE_STEALTH_INSTALL,
    edgeProfileIsCompatibilityOnly: CG_LOCKS.EDGE_PROFILE_IS_COMPATIBILITY_ONLY,
    deployCandidateIsProductionAuthority: CG_LOCKS.DEPLOY_CANDIDATE_IS_PRODUCTION_AUTHORITY,
    autoProductionDeploy: CG_LOCKS.AUTO_PRODUCTION_DEPLOY,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerEdgeDeploymentProfile(input: {
  deviceId: string;
  kind: EdgeDeviceKind;
  approved?: boolean;
  attemptStealthInstall?: boolean;
  root: string;
  actor: CgActor;
}): Promise<EdgeDeploymentProfile> {
  const store = await load(input.root);
  const approved = input.approved === true;

  if (input.attemptStealthInstall) {
    const profile: EdgeDeploymentProfile = {
      id: id('edgeprof'),
      deviceId: input.deviceId,
      kind: input.kind,
      approved: false,
      compatibilityProfileOnly: true,
      stealthInstall: false,
      installedOnDevice: false,
      status: 'denied',
      reason: EDGE_PROFILE_NOT_STEALTH,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
    };
    store.profiles.push(profile);
    await save(input.root, store);
    return profile;
  }

  const profile: EdgeDeploymentProfile = {
    id: id('edgeprof'),
    deviceId: input.deviceId,
    kind: input.kind,
    approved,
    compatibilityProfileOnly: true,
    stealthInstall: false,
    installedOnDevice: false,
    status: approved ? 'profile' : 'unavailable',
    reason: approved
      ? EDGE_PROFILE_NOT_STEALTH
      : UNAPPROVED_EDGE_DEPLOY_DENIED,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.profiles.push(profile);
  await save(input.root, store);
  return profile;
}

/**
 * Propose a deploy candidate for an approved profile.
 * Unapproved devices → DENIED/UNAVAILABLE.
 * Candidate never grants production authority; never stealth installs.
 */
export async function proposeEdgeDeployCandidate(input: {
  profileId: string;
  claimProductionAuthority?: boolean;
  root: string;
  actor: CgActor;
}): Promise<EdgeDeployCandidate> {
  const store = await load(input.root);
  const profile = store.profiles.find((p) => p.id === input.profileId);

  if (!profile || !profile.approved || profile.status !== 'profile') {
    const candidate: EdgeDeployCandidate = {
      id: id('edgedep'),
      profileId: input.profileId,
      deviceId: profile?.deviceId ?? 'unknown',
      status: profile ? 'denied' : 'unavailable',
      productionAuthority: false,
      stealthInstall: false,
      reason: UNAPPROVED_EDGE_DEPLOY_DENIED,
      at: new Date().toISOString(),
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return candidate;
  }

  if (input.claimProductionAuthority) {
    const candidate: EdgeDeployCandidate = {
      id: id('edgedep'),
      profileId: profile.id,
      deviceId: profile.deviceId,
      status: 'denied',
      productionAuthority: false,
      stealthInstall: false,
      reason: DEPLOY_CANDIDATE_NOT_AUTHORITY,
      at: new Date().toISOString(),
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return candidate;
  }

  const candidate: EdgeDeployCandidate = {
    id: id('edgedep'),
    profileId: profile.id,
    deviceId: profile.deviceId,
    status: 'candidate',
    productionAuthority: false,
    stealthInstall: false,
    reason: DEPLOY_CANDIDATE_NOT_AUTHORITY,
    at: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}
