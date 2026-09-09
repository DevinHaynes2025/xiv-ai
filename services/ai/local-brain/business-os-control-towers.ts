import { conveneReflectionCouncil } from './reflection-council';
import { runDepartmentWorkcell } from './enterprise-ops-workcells';
import {
  ATC_HIGHWAY_CONTROL_DENIED,
  INDUSTRY_LAYERS,
  type ControlTowerMode,
  type IndustryLayer,
} from './business-os-types';
import { probeAllExternalSystems, requestPhysicalControl } from './business-os-safety';

export type LogisticsSafetyCore = {
  core: 'logistics_safety';
  physicalAtc: false;
  highwayVehicleControl: false;
  vehicleActuation: false;
  recommendation: string;
  productionAuthorization: false;
};

export function logisticsSafetyCore(need: string): LogisticsSafetyCore {
  return {
    core: 'logistics_safety',
    physicalAtc: false,
    highwayVehicleControl: false,
    vehicleActuation: false,
    recommendation: `Logistics/safety core plan for "${need}": observe, recommend, and escalate to humans. Do not control aircraft, highways, or vehicles.`,
    productionAuthorization: false,
  };
}

export type VirtualControlTower = {
  mode: ControlTowerMode;
  kind: 'business_operations_interface';
  isAirTrafficControl: false;
  isHighwayVehicleControl: false;
  physicalControl: false;
  l4AutonomyEnabled: false;
  autoExecution: false;
  state: 'PASS' | 'DENIED';
  reason: string;
};

export function openVirtualControlTower(input: {
  mode: ControlTowerMode;
  physicalControlClaim?: string;
}): VirtualControlTower {
  if (input.physicalControlClaim) {
    const deny = requestPhysicalControl(input.physicalControlClaim);
    return {
      mode: input.mode,
      kind: 'business_operations_interface',
      isAirTrafficControl: false,
      isHighwayVehicleControl: false,
      physicalControl: false,
      l4AutonomyEnabled: false,
      autoExecution: false,
      state: 'DENIED',
      reason: deny.reason,
    };
  }
  return {
    mode: input.mode,
    kind: 'business_operations_interface',
    isAirTrafficControl: false,
    isHighwayVehicleControl: false,
    physicalControl: false,
    l4AutonomyEnabled: false,
    autoExecution: false,
    state: 'PASS',
    reason: 'Virtual Control Tower is a business operations interface. It is not physical ATC or highway vehicle control.',
  };
}

export type IndustryAppLayer = {
  layer: IndustryLayer;
  sitsOn: 'logistics_safety';
  connectors: ReturnType<typeof probeAllExternalSystems>;
  workcellRecommendation: string | null;
  replacesErpBankPosWms: false;
  productionAuthorization: false;
};

export function industryAppLayer(layer: IndustryLayer, need: string): IndustryAppLayer {
  const enterprise = layer === 'enterprise_ops'
    ? runDepartmentWorkcell('executive', need)
    : null;
  return {
    layer,
    sitsOn: 'logistics_safety',
    connectors: probeAllExternalSystems(),
    workcellRecommendation: enterprise?.recommendation ?? `${layer} industry layer recommendation over the logistics/safety core. Bridge only.`,
    replacesErpBankPosWms: false,
    productionAuthorization: false,
  };
}

export function catalogIndustryLayers(need: string) {
  return INDUSTRY_LAYERS.map((layer) => industryAppLayer(layer, need));
}

export async function conveneBusinessOsCouncil(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
  physicalControlClaim?: string;
}) {
  if (input.physicalControlClaim) {
    const deny = requestPhysicalControl(input.physicalControlClaim);
    return {
      allowed: false as const,
      reason: deny.reason,
      consensusForced: false as const,
      productionAuthorized: false as const,
      council: null,
    };
  }
  const council = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    root: input.root,
  });
  return {
    allowed: true as const,
    reason: 'Local reflection council may plan/recommend. AG society module remains a predecessor probe.',
    consensusForced: false as const,
    productionAuthorized: false as const,
    council,
  };
}

export function proveNotPhysicalAtc(tower: VirtualControlTower) {
  return {
    isAirTrafficControl: tower.isAirTrafficControl,
    isHighwayVehicleControl: tower.isHighwayVehicleControl,
    physicalControl: tower.physicalControl,
    deniedReason: tower.state === 'DENIED' ? tower.reason : ATC_HIGHWAY_CONTROL_DENIED,
    virtualControlTowerMeansBusinessOps: true as const,
  };
}
