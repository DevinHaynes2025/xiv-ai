import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APPRENTICE_PERMISSION_TRANSFER_DENIED,
  BT_LOCKS,
  type AgentRoleInPair,
  type PermissionTier,
} from './apprenticeship-experiment-evolution-types';

/**
 * AI Engineering Apprenticeship Network — mentor/apprentice coding agents,
 * bounded pair-programming workcells, guided debugging.
 * Learning/skill ≠ permission grant; apprentice cannot gain mentor/production authority.
 */

export const APPRENTICESHIP_STORE = 'ai-engineering-apprenticeship.json';

export type PairAgent = {
  agentId: string;
  role: AgentRoleInPair;
  permissionTier: PermissionTier;
  productionAuthority: boolean;
  skillLevel: number;
};

export type PairSessionRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  mentor: PairAgent;
  apprentice: PairAgent;
  objective: string;
  workcellBounded: true;
  guidedDebugging: boolean;
  createdAt: string;
  closedAt?: string;
  productionAuthorized: false;
  authorityTransferred: false;
  apprenticeGainedMentorPermissions: false;
  apprenticeGainedProductionAuthority: false;
  learningIsPermissionGrant: false;
};

type ApprenticeshipStore = {
  sessions: PairSessionRecord[];
  denials: Array<{ id: string; at: string; reason: string; sessionId?: string }>;
};

const MAX_SESSIONS = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, APPRENTICESHIP_STORE);
}

async function load(root: string): Promise<ApprenticeshipStore> {
  const parsed = await readJsonFile<ApprenticeshipStore>(storePath(root), {
    sessions: [],
    denials: [],
  });
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: ApprenticeshipStore) {
  await writeJsonFileAtomic(storePath(root), {
    sessions: store.sessions.slice(-MAX_SESSIONS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type OpenPairSessionInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  mentorAgentId: string;
  apprenticeAgentId: string;
  mentorPermissionTier?: PermissionTier;
  apprenticePermissionTier?: PermissionTier;
  mentorProductionAuthority?: boolean;
  apprenticeSkillLevel?: number;
  objective: string;
  guidedDebugging?: boolean;
  /** Hard-deny probe: claim apprentice receives mentor permissions via pair. */
  attemptApprenticeMentorPermissionTransfer?: boolean;
  /** Hard-deny probe: claim apprentice receives production authority. */
  attemptApprenticeProductionAuthority?: boolean;
  /** Hard-deny probe: mentor transfers production authority. */
  attemptMentorProductionAuthorityTransfer?: boolean;
  root?: string;
};

export type OpenPairSessionResult = {
  accepted: boolean;
  reason: string;
  session: PairSessionRecord | null;
  apprenticeGainedMentorPermissions: false;
  apprenticeGainedProductionAuthority: false;
  authorityTransferred: false;
  productionAuthorization: false;
  learningIsPermissionGrant: false;
};

export async function openApprenticeshipPairSession(
  input: OpenPairSessionInput,
): Promise<OpenPairSessionResult> {
  const root = input.root ?? process.cwd();
  const deny = async (reason: string): Promise<OpenPairSessionResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      session: null,
      apprenticeGainedMentorPermissions: false,
      apprenticeGainedProductionAuthority: false,
      authorityTransferred: false,
      productionAuthorization: false,
      learningIsPermissionGrant: false,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.objective.trim()) {
    return deny('PAIR_SESSION_REQUIRES_ORG_TENANT_UNIVERSE_OBJECTIVE');
  }
  if (!input.mentorAgentId || !input.apprenticeAgentId) {
    return deny('PAIR_SESSION_REQUIRES_MENTOR_AND_APPRENTICE');
  }
  if (input.mentorAgentId === input.apprenticeAgentId) {
    return deny('MENTOR_AND_APPRENTICE_MUST_DIFFER');
  }

  if (
    input.attemptApprenticeMentorPermissionTransfer === true ||
    input.attemptApprenticeProductionAuthority === true ||
    input.attemptMentorProductionAuthorityTransfer === true ||
    BT_LOCKS.APPRENTICE_GAINS_MENTOR_PERMISSIONS === true ||
    BT_LOCKS.APPRENTICE_GAINS_PRODUCTION_AUTHORITY === true ||
    BT_LOCKS.MENTOR_TRANSFERS_PRODUCTION_AUTHORITY === true ||
    BT_LOCKS.PAIR_SESSION_EXPANDS_AUTHORITY === true
  ) {
    return deny(APPRENTICE_PERMISSION_TRANSFER_DENIED);
  }

  const mentorTier = input.mentorPermissionTier ?? 'mentor';
  const apprenticeTier = input.apprenticePermissionTier ?? 'sandbox';
  if (apprenticeTier === 'mentor' || apprenticeTier === 'production') {
    return deny(APPRENTICE_PERMISSION_TRANSFER_DENIED);
  }
  if (input.mentorProductionAuthority === true && apprenticeTier !== 'sandbox' && apprenticeTier !== 'none' && apprenticeTier !== 'review') {
    return deny(APPRENTICE_PERMISSION_TRANSFER_DENIED);
  }

  const session: PairSessionRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mentor: {
      agentId: input.mentorAgentId,
      role: 'mentor',
      permissionTier: mentorTier,
      productionAuthority: input.mentorProductionAuthority === true,
      skillLevel: 1,
    },
    apprentice: {
      agentId: input.apprenticeAgentId,
      role: 'apprentice',
      permissionTier: apprenticeTier === 'none' || apprenticeTier === 'sandbox' || apprenticeTier === 'review'
        ? apprenticeTier
        : 'sandbox',
      productionAuthority: false,
      skillLevel: Math.max(0, Math.min(1, input.apprenticeSkillLevel ?? 0.2)),
    },
    objective: input.objective.trim(),
    workcellBounded: true,
    guidedDebugging: input.guidedDebugging !== false,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
    authorityTransferred: false,
    apprenticeGainedMentorPermissions: false,
    apprenticeGainedProductionAuthority: false,
    learningIsPermissionGrant: false,
  };

  const store = await load(root);
  store.sessions.push(session);
  await save(root, store);

  return {
    accepted: true,
    reason: 'Bounded apprenticeship pair session opened; authority not transferred.',
    session,
    apprenticeGainedMentorPermissions: false,
    apprenticeGainedProductionAuthority: false,
    authorityTransferred: false,
    productionAuthorization: false,
    learningIsPermissionGrant: false,
  };
}

export type GuidedDebugInput = {
  sessionId: string;
  diagnosis: string;
  proposedFixSummary: string;
  /** Hard-deny: elevate apprentice permissions as part of debug. */
  attemptElevateApprenticePermissions?: boolean;
  root?: string;
};

export async function runGuidedDebugging(input: GuidedDebugInput) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) {
    return {
      accepted: false as const,
      reason: 'PAIR_SESSION_NOT_FOUND',
      apprenticePermissionTier: null as PermissionTier | null,
      productionAuthority: false as const,
    };
  }
  if (input.attemptElevateApprenticePermissions === true) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: APPRENTICE_PERMISSION_TRANSFER_DENIED,
      sessionId: session.id,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: APPRENTICE_PERMISSION_TRANSFER_DENIED,
      apprenticePermissionTier: session.apprentice.permissionTier,
      productionAuthority: false as const,
    };
  }
  if (!input.diagnosis.trim() || !input.proposedFixSummary.trim()) {
    return {
      accepted: false as const,
      reason: 'GUIDED_DEBUG_REQUIRES_DIAGNOSIS_AND_FIX_SUMMARY',
      apprenticePermissionTier: session.apprentice.permissionTier,
      productionAuthority: false as const,
    };
  }
  return {
    accepted: true as const,
    reason: 'Guided debugging recorded inside bounded workcell; permissions unchanged.',
    apprenticePermissionTier: session.apprentice.permissionTier,
    productionAuthority: false as const,
    sessionId: session.id,
    auditable: true as const,
  };
}

export function apprenticeshipHonesty() {
  return {
    apprenticeGainsMentorPermissions: BT_LOCKS.APPRENTICE_GAINS_MENTOR_PERMISSIONS,
    apprenticeGainsProductionAuthority: BT_LOCKS.APPRENTICE_GAINS_PRODUCTION_AUTHORITY,
    mentorTransfersProductionAuthority: BT_LOCKS.MENTOR_TRANSFERS_PRODUCTION_AUTHORITY,
    pairSessionExpandsAuthority: BT_LOCKS.PAIR_SESSION_EXPANDS_AUTHORITY,
    learningIsPermissionGrant: BT_LOCKS.LEARNING_IS_PERMISSION_GRANT,
    l4AutonomyEnabled: BT_LOCKS.L4_AUTONOMY_ENABLED,
    founderSealedDenyByDefault: BT_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}
