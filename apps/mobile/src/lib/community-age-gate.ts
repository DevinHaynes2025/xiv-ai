import {
  acknowledgeCommunityAgeGate,
  attemptGatedCommunityEntry,
  bindCommunityAgeGateFixture,
  clearCommunityAgeGateFixture,
  clearCommunityPolicyDenialStubs,
  listCommunityAgeGateView,
  probeCommunityPolicyDenialStubs,
  selectGatedCommunity,
  type CommunityAgeGateView,
  type SimulationAckFlags,
} from '@/lib/ai';

/**
 * US-COM-01 -- mobile helper for Community age-gate + rules acknowledgment.
 * LOCAL/SIMULATION stubs. WAITING_DATA when unbound.
 * 18+ / waiver / anti-predator / anti-bully acknowledgments are SIMULATION flags.
 * Never claims live legal waiver or live age verification. L4 false.
 */

export const DEFAULT_DEMO_COM_UNIVERSE_ID = 'demo-community-age-gate';
export const DEFAULT_DEMO_COM_TENANT_ID = 'xiv';

export type CommunityAgeGateSessionResult = {
  view: CommunityAgeGateView;
};

export function sessionCommunityAgeGateView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): CommunityAgeGateView {
  return listCommunityAgeGateView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
    forceDenied: input?.forceDenied,
  });
}

export function bindSessionCommunityAgeGateFixture(input?: {
  tenantId?: string;
  universeId?: string;
  selectedCommunityId?: string | null;
}): CommunityAgeGateSessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID).trim();
  bindCommunityAgeGateFixture({
    tenantId,
    universeId,
    selectedCommunityId: input?.selectedCommunityId,
  });
  return { view: listCommunityAgeGateView({ tenantId, universeId }) };
}

export function clearSessionCommunityAgeGateFixture(): CommunityAgeGateSessionResult {
  clearCommunityAgeGateFixture();
  return { view: listCommunityAgeGateView() };
}

export function acknowledgeSessionCommunityAgeGate(
  input: Partial<
    Pick<
      SimulationAckFlags,
      | 'age18PlusAcknowledged'
      | 'waiverContractAcknowledged'
      | 'antiPredatorAcknowledged'
      | 'antiBullyAcknowledged'
    >
  >,
  scope?: { tenantId?: string; universeId?: string },
): CommunityAgeGateSessionResult {
  acknowledgeCommunityAgeGate(input);
  return {
    view: listCommunityAgeGateView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID,
    }),
  };
}

export function selectSessionGatedCommunity(
  communityId: string,
  scope?: { tenantId?: string; universeId?: string },
): CommunityAgeGateSessionResult {
  selectGatedCommunity(communityId);
  return {
    view: listCommunityAgeGateView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID,
    }),
  };
}

export function attemptSessionGatedCommunityEntry(input?: {
  communityId?: string;
  tenantId?: string;
  universeId?: string;
}): CommunityAgeGateSessionResult & { allowed: boolean } {
  const result = attemptGatedCommunityEntry({ communityId: input?.communityId });
  const view = listCommunityAgeGateView({
    tenantId: input?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID,
    universeId: input?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID,
  });
  return { view, allowed: result.allowed };
}

export function probeSessionCommunityPolicyDenials(scope?: {
  tenantId?: string;
  universeId?: string;
}): CommunityAgeGateSessionResult {
  probeCommunityPolicyDenialStubs();
  return {
    view: listCommunityAgeGateView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID,
    }),
  };
}

export function clearSessionCommunityPolicyDenials(scope?: {
  tenantId?: string;
  universeId?: string;
}): CommunityAgeGateSessionResult {
  clearCommunityPolicyDenialStubs();
  return {
    view: listCommunityAgeGateView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_COM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_COM_UNIVERSE_ID,
    }),
  };
}
