/**
 * 62L-DG Universal Personal/Business AI OS —
 * Separate Personal, Business, and Dual modes with isolation boundaries.
 * Dual mode does not collapse isolation without explicit policy.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  CROSS_MODE_LEAK_DENIED,
  DG_LOCKS,
  DUAL_MODE_ISOLATION_HELD,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  UNDER_18_PERSONAL_ACTIVATION_DENIED,
  type DgActor,
  type IsolationBoundary,
  type OsMode,
} from './universal-personal-business-ai-os-types';
import { globalLifeEnterpriseCommandCenterHonesty } from './global-life-enterprise-command-center-ux';
import { historicalWorldSimulationHonesty } from './historical-world-simulation-engine';
import { predictiveDecisionIntelligenceHonesty } from './predictive-decision-intelligence';
import { personalAgentEconomyHonesty } from './personal-agent-economy';
import { multilingualCommunityIntelligenceHonesty } from './multilingual-community-intelligence-network';
import { continuousAgentLearningDebriefHonesty } from './continuous-agent-learning-debrief-system';

export type UniversalPersonalBusinessAiOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  mode: OsMode;
  predecessorLayer: 'DF' | 'DE' | 'DD' | 'DC' | 'DB' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionUxShipped: false;
  isolationDefault: true;
  createdAt: string;
};

export type ModeVaultRecord = {
  id: string;
  osId: string;
  mode: OsMode;
  boundary: IsolationBoundary;
  key: string;
  value: string;
  private: true;
  createdAt: string;
};

export type CrossModeAccessAttempt = {
  id: string;
  osId: string;
  fromMode: OsMode;
  toMode: OsMode;
  targetBoundary: IsolationBoundary;
  explicitSharedPolicy: boolean;
  status: 'DENIED' | 'ALLOWED' | 'ISOLATION_HELD';
  reason: string;
  at: string;
};

export type PersonalActivationAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: UniversalPersonalBusinessAiOs[];
  vaults: ModeVaultRecord[];
  accessAttempts: CrossModeAccessAttempt[];
  activations: PersonalActivationAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-personal-business-ai-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    vaults: [],
    accessAttempts: [],
    activations: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBrainPath(repoRoot?: string): string {
  if (repoRoot) return join(repoRoot, 'services/ai/local-brain');
  return join(process.cwd(), 'services/ai/local-brain');
}

export function detectPredecessorLayer(
  repoRoot?: string,
): UniversalPersonalBusinessAiOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'human-centered-superbrain-ux-types.ts'))) return 'DF';
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-service-fabric-types.ts'))) return 'DC';
  if (existsSync(join(brain, 'superbrain-control-plane-types.ts'))) return 'DB';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  return 'NONE';
}

export function universalPersonalBusinessAiOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DG_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DG_LOCKS.TIP_LAND,
    productionAuthorization: DG_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DG_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DG_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionUxShipped: DG_LOCKS.FULL_PRODUCTION_UX_SHIPPED,
    modeIsolationDefault: DG_LOCKS.MODE_ISOLATION_DEFAULT,
    dualModeCollapsesIsolation: DG_LOCKS.DUAL_MODE_COLLAPSES_ISOLATION_WITHOUT_EXPLICIT_POLICY,
    adult18PlusRequired: DG_LOCKS.ADULT_18_PLUS_REQUIRED,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      commandCenter: globalLifeEnterpriseCommandCenterHonesty(),
      historicalSim: historicalWorldSimulationHonesty(),
      predictive: predictiveDecisionIntelligenceHonesty(),
      agentEconomy: personalAgentEconomyHonesty(),
      community: multilingualCommunityIntelligenceHonesty(),
      learningDebrief: continuousAgentLearningDebriefHonesty(),
    },
  };
}

export async function bootstrapUniversalPersonalBusinessAiOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  mode?: OsMode;
  root: string;
  actor: DgActor;
  repoRoot?: string;
}): Promise<UniversalPersonalBusinessAiOs> {
  void input.actor;
  const store = await load(input.root);
  const mode = input.mode ?? 'personal';
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId &&
      s.mode === mode,
  );
  if (existing) return existing;

  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  if (predecessorLayer === 'DF') {
    try {
      const dfMod = join(brain, 'human-centered-superbrain-ux-os.ts');
      if (existsSync(dfMod)) {
        const df = await import(dfMod);
        if (typeof df.bootstrapHumanCenteredSuperbrainUxOs === 'function') {
          await df.bootstrapHumanCenteredSuperbrainUxOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            universeKind: mode === 'business' ? 'business' : 'personal',
            root: input.root,
            actor: {
              kind: 'ux_os_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  }

  const system: UniversalPersonalBusinessAiOs = {
    id: id('dgOS'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionUxShipped: false,
    isolationDefault: true,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}

export async function storeModePrivateRecord(input: {
  osId: string;
  mode: OsMode;
  boundary: IsolationBoundary;
  key: string;
  value: string;
  root: string;
  actor: DgActor;
}): Promise<ModeVaultRecord> {
  void input.actor;
  const store = await load(input.root);
  const record: ModeVaultRecord = {
    id: id('dgvault'),
    osId: input.osId,
    mode: input.mode,
    boundary: input.boundary,
    key: input.key,
    value: input.value,
    private: true,
    createdAt: new Date().toISOString(),
  };
  store.vaults.push(record);
  await save(input.root, store);
  return record;
}

export async function attemptCrossModePrivateAccess(input: {
  osId: string;
  fromMode: OsMode;
  toMode: OsMode;
  targetBoundary: IsolationBoundary;
  explicitSharedPolicy?: boolean;
  root: string;
  actor: DgActor;
}): Promise<{
  allowed: boolean;
  status: CrossModeAccessAttempt['status'];
  reason: string;
  attempt: CrossModeAccessAttempt;
}> {
  void input.actor;
  const store = await load(input.root);
  const explicit = input.explicitSharedPolicy === true;
  const crossPrivate =
    (input.fromMode === 'personal' && input.targetBoundary === 'business_private') ||
    (input.fromMode === 'business' && input.targetBoundary === 'personal_private') ||
    (input.fromMode === 'dual' &&
      (input.targetBoundary === 'personal_private' ||
        input.targetBoundary === 'business_private') &&
      !explicit);

  let status: CrossModeAccessAttempt['status'] = 'DENIED';
  let reason = CROSS_MODE_LEAK_DENIED;

  if (input.fromMode === 'dual' && !explicit && crossPrivate) {
    status = 'ISOLATION_HELD';
    reason = DUAL_MODE_ISOLATION_HELD;
  } else if (crossPrivate && !explicit) {
    status = 'DENIED';
    reason = CROSS_MODE_LEAK_DENIED;
  } else if (explicit && input.targetBoundary === 'shared_policy') {
    status = 'ALLOWED';
    reason = 'EXPLICIT_SHARED_POLICY_ALLOWED';
  } else if (
    input.fromMode === input.toMode &&
    ((input.fromMode === 'personal' && input.targetBoundary === 'personal_private') ||
      (input.fromMode === 'business' && input.targetBoundary === 'business_private'))
  ) {
    status = 'ALLOWED';
    reason = 'SAME_MODE_PRIVATE_ACCESS';
  } else if (!crossPrivate) {
    status = 'ALLOWED';
    reason = 'NON_PRIVATE_OR_SAME_BOUNDARY';
  }

  const attempt: CrossModeAccessAttempt = {
    id: id('dgxmode'),
    osId: input.osId,
    fromMode: input.fromMode,
    toMode: input.toMode,
    targetBoundary: input.targetBoundary,
    explicitSharedPolicy: explicit,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.accessAttempts.push(attempt);
  await save(input.root, store);
  return {
    allowed: status === 'ALLOWED',
    status,
    reason,
    attempt,
  };
}

export async function attemptPersonalModeActivation(input: {
  osId: string;
  declaredAgeYears: number | null;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; activation: PersonalActivationAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const age = input.declaredAgeYears;
  const adult = typeof age === 'number' && age >= ADULT_MIN_AGE_YEARS;
  const activation: PersonalActivationAttempt = {
    id: id('dgact'),
    osId: input.osId,
    declaredAgeYears: age,
    status: adult ? 'admitted' : 'denied',
    reason: adult ? 'ADULT_PERSONAL_ACTIVATION_ADMITTED' : UNDER_18_PERSONAL_ACTIVATION_DENIED,
    adultConfirmed: adult,
    at: new Date().toISOString(),
  };
  store.activations.push(activation);
  await save(input.root, store);
  return {
    accepted: adult,
    reason: activation.reason,
    activation,
  };
}
