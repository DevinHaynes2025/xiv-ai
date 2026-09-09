/**
 * 62L-CY Agent-Built AI Service Foundry —
 * Agent-built AI services: sandbox → gates.
 * Registration ≠ authority; no self-promotion to production.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  HONESTY_BANNER,
  MAX_AI_SERVICES,
  REGISTRATION_NO_AUTHORITY,
  SERVICE_SELF_PROMOTION_DENIED,
  type CyActor,
} from './knowledge-colony-operating-system-types';

export type AiServiceLifecycle =
  | 'registered'
  | 'sandbox'
  | 'gated'
  | 'approved_candidate'
  | 'unpromoted'
  | 'denied';

export type AiService = {
  id: string;
  name: string;
  capabilityKey: string;
  lifecycle: AiServiceLifecycle;
  sandboxPassed: boolean;
  securityGatePassed: boolean;
  benchmarkGatePassed: boolean;
  authorityGranted: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type FoundryResult = {
  accepted: boolean;
  reason: string;
  service?: AiService;
  at: string;
};

type Store = { services: AiService[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-built-ai-service-foundry.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { services: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function aiServiceFoundryHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxUntilGates: CY_LOCKS.SERVICE_SANDBOX_UNTIL_GATES,
    registrationGrantsAuthority: CY_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    selfPromotionToProduction: CY_LOCKS.SERVICE_SELF_PROMOTION_TO_PRODUCTION,
    productionAuthorization: CY_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerAiServiceSandbox(input: {
  name: string;
  capabilityKey: string;
  root: string;
  actor: CyActor;
}): Promise<FoundryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.services.length >= MAX_AI_SERVICES) {
    return {
      accepted: false,
      reason: 'MAX_AI_SERVICES_BOUNDED',
      at: now,
    };
  }
  const service: AiService = {
    id: id('abas'),
    name: input.name.trim() || 'unnamed-service',
    capabilityKey: input.capabilityKey.trim().toLowerCase(),
    lifecycle: 'sandbox',
    sandboxPassed: false,
    securityGatePassed: false,
    benchmarkGatePassed: false,
    authorityGranted: false,
    productionAuthorized: false,
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.services.push(service);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'AI_SERVICE_REGISTERED_IN_SANDBOX_NO_AUTHORITY',
    service,
    at: now,
  };
}

export async function advanceAiServiceGates(input: {
  serviceId: string;
  sandboxPassed?: boolean;
  securityGatePassed?: boolean;
  benchmarkGatePassed?: boolean;
  root: string;
  actor: CyActor;
}): Promise<FoundryResult> {
  void input.actor;
  const store = await load(input.root);
  const service = store.services.find((s) => s.id === input.serviceId);
  const now = new Date().toISOString();
  if (!service) {
    return { accepted: false, reason: 'AI_SERVICE_NOT_FOUND', at: now };
  }
  if (input.sandboxPassed === true) service.sandboxPassed = true;
  if (input.securityGatePassed === true) service.securityGatePassed = true;
  if (input.benchmarkGatePassed === true) service.benchmarkGatePassed = true;
  service.updatedAt = now;
  if (
    service.sandboxPassed &&
    service.securityGatePassed &&
    service.benchmarkGatePassed
  ) {
    service.lifecycle = 'approved_candidate';
    service.reason = 'GATES_PASSED_CANDIDATE_NOT_PRODUCTION';
  } else {
    service.lifecycle = 'gated';
    service.reason = 'AWAITING_REMAINING_FOUNDRY_GATES';
  }
  service.authorityGranted = false;
  service.productionAuthorized = false;
  await save(input.root, store);
  return { accepted: true, reason: service.reason, service, at: now };
}

export async function attemptAiServiceSelfPromotion(input: {
  serviceId: string;
  root: string;
  actor: CyActor;
}): Promise<FoundryResult> {
  void input.actor;
  const store = await load(input.root);
  const service = store.services.find((s) => s.id === input.serviceId);
  const now = new Date().toISOString();
  if (!service) {
    return { accepted: false, reason: 'AI_SERVICE_NOT_FOUND', at: now };
  }
  service.lifecycle = 'unpromoted';
  service.productionAuthorized = false;
  service.authorityGranted = false;
  service.reason = SERVICE_SELF_PROMOTION_DENIED;
  service.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: SERVICE_SELF_PROMOTION_DENIED,
    service,
    at: now,
  };
}
