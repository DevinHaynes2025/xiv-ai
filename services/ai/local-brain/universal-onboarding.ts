/**
 * 62L-AY Universal Onboarding — adult (18+) only.
 * Channel adapters are contracts/stubs. Under-18 denied. Unauthorized enterprise join denied without seal.
 * Offline-first persistence via cortex-store JSON under `.xiv-local/`.
 */

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  AGE_GATE_DENIED,
  AY_HONESTY,
  ENTERPRISE_SEAL_REQUIRED,
  ONBOARDING_CHANNELS,
  type AyEvidenceState,
  type OnboardingChannel,
} from './growth-media-onboarding-types';

export type ChannelAdapterStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'STUB';

export type ChannelAdapter = {
  channel: OnboardingChannel;
  status: ChannelAdapterStatus;
  configured: boolean;
  reason: string;
};

export type OnboardingIdentity = {
  subjectId: string;
  displayName?: string;
  /** Declared age in years. Missing age fails closed. */
  declaredAgeYears?: number;
  email?: string;
  phoneE164?: string;
  inviteToken?: string;
  enterpriseTenantId?: string;
  /** CEO/enterprise seal token required for enterprise channel. */
  enterpriseSeal?: string;
};

export type OnboardingState = {
  id: string;
  tenantId: string;
  universeId: string;
  channel: OnboardingChannel;
  subjectId: string;
  status: 'admitted' | 'denied' | 'pending' | 'completed';
  ageGate: AyEvidenceState;
  identityAdapter: AyEvidenceState;
  enterpriseSeal: AyEvidenceState;
  adultConfirmed: boolean;
  accountActivated: boolean;
  offlinePersisted: true;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type OnboardingStore = { records: OnboardingState[] };

function nowIso() {
  return new Date().toISOString();
}

function storePath(root: string) {
  return xivLocalPath(root, 'ay-onboarding.json');
}

/** Identity/channel adapters as contracts — stub OK; unconfigured = UNAVAILABLE. */
export function listChannelAdapters(env: NodeJS.ProcessEnv = process.env): ChannelAdapter[] {
  return ONBOARDING_CHANNELS.map((channel) => {
    const key = `XIV_ONBOARD_${channel.toUpperCase()}`;
    const configured = Boolean(env[key]?.trim());
    if (!configured) {
      return {
        channel,
        status: 'UNAVAILABLE' as const,
        configured: false,
        reason: `${key} unset — adapter UNAVAILABLE until configured (stub contract only).`,
      };
    }
    return {
      channel,
      status: 'STUB' as const,
      configured: true,
      reason: `${key} present — stub adapter AVAILABLE for local prep; not a production identity provider.`,
    };
  });
}

export function ageGate(declaredAgeYears: number | undefined): {
  allowed: boolean;
  state: AyEvidenceState;
  reason: string;
  adultConfirmed: boolean;
} {
  if (declaredAgeYears === undefined || !Number.isFinite(declaredAgeYears)) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: 'AGE_REQUIRED_FAIL_CLOSED',
      adultConfirmed: false,
    };
  }
  if (declaredAgeYears < AY_HONESTY.minimumAgeYears) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: AGE_GATE_DENIED,
      adultConfirmed: false,
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: 'ADULT_18_PLUS_CONFIRMED',
    adultConfirmed: true,
  };
}

export function enterpriseSealCheck(input: {
  channel: OnboardingChannel;
  enterpriseSeal?: string;
  enterpriseTenantId?: string;
}): { allowed: boolean; state: AyEvidenceState; reason: string } {
  if (input.channel !== 'enterprise') {
    return { allowed: true, state: 'PASS', reason: 'NON_ENTERPRISE_CHANNEL' };
  }
  if (!input.enterpriseTenantId?.trim()) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: 'ENTERPRISE_TENANT_REQUIRED',
    };
  }
  if (!input.enterpriseSeal?.trim()) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: ENTERPRISE_SEAL_REQUIRED,
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: 'ENTERPRISE_SEAL_PRESENT_STUB_NOT_PRODUCTION_AUTH',
  };
}

export async function admitOnboarding(input: {
  tenantId: string;
  universeId: string;
  channel: OnboardingChannel;
  identity: OnboardingIdentity;
  root?: string;
}): Promise<OnboardingState> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const age = ageGate(input.identity.declaredAgeYears);
  const seal = enterpriseSealCheck({
    channel: input.channel,
    enterpriseSeal: input.identity.enterpriseSeal,
    enterpriseTenantId: input.identity.enterpriseTenantId,
  });

  let status: OnboardingState['status'] = 'admitted';
  let reason = 'ONBOARDING_ADMITTED_OFFLINE_FIRST';
  let ageState = age.state;
  let sealState = seal.state;
  let identityState: AyEvidenceState = 'PASS';

  if (!age.allowed) {
    status = 'denied';
    reason = age.reason;
    identityState = 'DENIED';
  } else if (!seal.allowed) {
    status = 'denied';
    reason = seal.reason;
    identityState = 'DENIED';
  } else {
    const adapters = listChannelAdapters();
    const adapter = adapters.find((a) => a.channel === input.channel);
    if (adapter?.status === 'UNAVAILABLE') {
      status = 'pending';
      identityState = 'UNAVAILABLE';
      reason = adapter.reason;
    }
  }

  const record: OnboardingState = {
    id: cortexId('ay_onb'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    channel: input.channel,
    subjectId: input.identity.subjectId,
    status,
    ageGate: ageState,
    identityAdapter: identityState,
    enterpriseSeal: sealState,
    adultConfirmed: age.adultConfirmed,
    accountActivated: status === 'admitted' || status === 'pending' || status === 'completed',
    offlinePersisted: true,
    reason,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const store = await readJsonFile<OnboardingStore>(storePath(root), { records: [] });
  store.records.push(record);
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-5_000) });
  return record;
}

export async function listOnboarding(root = process.cwd()) {
  const store = await readJsonFile<OnboardingStore>(storePath(root), { records: [] });
  return store.records;
}

export async function completeOnboarding(id: string, root = process.cwd()) {
  const store = await readJsonFile<OnboardingStore>(storePath(root), { records: [] });
  const record = store.records.find((r) => r.id === id);
  if (!record) throw new Error('ONBOARDING_NOT_FOUND');
  if (record.status === 'denied') {
    return { ...record, reason: 'CANNOT_COMPLETE_DENIED_ONBOARDING' };
  }
  if (!record.adultConfirmed) {
    record.status = 'denied';
    record.reason = AGE_GATE_DENIED;
    record.updatedAt = nowIso();
    await writeJsonFileAtomic(storePath(root), store);
    return record;
  }
  record.status = 'completed';
  record.reason = 'ONBOARDING_COMPLETED_OFFLINE_FIRST_NOT_PRODUCTION_AUTH';
  record.updatedAt = nowIso();
  await writeJsonFileAtomic(storePath(root), store);
  return record;
}
