/**
 * 12D-17 -- Device Pathways registry stubs.
 * Pathway kinds PHONE|LAPTOP|AUTO|TELECOM|SAT_SIM|EDGE with honesty labels
 * UNVERIFIED|WAITING_PROVIDER. Chip partners WAITING_PARTNER only.
 * quantumSoftwareClaimed=false; liveSatelliteControl=false; liveVehicleControl=false.
 * LOCAL / OFFLINE_PREFER_LOCAL; productionAuto*=false; SIMULATION honesty.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  QUANTUM_ADVANTAGE_CLAIM,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';

export const DEVICE_PATHWAYS_SCHEMA_VERSION = '12d17.1' as const;

/** Locked: LOCAL only -- never CLOUD_SANDBOX / PRODUCTION for this registry. */
export const DEVICE_PATHWAYS_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

export const DEVICE_PATHWAY_KINDS = [
  'PHONE',
  'LAPTOP',
  'AUTO',
  'TELECOM',
  'SAT_SIM',
  'EDGE',
] as const;

export type DevicePathwayKind = (typeof DEVICE_PATHWAY_KINDS)[number];

/** Honesty labels for pathway stubs -- never claim live/provider-verified control. */
export const DEVICE_PATHWAY_HONESTY_LABELS = ['UNVERIFIED', 'WAITING_PROVIDER'] as const;

export type DevicePathwayHonestyLabel = (typeof DEVICE_PATHWAY_HONESTY_LABELS)[number];

export const DEVICE_CHIP_PARTNERS = [
  'apple',
  'nvidia',
  'amd',
  'arm',
  'samsung',
] as const;

export type DeviceChipPartner = (typeof DEVICE_CHIP_PARTNERS)[number];

/** Partner readiness -- stubs only; never VERIFIED_PARTNER without real integration. */
export type ChipPartnerStatus = 'WAITING_PARTNER';

export type DeviceChipPartnerClaim = {
  partner: DeviceChipPartner;
  status: ChipPartnerStatus;
  notes: string;
};

export type DevicePathwayStub = {
  pathwayId: string;
  kind: DevicePathwayKind;
  honesty: DevicePathwayHonestyLabel;
  simulationOnly: true;
  quantumSoftwareClaimed: false;
  liveSatelliteControl: false;
  liveVehicleControl: false;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  notes: string;
};

export type DevicePathwaysRegistry = {
  schemaVersion: typeof DEVICE_PATHWAYS_SCHEMA_VERSION;
  registryId: string;
  simulationOnly: true;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  pathways: readonly DevicePathwayStub[];
  chipPartners: readonly DeviceChipPartnerClaim[];
  quantumSoftwareClaimed: false;
  liveSatelliteControl: false;
  liveVehicleControl: false;
  productionAutoApply: false;
  productionAutoMerge: false;
  productionAutoDeploy: false;
  L4_PRODUCTION_ENABLED: false;
  ethicsNotice: string;
};

export const DEVICE_PATHWAYS_GUARDRAILS = {
  readOnly: true as const,
  simulationOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  cloudSandboxAllowed: false as const,
  productionAllowed: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  destructiveDbAutoApply: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  quantumSoftwareClaimed: false as const,
  /** Soft-forbid quantum software advantage theater for this slice. */
  quantumAdvantageClaimAllowed: false as const,
  liveSatelliteControl: false as const,
  liveVehicleControl: false as const,
  liveSatelliteFabricationAllowed: false as const,
  liveVehicleFabricationAllowed: false as const,
  chipPartnerVerifiedAllowed: false as const,
  fakeVerifiedPartnerAllowed: false as const,
  honestyLabelsOnly: true as const,
  allowedHonestyLabels: DEVICE_PATHWAY_HONESTY_LABELS,
  pathwayKinds: DEVICE_PATHWAY_KINDS,
  chipPartners: DEVICE_CHIP_PARTNERS,
  chipPartnerStatus: 'WAITING_PARTNER' as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  ticket: '12D-17' as const,
  devicePathwaysWire: 'WIRED' as const,
} as const;

function assertDevicePathwaysGuardrails(): void {
  const g = DEVICE_PATHWAYS_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.simulationOnly) throw new Error('simulationOnly must remain true');
  if (!g.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (g.preferredExecution !== 'LOCAL') throw new Error('preferredExecution must remain LOCAL');
  if (g.cloudSandboxAllowed) throw new Error('cloudSandboxAllowed must remain false -- LOCAL only');
  if (g.productionAllowed) throw new Error('productionAllowed must remain false');
  if (g.productionAutoApply || g.productionAutoMerge || g.productionAutoDeploy) {
    throw new Error('productionAuto* must remain false');
  }
  if (
    g.autonomousProductionDDL ||
    g.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (g.destructiveDbAutoApply) throw new Error('destructiveDbAutoApply must remain false');
  if (g.L4_PRODUCTION_ENABLED) throw new Error('L4_PRODUCTION_ENABLED must remain false');
  if (g.quantumSoftwareClaimed || g.quantumAdvantageClaimAllowed || QUANTUM_ADVANTAGE_CLAIM) {
    throw new Error('quantumSoftwareClaimed / quantum advantage must remain false');
  }
  if (g.liveSatelliteControl || g.liveSatelliteFabricationAllowed) {
    throw new Error('liveSatelliteControl/fabrication must remain false');
  }
  if (g.liveVehicleControl || g.liveVehicleFabricationAllowed) {
    throw new Error('liveVehicleControl/fabrication must remain false');
  }
  if (g.chipPartnerVerifiedAllowed || g.fakeVerifiedPartnerAllowed) {
    throw new Error('chip partners must remain WAITING_PARTNER -- never fake VERIFIED');
  }
  if (!g.honestyLabelsOnly) throw new Error('honestyLabelsOnly must remain true');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpDevicePathwaysGuardrails(): Readonly<Record<string, unknown>> {
  assertDevicePathwaysGuardrails();
  return Object.freeze({
    ticket: DEVICE_PATHWAYS_GUARDRAILS.ticket,
    schemaVersion: DEVICE_PATHWAYS_SCHEMA_VERSION,
    readOnly: true,
    simulationOnly: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...DEVICE_PATHWAYS_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    quantumSoftwareClaimed: false,
    quantumAdvantageClaimAllowed: false,
    liveSatelliteControl: false,
    liveVehicleControl: false,
    chipPartnerVerifiedAllowed: false,
    fakeVerifiedPartnerAllowed: false,
    honestyLabelsOnly: true,
    allowedHonestyLabels: [...DEVICE_PATHWAY_HONESTY_LABELS],
    pathwayKinds: [...DEVICE_PATHWAY_KINDS],
    chipPartners: [...DEVICE_CHIP_PARTNERS],
    chipPartnerStatus: 'WAITING_PARTNER',
    noDdl: true,
    noDml: true,
    noDeploy: true,
    devicePathwaysWire: 'WIRED',
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
  });
}

export function defaultChipPartnerClaims(): DeviceChipPartnerClaim[] {
  assertDevicePathwaysGuardrails();
  return DEVICE_CHIP_PARTNERS.map((partner) => ({
    partner,
    status: 'WAITING_PARTNER' as const,
    notes:
      'WAITING_PARTNER -- ' +
      partner +
      ' silicon/device pathway stub only; no verified partner integration; SIMULATION honesty',
  }));
}

export function assertChipPartnersWaiting(
  claims: readonly DeviceChipPartnerClaim[],
): void {
  assertDevicePathwaysGuardrails();
  for (const claim of claims) {
    if (claim.status !== 'WAITING_PARTNER') {
      throw new Error(
        '12D-17 chip partners must remain WAITING_PARTNER -- never fake VERIFIED (' +
          claim.partner +
          ')',
      );
    }
    if (!DEVICE_CHIP_PARTNERS.includes(claim.partner)) {
      throw new Error('unknown chip partner: ' + claim.partner);
    }
  }
  const seen = new Set(claims.map((c) => c.partner));
  for (const required of DEVICE_CHIP_PARTNERS) {
    if (!seen.has(required)) {
      throw new Error('missing required chip partner stub: ' + required);
    }
  }
}

export function assertPathwayHonesty(stub: DevicePathwayStub): void {
  assertDevicePathwaysGuardrails();
  if (!DEVICE_PATHWAY_HONESTY_LABELS.includes(stub.honesty)) {
    throw new Error('invalid honesty label: ' + String(stub.honesty));
  }
  if (!DEVICE_PATHWAY_KINDS.includes(stub.kind)) {
    throw new Error('invalid pathway kind: ' + String(stub.kind));
  }
  if (stub.quantumSoftwareClaimed) {
    throw new Error('quantumSoftwareClaimed must remain false on pathway stubs');
  }
  if (stub.liveSatelliteControl) {
    throw new Error('liveSatelliteControl must remain false on pathway stubs');
  }
  if (stub.liveVehicleControl) {
    throw new Error('liveVehicleControl must remain false on pathway stubs');
  }
  if (!stub.simulationOnly) throw new Error('pathway stub simulationOnly must remain true');
  if (stub.preferredExecution !== 'LOCAL') {
    throw new Error('pathway stub preferredExecution must remain LOCAL');
  }
  if (!stub.OFFLINE_PREFER_LOCAL) {
    throw new Error('pathway stub OFFLINE_PREFER_LOCAL must remain true');
  }
}

/** Default registry stubs -- one per pathway kind with honesty labels. */
export function defaultDevicePathwayStubs(seed = 'xiv-12d17'): DevicePathwayStub[] {
  assertDevicePathwaysGuardrails();
  const honestyByKind: Record<DevicePathwayKind, DevicePathwayHonestyLabel> = {
    PHONE: 'UNVERIFIED',
    LAPTOP: 'UNVERIFIED',
    AUTO: 'WAITING_PROVIDER',
    TELECOM: 'WAITING_PROVIDER',
    SAT_SIM: 'WAITING_PROVIDER',
    EDGE: 'UNVERIFIED',
  };
  const notesByKind: Record<DevicePathwayKind, string> = {
    PHONE: 'PHONE pathway stub -- UNVERIFIED device surface; no live device control',
    LAPTOP: 'LAPTOP pathway stub -- UNVERIFIED local compute surface; SIMULATION only',
    AUTO: 'AUTO pathway stub -- WAITING_PROVIDER; liveVehicleControl=false',
    TELECOM: 'TELECOM pathway stub -- WAITING_PROVIDER; no live carrier control',
    SAT_SIM: 'SAT_SIM pathway stub -- WAITING_PROVIDER; liveSatelliteControl=false; SIM only',
    EDGE: 'EDGE pathway stub -- UNVERIFIED edge node; OFFLINE_PREFER_LOCAL',
  };
  return DEVICE_PATHWAY_KINDS.map((kind) => ({
    pathwayId: seed + ':pathway:' + kind.toLowerCase(),
    kind,
    honesty: honestyByKind[kind],
    simulationOnly: true as const,
    quantumSoftwareClaimed: false as const,
    liveSatelliteControl: false as const,
    liveVehicleControl: false as const,
    preferredExecution: 'LOCAL' as const,
    OFFLINE_PREFER_LOCAL: true as const,
    notes: notesByKind[kind],
  }));
}

export function createDevicePathwayStub(input: {
  pathwayId: string;
  kind: DevicePathwayKind;
  honesty: DevicePathwayHonestyLabel;
  notes?: string;
}): DevicePathwayStub {
  assertDevicePathwaysGuardrails();
  if (!input.pathwayId) throw new TypeError('pathwayId is required');
  if (!DEVICE_PATHWAY_KINDS.includes(input.kind)) {
    throw new TypeError('invalid pathway kind: ' + String(input.kind));
  }
  if (!DEVICE_PATHWAY_HONESTY_LABELS.includes(input.honesty)) {
    throw new TypeError('invalid honesty label: ' + String(input.honesty));
  }
  const stub: DevicePathwayStub = {
    pathwayId: input.pathwayId,
    kind: input.kind,
    honesty: input.honesty,
    simulationOnly: true,
    quantumSoftwareClaimed: false,
    liveSatelliteControl: false,
    liveVehicleControl: false,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    notes:
      input.notes ??
      (input.kind + ' pathway stub -- ' + input.honesty + '; SIMULATION honesty; no live control'),
  };
  assertPathwayHonesty(stub);
  return stub;
}

/** Explicit ban: claim quantum software advantage on device pathways. */
export function claimQuantumSoftwareOnDevicePathways(): never {
  assertDevicePathwaysGuardrails();
  throw new Error('12D-17 forbids quantumSoftwareClaimed on device pathways');
}

/** Explicit ban: live satellite control. */
export function enableLiveSatelliteControl(): never {
  assertDevicePathwaysGuardrails();
  throw new Error('12D-17 forbids liveSatelliteControl');
}

/** Explicit ban: live vehicle control. */
export function enableLiveVehicleControl(): never {
  assertDevicePathwaysGuardrails();
  throw new Error('12D-17 forbids liveVehicleControl');
}

/** Explicit ban: mark chip partner as verified without integration. */
export function markChipPartnerVerified(_partner: DeviceChipPartner): never {
  assertDevicePathwaysGuardrails();
  throw new Error('12D-17 chip partners must remain WAITING_PARTNER -- never fake VERIFIED');
}

/** Explicit ban: production auto-apply via device pathways. */
export function applyDevicePathwaysProductionAuto(): never {
  assertDevicePathwaysGuardrails();
  throw new Error('12D-17 forbids productionAuto* on device pathways');
}

/** Explicit ban: cloud sandbox / production execution. */
export function enterCloudSandboxViaDevicePathways(): never {
  assertDevicePathwaysGuardrails();
  throw new Error(
    '12D-17 Device Pathways is LOCAL / OFFLINE_PREFER_LOCAL only -- cloud sandbox forbidden',
  );
}

/**
 * Build Device Pathways registry with kind stubs + WAITING_PARTNER chip claims.
 * SIMULATION honesty; no live sat/vehicle/quantum software claims.
 */
export function buildDevicePathwaysRegistry(input?: {
  registryId?: string;
  seed?: string;
  pathways?: readonly DevicePathwayStub[];
  chipPartners?: readonly DeviceChipPartnerClaim[];
}): DevicePathwaysRegistry {
  assertDevicePathwaysGuardrails();
  const seed = input?.seed ?? 'xiv-12d17';
  const registryId = input?.registryId ?? seed + ':device-pathways';
  const pathways = [...(input?.pathways ?? defaultDevicePathwayStubs(seed))];
  for (const stub of pathways) assertPathwayHonesty(stub);
  const kindsPresent = new Set(pathways.map((p) => p.kind));
  for (const kind of DEVICE_PATHWAY_KINDS) {
    if (!kindsPresent.has(kind)) {
      throw new Error('registry missing required pathway kind: ' + kind);
    }
  }

  const chipPartners = [...(input?.chipPartners ?? defaultChipPartnerClaims())];
  assertChipPartnersWaiting(chipPartners);

  const ethicsNotice =
    '12D-17 Device Pathways is a LOCAL / OFFLINE_PREFER_LOCAL registry of PHONE|LAPTOP|AUTO|' +
    'TELECOM|SAT_SIM|EDGE stubs with honesty labels UNVERIFIED|WAITING_PROVIDER. ' +
    'quantumSoftwareClaimed=false. liveSatelliteControl=false. liveVehicleControl=false. ' +
    'Chip partners apple/nvidia/amd/arm/samsung are WAITING_PARTNER only. ' +
    'productionAuto*/L4=false. SIMULATION honesty. Universes = SIMULATION layers only.';
  assertEthicsSafeCopy(ethicsNotice, '12d17 device pathways ethicsNotice');

  return {
    schemaVersion: DEVICE_PATHWAYS_SCHEMA_VERSION,
    registryId,
    simulationOnly: true,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    pathways: Object.freeze(pathways),
    chipPartners: Object.freeze(chipPartners),
    quantumSoftwareClaimed: false,
    liveSatelliteControl: false,
    liveVehicleControl: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    L4_PRODUCTION_ENABLED: false,
    ethicsNotice,
  };
}

export function listDevicePathwayStubs(
  registry: DevicePathwaysRegistry,
): readonly DevicePathwayStub[] {
  assertDevicePathwaysGuardrails();
  return registry.pathways;
}

export function getDevicePathwaysByKind(
  registry: DevicePathwaysRegistry,
  kind: DevicePathwayKind,
): DevicePathwayStub[] {
  assertDevicePathwaysGuardrails();
  return registry.pathways.filter((p) => p.kind === kind);
}

export function getDevicePathwaysByHonesty(
  registry: DevicePathwaysRegistry,
  honesty: DevicePathwayHonestyLabel,
): DevicePathwayStub[] {
  assertDevicePathwaysGuardrails();
  return registry.pathways.filter((p) => p.honesty === honesty);
}

export function listChipPartnerClaims(
  registry: DevicePathwaysRegistry,
): readonly DeviceChipPartnerClaim[] {
  assertDevicePathwaysGuardrails();
  return registry.chipPartners;
}

/** Evidence helper: content hash over guardrail dump + registry summary. */
export function evidenceHashDevicePathways(parts: {
  tipSha?: string;
  registry?: DevicePathwaysRegistry;
  testsPassed?: readonly string[];
}): string {
  assertDevicePathwaysGuardrails();
  const registry = parts.registry;
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: DEVICE_PATHWAYS_SCHEMA_VERSION,
      guardrails: dumpDevicePathwaysGuardrails(),
      tipSha: parts.tipSha ?? null,
      registryId: registry?.registryId ?? null,
      pathwayCount: registry?.pathways.length ?? 0,
      pathwayKinds: registry?.pathways.map((p) => p.kind) ?? [],
      honestyLabels: registry?.pathways.map((p) => p.honesty) ?? [],
      chipPartners: registry?.chipPartners ?? [],
      testsPassed: parts.testsPassed ?? [],
      quantumSoftwareClaimed: false,
      liveSatelliteControl: false,
      liveVehicleControl: false,
      productionAutoApply: false,
      simulationOnly: true,
    }),
  );
}