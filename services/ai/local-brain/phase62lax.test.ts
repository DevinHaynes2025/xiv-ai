import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION } from './ceo-sealed-vault';
import { decisionGate } from './decision-gate';
import { providerSlots } from './provider-fabric';
import {
  assertUnverifiedUnavailable,
  defaultGatewayMatrix,
  evaluatePlatformTrust,
  listTrustPlatforms,
} from './cross-platform-trust-gateway';
import {
  buildSovereignDeploymentArchitecture,
  certificationHonesty,
  refuseCertificationClaim,
} from './government-regulated-architecture';
import {
  accessCompartment,
  completePrerequisites,
  declareCompartment,
  denyFounderSealedSurface,
  emptyPrerequisites,
  fabricAudit,
  listCompartmentTypes,
  scanXivLocalForToken,
  sealFounderCompartment,
  writePrivateAgentMemory,
  type FabricActor,
} from './sovereign-sealed-fabric';
import {
  AX_LOCKS,
  COMPARTMENT_TYPES,
  FOUNDER_SEALED_DENY_DEFAULT,
  GOVERNMENT_CERTIFICATION_UNAVAILABLE,
  LABEL_ALONE_INSUFFICIENT,
  MOBILE_FIRST_LAYERS,
  NEXT_PHASE_TITLE,
  SOVEREIGN_SEALED_CYCLE,
  TRUST_PLATFORMS,
  UX_SHELLS,
  UNVERIFIED_PLATFORM_UNAVAILABLE,
  predecessorMap,
} from './sovereign-sealed-types';
import { buildSovereignSealedHealthReport, runSovereignSealedCycle } from './sovereign-sealed-runtime';
import {
  accessibilityContract,
  connectivityUx,
  continueSecureSession,
  controlTowerUxSurface,
  listUxShellContracts,
  selectShell,
} from './universal-ux-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lax-'));
const tenantId = '62lax-tenant';
const universeId = '62lax-universe';
const SECRET = 'SEALED_AX_FOUNDER_TOKEN_DO_NOT_LEAK';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function hopState(cycle: Awaited<ReturnType<typeof runSovereignSealedCycle>>, hop: (typeof SOVEREIGN_SEALED_CYCLE)[number]) {
  return cycle.hops.find((item) => item.hop === hop)?.state;
}

const founder: FabricActor = {
  kind: 'ceo_principal',
  id: 'founder-principal',
  tenantId,
  universeId,
};

const ordinary: FabricActor = {
  kind: 'ordinary_agent',
  id: 'agent-researcher',
  tenantId,
  universeId,
  role: 'researcher',
};

try {
  check(
    'US-AX1-cycle',
    SOVEREIGN_SEALED_CYCLE.join(' → ') ===
      'compartment_declare → identity_bind → strong_auth → key_policy → device_trust → audit_channel → sealed_access → label_alone_reject → government_architecture → ux_shell → responsive_tokens → adaptive_nav → control_tower_ux → connectivity_state → accessibility → session_continuity → trust_gateway → isolated_universe → evidence → learning',
    'Sovereign sealed + UX + trust cycle is recorded in order.',
  );
  check(
    'US-AX29-locks',
    AX_LOCKS.L4_AUTONOMY_ENABLED === false &&
      AX_LOCKS.FOUNDER_IMPERSONATION === false &&
      AX_LOCKS.TIP_LAND === false &&
      AX_LOCKS.INVENTED_GOVERNMENT_CERTIFICATION === false &&
      AX_LOCKS.CLASSIFIED_SYSTEM_APPROVAL_CLAIMED === false &&
      AX_LOCKS.LABEL_ALONE_SUFFICIENT === false &&
      AX_LOCKS.ONLY_FOUNDER_BECAUSE_OF_LABEL === false &&
      AX_LOCKS.CEO_FOUNDER_SEALED_REPLICATING === false &&
      AX_LOCKS.GUARDIAN_RLS_WEAKENED === false &&
      AX_LOCKS.PERMISSION_EXPANSION === false &&
      AX_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED === true,
    'L4, impersonation, tip-land, certification invention, label-alone, replication, Guardian, and perm-expansion locks are false.',
  );

  const types = listCompartmentTypes();
  check(
    'US-AX2',
    types.join(',') === COMPARTMENT_TYPES.join(',') &&
      types.includes('FOUNDER-SEALED') &&
      types.includes('ORGANIZATION-SEALED') &&
      types.includes('GOVERNMENT/REGULATED-SEALED') &&
      types.includes('LEGAL/PRIVILEGED') &&
      types.includes('SECURITY-RESTRICTED') &&
      types.includes('CUSTOMER-MANAGED'),
    'All six sealed compartment types are declared.',
  );

  const sealed = await sealFounderCompartment({
    tenantId,
    universeId,
    label: 'FOUNDER-SEALED',
    payload: SECRET,
    actor: founder,
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX3-seal', sealed.accepted === true && sealed.record?.sealedPayload === SEALED_REDACTION, 'Founder principal with full prerequisites can seal; returned record is redacted.');

  const founderRead = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: founder,
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX3-read', founderRead.allowed === true && founderRead.payload === SECRET && founderRead.onlyFounderBecauseOfLabel === false, 'Founder read requires identity/auth/key/device/audit — not a label.');

  const ordinaryRead = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: ordinary,
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX3-agent', ordinaryRead.allowed === false && ordinaryRead.reason === FOUNDER_SEALED_DENY_DEFAULT, 'Ordinary agents are denied founder-sealed access by default.');

  const otherUser = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: { kind: 'other_user', id: 'coworker', tenantId, universeId },
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX3-user', otherUser.allowed === false, 'Other users are denied founder-sealed access.');

  const denySurfaces = await Promise.all(
    (['ordinary_cache', 'telemetry', 'cloud_route', 'peer_sync', 'replication'] as const).map((surface) =>
      denyFounderSealedSurface({
        actor: ordinary,
        surface,
        payload: SECRET,
        compartmentId: sealed.compartment.id,
        root,
      }),
    ),
  );
  check(
    'US-AX3-surfaces',
    denySurfaces.every((item) => item.allowed === false && item.leaked === false && item.payloadWritten === false),
    'Caches, telemetry, cloud routes, peer sync, and replication deny founder-sealed payloads.',
  );

  const leak = await scanXivLocalForToken({ root, token: SECRET, allowFiles: [CEO_SEALED_VAULT_FILE] });
  check('US-AX3-noleak', leak.leaked === false, `Founder-sealed token stays out of ordinary .xiv-local files (leaks=${JSON.stringify(leak.leaks)}).`);

  const labelActor: FabricActor = {
    kind: 'label_only_principal',
    id: 'label-founder',
    tenantId,
    universeId,
    labelOnly: true,
  };
  const labelCmp = await declareCompartment({
    type: 'FOUNDER-SEALED',
    tenantId,
    universeId,
    label: 'FOUNDER-SEALED',
    actor: labelActor,
    root,
  });
  const labelRead = await accessCompartment({
    compartmentId: labelCmp.id,
    actor: labelActor,
    prerequisites: emptyPrerequisites(),
    root,
  });
  check(
    'US-AX9',
    labelRead.allowed === false &&
      labelRead.reason === LABEL_ALONE_INSUFFICIENT &&
      labelRead.onlyFounderBecauseOfLabel === false,
    'FOUNDER-SEALED label alone is insufficient; identity/auth/key/device/audit are required.',
  );

  const incomplete = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: founder,
    prerequisites: { ...completePrerequisites(), device_trust: false },
    root,
  });
  check('US-AX4-8', incomplete.allowed === false && incomplete.reason === LABEL_ALONE_INSUFFICIENT, 'Missing device trust denies access even for a founder principal.');

  const impersonation = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: { ...ordinary, impersonatingFounder: true },
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX29-impersonation', impersonation.allowed === false, 'Founder impersonation is denied.');

  const gov = await declareCompartment({
    type: 'GOVERNMENT/REGULATED-SEALED',
    tenantId,
    universeId,
    label: 'GOVERNMENT/REGULATED-SEALED',
    actor: founder,
    root,
  });
  const govRead = await accessCompartment({
    compartmentId: gov.id,
    actor: founder,
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX10-access', govRead.allowed === false, 'Government/regulated sealed access stays denied until certification exists.');

  const architecture = buildSovereignDeploymentArchitecture({
    tenantId,
    universeId,
    profile: 'regulated_enclave',
  });
  check(
    'US-AX10',
    architecture.architectureDocumented === true &&
      architecture.liveGovernmentDeployment === false &&
      architecture.certification.classifiedSystemApproval === false &&
      architecture.certification.governmentCertificationClaimed === false &&
      architecture.certification.governmentCertification === 'NOT_TESTED',
    'Sovereign government/regulated architecture is documented without certification claims.',
  );

  const honesty = certificationHonesty();
  const refused = refuseCertificationClaim({ certified: true, classified: true });
  check(
    'US-AX11',
    honesty.governmentCertification === 'NOT_TESTED' &&
      refused.state === 'UNAVAILABLE' &&
      refused.reason === GOVERNMENT_CERTIFICATION_UNAVAILABLE &&
      refused.honesty.classifiedSystemApproval === false,
    'Certification claims are refused; status is NOT_TESTED / UNAVAILABLE.',
  );

  const shells = listUxShellContracts();
  check(
    'US-AX12-16',
    UX_SHELLS.every((id) => shells.some((shell) => shell.id === id)) &&
      shells.every((shell) => shell.layers[0] === 'business_story' && shell.layers[1] === 'evidence' && shell.layers[2] === 'raw_data') &&
      shells.every((shell) => shell.physicalDeviceVerified === false),
    'Desktop/laptop/phone executive/phone consumer/tablet shells exist with mobile-first layers; physical devices NOT_TESTED.',
  );
  check('US-AX17', shells.every((shell) => shell.tokens.minTouchTarget === 44 && shell.tokens.contrastRatioMin === 4.5), 'Responsive tokens include touch and contrast contracts.');
  check(
    'US-AX18',
    shells.find((shell) => shell.id === 'phone_executive')?.navigation.pattern === 'bottom_tabs' &&
      shells.find((shell) => shell.id === 'desktop_executive')?.navigation.pattern === 'rail_control_tower',
    'Adaptive navigation: phone tabs, desktop rail + control tower.',
  );
  const tower = controlTowerUxSurface();
  check('US-AX19', tower.universalControlTower === true && tower.duplicatesAnRuntime === false && tower.anModule === 'AVAILABLE', 'Control-tower UX reuses AN; does not duplicate the router.');
  check(
    'US-AX20',
    connectivityUx('offline').offlineFirst === true &&
      connectivityUx('hybrid').hybridContinuesLocal === true &&
      connectivityUx('live').liveProviders === 'UNAVAILABLE',
    'Offline/hybrid/live UX states; live providers remain UNAVAILABLE.',
  );
  const a11y = accessibilityContract('phone_executive', true);
  check(
    'US-AX21',
    a11y.labelled &&
      a11y.focusOrder.join(',') === MOBILE_FIRST_LAYERS.join(',') &&
      a11y.reducedMotionHonored &&
      a11y.minTouchTarget === 44,
    'Accessibility contract: labels, focus order, reduced motion, 44px targets.',
  );
  check('US-AX23', selectShell({ width: 390, executive: true }) === 'phone_executive', 'Mobile-first default shell is phone executive.');

  const sessionOk = continueSecureSession({
    ticketId: 't1',
    fromShell: 'phone_executive',
    toShell: 'laptop',
    trustGatewayVerified: true,
  });
  const sessionSealed = continueSecureSession({
    ticketId: 't2',
    fromShell: 'phone_executive',
    toShell: 'laptop',
    trustGatewayVerified: true,
    copiesFounderSealed: true,
  });
  const sessionUnverified = continueSecureSession({
    ticketId: 't3',
    fromShell: 'phone_executive',
    toShell: 'laptop',
    trustGatewayVerified: false,
  });
  check(
    'US-AX22',
    sessionOk.allowed && sessionOk.copiesFounderSealed === false && sessionSealed.allowed === false && sessionUnverified.allowed === false,
    'Secure session continuity is device-bound, refuses sealed copies, and requires a verified gateway.',
  );

  check('US-AX24', listTrustPlatforms().join(',') === TRUST_PLATFORMS.join(','), 'Trust gateway covers desktop/laptop/phone/tablet/web/server/approved edge.');
  const unverified = defaultGatewayMatrix();
  check(
    'US-AX25',
    unverified.every((item) => item.state === 'UNAVAILABLE' && item.reason === UNVERIFIED_PLATFORM_UNAVAILABLE),
    'Unverified platforms are UNAVAILABLE, not PASS.',
  );
  const verifiedPhone = evaluatePlatformTrust({
    platform: 'phone',
    registered: true,
    configured: true,
    authorized: true,
    verified: true,
  });
  check('US-AX24-verified', verifiedPhone.state === 'PASS', 'A fully verified platform may reach PASS (logical attestation only).');
  check(
    'US-AX25-assert',
    assertUnverifiedUnavailable(evaluatePlatformTrust({ platform: 'web' })).state === 'UNAVAILABLE',
    'Trust gateway assertion keeps unverified web UNAVAILABLE.',
  );

  const customer = await declareCompartment({
    type: 'CUSTOMER-MANAGED',
    tenantId,
    universeId,
    label: 'CUSTOMER-MANAGED',
    actor: founder,
    root,
  });
  check(
    'US-AX26',
    customer.customerControlledKeys === true &&
      customer.highAssurance === true &&
      customer.dedicatedKeyId.startsWith('key_') &&
      customer.dedicatedStorageId.startsWith('store_') &&
      customer.dedicatedNetworkId.startsWith('net_') &&
      customer.replicating === false,
    'Customer-managed high-assurance compartment has dedicated key/storage/network ids and does not replicate.',
  );

  const cross = await accessCompartment({
    compartmentId: sealed.compartment.id,
    actor: { ...founder, universeId: 'other-universe' },
    prerequisites: completePrerequisites(),
    root,
  });
  check('US-AX27', cross.allowed === false, 'Cross-Universe founder-sealed access is denied (isolated data).');

  const privateMemory = await writePrivateAgentMemory({
    tenantId,
    universeId,
    agentId: ordinary.id,
    note: 'ordinary private note',
    sealedPayload: SECRET,
    root,
  });
  const privateOk = await writePrivateAgentMemory({
    tenantId,
    universeId,
    agentId: ordinary.id,
    note: 'ordinary private note',
    root,
  });
  check('US-AX28', privateMemory.accepted === false && privateOk.accepted === true, 'Private agent memory is isolated and refuses founder-sealed payloads.');

  const providers = providerSlots();
  check('US-AX29-providers', providers.every((slot) => slot.state === 'UNAVAILABLE'), 'Unconfigured providers remain UNAVAILABLE.');

  const gate = decisionGate({
    id: 'ax-gate',
    action: 'export-founder-sealed',
    consequence: 'CRITICAL',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: true,
    externalPublication: false,
  });
  check('US-AX29-gate', gate.executableByAgent === false && gate.humanApprovalRequired === true, 'Decision Gate blocks permission expansion.');

  const cycle = await runSovereignSealedCycle({
    tenantId,
    universeId,
    actor: founder,
    sealedPayload: `${SECRET}-cycle`,
    width: 390,
    connectivity: 'offline',
    platform: 'phone',
    platformVerified: false,
    root,
  });
  check(
    'US-AX1',
    cycle.completedHops.join(',') === SOVEREIGN_SEALED_CYCLE.join(',') && cycle.productionAuthorization === false && cycle.tipLand === false,
    'Cycle walks every hop. Not production authorization. tip-land=NO.',
  );
  check('US-AX9-cycle', hopState(cycle, 'label_alone_reject') === 'PASS' && cycle.labelAloneDenied === true, 'Cycle proves the label-alone reject path.');
  check(
    'US-AX11-cycle',
    hopState(cycle, 'government_architecture') === 'NOT_TESTED' &&
      cycle.government.certification.governmentCertificationClaimed === false,
    'Cycle records government architecture as NOT_TESTED without claiming certification.',
  );
  check('US-AX25-cycle', hopState(cycle, 'trust_gateway') === 'UNAVAILABLE', 'Cycle trust gateway leaves unverified phone UNAVAILABLE.');
  check('US-AX30-next', cycle.next === NEXT_PHASE_TITLE, 'Next phase title is recorded only.');

  const labelCycle = await runSovereignSealedCycle({
    tenantId,
    universeId,
    actor: founder,
    labelOnlyFounder: true,
    root,
  });
  check('US-AX9-label-cycle', labelCycle.state === 'denied' && labelCycle.labelAloneDenied === true, 'Label-only founder cycle is denied.');

  const certCycle = await runSovereignSealedCycle({
    tenantId,
    universeId,
    actor: founder,
    claimGovernmentCertification: true,
    root,
  });
  check(
    'US-AX11-refuse',
    hopState(certCycle, 'government_architecture') === 'UNAVAILABLE' &&
      certCycle.government.refusedClaim?.reason === GOVERNMENT_CERTIFICATION_UNAVAILABLE,
    'Attempting to claim government certification is refused as UNAVAILABLE.',
  );

  const predecessors = predecessorMap(repoRoot);
  check('US-AX-reuse-AE', predecessors.AE.module === 'AVAILABLE' && predecessors.AE.report === 'PASS', 'CEO Sealed Vault module and AE report are reused.');
  check('US-AX-reuse-AN', predecessors.AN.module === 'AVAILABLE' && predecessors.AN.report === 'PASS', 'Control Tower module and AN report are reused.');
  check('US-AX-reuse-AU', predecessors.AU.module === 'AVAILABLE' && predecessors.AU.report === 'PASS', 'AU parent report is present.');
  check(
    'US-AX-reuse-AW',
    predecessors.AW.module === 'WAITING_DATA' && predecessors.AW.report === 'WAITING_DATA',
    '62L-AW Business OS report/module remain WAITING_DATA (not copied).',
  );
  check(
    'US-AX-reuse-AV',
    predecessors.AV.module === 'WAITING_DATA' && predecessors.AV.report === 'WAITING_DATA',
    '62L-AV Universal Runtime remains WAITING_DATA (not copied from the sibling).',
  );
  check(
    'US-AX-reuse-AK-AL',
    predecessors.AK.module === 'WAITING_DATA' && predecessors.AL.module === 'WAITING_DATA',
    'AK Package Manager and AL Edge Sync remain WAITING_DATA (not duplicated).',
  );

  const health = await buildSovereignSealedHealthReport(root);
  check(
    'US-AX30',
    health.phase === '62L-AX' &&
      health.productionAuthorization === false &&
      health.tipLand === false &&
      health.honesty.L4_AUTONOMY_ENABLED === false &&
      health.certification.governmentCertification === 'NOT_TESTED' &&
      health.unverifiedPlatforms.length === TRUST_PLATFORMS.length,
    'Health report: no production authorization, L4=false, certification NOT_TESTED, unverified platforms listed.',
  );

  const audit = await fabricAudit(root);
  check('US-AX3-audit', audit.denied >= 6 && audit.labelAloneDenials >= 1 && audit.replicating === false, 'Audit evidence records founder-sealed and label-alone denials.');

  if (failures.length) {
    console.error(`62L-AX safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AX safety tests PASS');
  }
} catch (error) {
  console.error('62L-AX safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
