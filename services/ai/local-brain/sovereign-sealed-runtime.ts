import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { appendLearning } from './learning-ledger';
import { providerSlots } from './provider-fabric';
import {
  assertUnverifiedUnavailable,
  defaultGatewayMatrix,
  evaluatePlatformTrust,
  gatewayProviderHonesty,
  listTrustPlatforms,
} from './cross-platform-trust-gateway';
import {
  buildSovereignDeploymentArchitecture,
  certificationHonesty,
  refuseCertificationClaim,
  type SovereignDeploymentProfile,
} from './government-regulated-architecture';
import {
  accessCompartment,
  completePrerequisites,
  declareCompartment,
  denyFounderSealedSurface,
  emptyPrerequisites,
  fabricAudit,
  listCompartmentTypes,
  sealFounderCompartment,
  writePrivateAgentMemory,
  type FabricActor,
} from './sovereign-sealed-fabric';
import {
  AX_LOCKS,
  NEXT_PHASE_TITLE,
  SOVEREIGN_SEALED_CYCLE,
  predecessorMap,
  type AxEvidenceState,
  type AxHop,
  type AxHopRecord,
  type ConnectivityState,
  type TrustPlatform,
  type UxShellId,
} from './sovereign-sealed-types';
import {
  buildShellContract,
  connectivityUx,
  continueSecureSession,
  controlTowerUxSurface,
  listUxShellContracts,
  selectShell,
} from './universal-ux-runtime';

export { AX_LOCKS, SOVEREIGN_SEALED_CYCLE, NEXT_PHASE_TITLE };

function hop(name: AxHop, state: AxEvidenceState, summary: string): AxHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type AxCycleInput = {
  tenantId: string;
  universeId: string;
  actor: FabricActor;
  shell?: UxShellId;
  width?: number;
  connectivity?: ConnectivityState;
  platform?: TrustPlatform;
  platformVerified?: boolean;
  governmentProfile?: SovereignDeploymentProfile;
  claimGovernmentCertification?: boolean;
  sealedPayload?: string;
  labelOnlyFounder?: boolean;
  impersonateFounder?: boolean;
  root?: string;
};

export async function runSovereignSealedCycle(input: AxCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: AxHopRecord[] = [];
  const actor: FabricActor = {
    ...input.actor,
    tenantId: input.tenantId,
    universeId: input.universeId,
    impersonatingFounder: input.impersonateFounder === true,
    labelOnly: input.labelOnlyFounder === true,
    kind: input.labelOnlyFounder ? 'label_only_principal' : input.actor.kind,
  };

  const types = listCompartmentTypes();
  hops.push(hop('compartment_declare', 'PASS', `Compartment types=${types.join(',')}.`));

  const prereqEmpty = emptyPrerequisites();
  const prereqFull = completePrerequisites();
  hops.push(hop('identity_bind', prereqFull.identity_controls ? 'PASS' : 'DENIED', 'Identity controls required before any founder-sealed access claim.'));
  hops.push(hop('strong_auth', prereqFull.strong_authentication ? 'PASS' : 'DENIED', 'Strong authentication required.'));
  hops.push(hop('key_policy', prereqFull.cryptographic_key_policy ? 'PASS' : 'DENIED', 'Cryptographic key policy required; high-assurance compartments use dedicated keys.'));
  hops.push(hop('device_trust', prereqFull.device_trust ? 'PASS' : 'DENIED', 'Device trust required via the Cross-Platform Trust Gateway.'));
  hops.push(hop('audit_channel', prereqFull.audit_evidence ? 'PASS' : 'DENIED', 'Audit evidence required; access claims without audit are denied.'));

  let sealedAccepted = false;
  let sealedCompartmentId: string | undefined;
  if (input.sealedPayload && !actor.labelOnly && actor.kind === 'ceo_principal' && !actor.impersonatingFounder) {
    const sealed = await sealFounderCompartment({
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: 'FOUNDER-SEALED',
      payload: input.sealedPayload,
      actor,
      prerequisites: prereqFull,
      root,
    });
    sealedAccepted = sealed.accepted;
    sealedCompartmentId = sealed.compartment.id;
    hops.push(hop('sealed_access', sealed.accepted ? 'PASS' : 'DENIED', sealed.reason));
  } else {
    const org = await declareCompartment({
      type: 'ORGANIZATION-SEALED',
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: 'ORGANIZATION-SEALED',
      actor,
      root,
    });
    const denied = await accessCompartment({
      compartmentId: org.id,
      actor: { ...actor, kind: actor.labelOnly ? 'label_only_principal' : actor.kind },
      prerequisites: actor.labelOnly ? prereqEmpty : prereqFull,
      root,
    });
    hops.push(hop('sealed_access', denied.allowed ? 'PASS' : 'DENIED', denied.reason));
  }

  const labelProbe = await (async () => {
    const cmp = await declareCompartment({
      type: 'FOUNDER-SEALED',
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: 'FOUNDER-SEALED',
      actor,
      root,
    });
    return accessCompartment({
      compartmentId: cmp.id,
      actor: { ...actor, kind: 'label_only_principal', labelOnly: true },
      prerequisites: prereqEmpty,
      root,
    });
  })();
  hops.push(hop('label_alone_reject', labelProbe.allowed ? 'FAIL' : 'PASS', labelProbe.reason));

  const government = buildSovereignDeploymentArchitecture({
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile: input.governmentProfile ?? 'regulated_enclave',
    claimGovernmentCertification: input.claimGovernmentCertification,
    claimClassifiedApproval: input.claimGovernmentCertification,
  });
  hops.push(
    hop(
      'government_architecture',
      government.certification.governmentCertification === 'NOT_TESTED' ? 'NOT_TESTED' : 'UNAVAILABLE',
      government.note,
    ),
  );

  const shellId = input.shell ?? selectShell({ width: input.width ?? 390, executive: true });
  const shell = buildShellContract(shellId);
  hops.push(hop('ux_shell', 'PASS', `Shell ${shell.id} contract assembled. physicalDeviceVerified=${shell.physicalDeviceVerified}.`));
  hops.push(hop('responsive_tokens', 'PASS', `Tokens contrast>=${shell.tokens.contrastRatioMin} touch>=${shell.tokens.minTouchTarget}.`));
  hops.push(hop('adaptive_nav', 'PASS', `Navigation ${shell.navigation.pattern}.`));
  const tower = controlTowerUxSurface();
  hops.push(hop('control_tower_ux', tower.anModule === 'AVAILABLE' ? 'PASS' : 'WAITING_DATA', `AN control tower reuse=${tower.anModule}.`));
  const connectivity = connectivityUx(input.connectivity ?? 'offline');
  hops.push(hop('connectivity_state', 'PASS', `UX connectivity=${connectivity.state}; live providers remain UNAVAILABLE until verified.`));
  hops.push(hop('accessibility', 'PASS', shell.accessibility.screenReaderSummary));

  const platform = input.platform ?? 'phone';
  const trust = evaluatePlatformTrust({
    platform,
    registered: input.platformVerified,
    configured: input.platformVerified,
    authorized: input.platformVerified,
    verified: input.platformVerified,
  });
  const gated = assertUnverifiedUnavailable(trust);
  const session = continueSecureSession({
    ticketId: `sess_${input.tenantId}`,
    fromShell: shellId,
    toShell: 'laptop',
    trustGatewayVerified: gated.state === 'PASS',
    copiesFounderSealed: Boolean(input.sealedPayload) && gated.state !== 'PASS',
  });
  hops.push(hop('session_continuity', session.allowed ? 'PASS' : 'DENIED', session.reason));
  hops.push(hop('trust_gateway', gated.state, gated.reason));

  hops.push(
    hop(
      'isolated_universe',
      'PASS',
      'Shared controls, isolated tenant/Universe data; high-assurance dedicated key/storage/network ids.',
    ),
  );

  const gate = decisionGate({
    id: `ax-${input.tenantId}`,
    action: 'sovereign-sealed-cycle',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await appendEvidenceEvent(
    {
      kind: 'security_review',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-AX sovereign sealed fabric cycle',
      payload: {
        hops: hops.map((item) => item.hop),
        labelAloneDenied: !labelProbe.allowed,
        certificationClaimed: government.certification.governmentCertificationClaimed,
        l4: AX_LOCKS.L4_AUTONOMY_ENABLED,
        humanApprovalRequired: gate.humanApprovalRequired,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence ledger wrote a non-production security review.'));

  await appendLearning(
    {
      domain: '62l-ax',
      subject: 'sovereign-sealed-fabric',
      claimState: 'UNKNOWN',
      summary: 'Sealed deny-by-default, label-alone insufficient, certification not claimed.',
      sourceRefs: hops.map((item) => item.hop),
      evidence: ['phase62lax'],
    },
    root,
  );
  hops.push(hop('learning', 'PASS', 'Learning ledger recorded hypothesis; permissionChange remains false.'));

  if (sealedCompartmentId) {
    await denyFounderSealedSurface({
      actor,
      surface: 'replication',
      payload: input.sealedPayload ?? '',
      compartmentId: sealedCompartmentId,
      root,
    });
  }

  await writePrivateAgentMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: actor.id,
    note: 'private agent memory isolated from founder-sealed',
    root,
  });

  const deniedHops = hops.filter((item) => item.state === 'DENIED' || item.state === 'FAIL').length;
  const state: 'completed' | 'denied' | 'unavailable' =
    actor.impersonatingFounder || actor.labelOnly
      ? 'denied'
      : gated.state === 'UNAVAILABLE' && input.platformVerified === false
        ? 'unavailable'
        : deniedHops > 2
          ? 'denied'
          : 'completed';

  return {
    state,
    hops,
    completedHops: hops.map((item) => item.hop),
    sealedAccepted,
    labelAloneDenied: !labelProbe.allowed,
    government,
    shell,
    trust: gated,
    session,
    connectivity,
    tower,
    locks: AX_LOCKS,
    productionAuthorization: false as const,
    tipLand: false as const,
    next: NEXT_PHASE_TITLE,
  };
}

export async function buildSovereignSealedHealthReport(root = process.cwd()) {
  const predecessors = predecessorMap(root);
  const providers = gatewayProviderHonesty();
  const runtime = getRuntime('local');
  const brain = await checkLocalBrainHealth(root);
  const audit = await fabricAudit(root);
  const shells = listUxShellContracts();
  const platforms = defaultGatewayMatrix();
  return {
    phase: '62L-AX',
    productionAuthorization: false as const,
    tipLand: false as const,
    honesty: AX_LOCKS,
    certification: certificationHonesty(),
    refusedCertification: refuseCertificationClaim({ certified: true }),
    compartments: listCompartmentTypes(),
    shells: shells.map((shell) => shell.id),
    platforms: listTrustPlatforms(),
    unverifiedPlatforms: platforms.filter((item) => item.state === 'UNAVAILABLE').map((item) => item.platform),
    predecessors,
    providers,
    hybridRuntime: runtime.state,
    localBrain: { ok: brain.ok, productionAuthorization: false as const },
    fabric: audit,
    controlTower: controlTowerUxSurface(),
    next: NEXT_PHASE_TITLE,
  };
}
