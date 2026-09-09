import { providerSlots } from './provider-fabric';
import { cortexId } from './cortex-store';

export type SignalKind =
  | 'radio'
  | 'optical_laser'
  | 'acoustic'
  | 'satellite_orbital'
  | 'terrestrial_network'
  | 'quantum_research'
  | 'dark_matter_research'
  | 'dark_energy_research'
  | 'galactic_research';

export type SignalMode = 'hardware_interface' | 'simulation' | 'research_domain_only';
export type SignalState = 'AVAILABLE' | 'SIMULATION_ONLY' | 'UNAVAILABLE' | 'RESEARCH_DOMAIN_ONLY';

export type SignalPathway = {
  id: string;
  kind: SignalKind;
  label: string;
  mode: SignalMode;
  state: SignalState;
  adapterConfigured: boolean;
  adapterAuthorized: boolean;
  evidenceRefs: string[];
  usableAsCompute: false;
  controlsPhysicalDevices: false;
  notes: string;
};

const registry = new Map<string, SignalPathway>();

function seed(kind: SignalKind, label: string, mode: SignalMode, notes: string): SignalPathway {
  const researchOnly = mode === 'research_domain_only';
  const pathway: SignalPathway = {
    id: `signal_${kind}`,
    kind,
    label,
    mode,
    state: researchOnly ? 'RESEARCH_DOMAIN_ONLY' : 'UNAVAILABLE',
    adapterConfigured: false,
    adapterAuthorized: false,
    evidenceRefs: [],
    usableAsCompute: false,
    controlsPhysicalDevices: false,
    notes,
  };
  registry.set(pathway.id, pathway);
  return pathway;
}

seed('radio', 'Radio pathway', 'simulation', 'Radio is a simulator or authorized adapter interface. No physical transmitter is controlled.');
seed('optical_laser', 'Optical / laser pathway', 'simulation', 'Optical/laser is a simulator or authorized adapter interface. No laser hardware is controlled.');
seed('acoustic', 'Acoustic pathway', 'simulation', 'Acoustic is a simulator or authorized adapter interface. No speaker/sonar hardware is controlled.');
seed('satellite_orbital', 'Satellite / orbital research gateway', 'simulation', 'Satellite/orbital is an interface or simulation. XIV does not control physical satellites or orbital devices.');
seed('terrestrial_network', 'Terrestrial network', 'hardware_interface', 'Local/terrestrial network remains UNAVAILABLE until configured, authorized, and evidenced.');
seed('quantum_research', 'Quantum research signalling', 'simulation', 'Quantum signalling is bounded research, not production magic or a live QPU link.');
seed('dark_matter_research', 'Dark matter research domain', 'research_domain_only', 'Dark matter is a research domain only. It is not compute or network infrastructure.');
seed('dark_energy_research', 'Dark energy research domain', 'research_domain_only', 'Dark energy is a research domain only. It is not compute or network infrastructure.');
seed('galactic_research', 'Galactic infrastructure research', 'research_domain_only', 'Galactic infrastructure is simulation/research only.');

export function listSignalPathways() {
  return [...registry.values()].map((item) => ({ ...item, evidenceRefs: [...item.evidenceRefs] }));
}

export function getSignalPathway(kind: SignalKind) {
  return registry.get(`signal_${kind}`) ?? null;
}

export function registerSignalAdapter(input: {
  kind: SignalKind;
  adapterConfigured: boolean;
  adapterAuthorized: boolean;
  evidenceRefs: string[];
}) {
  const existing = getSignalPathway(input.kind);
  if (!existing) throw new Error('SIGNAL_KIND_UNKNOWN');
  if (existing.mode === 'research_domain_only') {
    return { ...existing, state: 'RESEARCH_DOMAIN_ONLY' as const, adapterConfigured: false, adapterAuthorized: false };
  }
  const usableHardware = input.adapterConfigured && input.adapterAuthorized && input.evidenceRefs.length > 0;
  const next: SignalPathway = {
    ...existing,
    adapterConfigured: input.adapterConfigured,
    adapterAuthorized: input.adapterAuthorized,
    evidenceRefs: [...input.evidenceRefs],
    state: usableHardware ? 'AVAILABLE' : existing.mode === 'simulation' ? 'SIMULATION_ONLY' : 'UNAVAILABLE',
    controlsPhysicalDevices: false,
    usableAsCompute: false,
  };
  registry.set(next.id, next);
  return next;
}

export type PathwaySimulation = {
  id: string;
  kind: SignalKind;
  from: string;
  to: string;
  latencyMs: number;
  loss: number;
  isHardwareControl: false;
  isReality: false;
  state: SignalState;
  notes: string[];
};

export function simulateSignalPathway(input: {
  kind: Extract<SignalKind, 'radio' | 'optical_laser' | 'acoustic' | 'satellite_orbital'>;
  from: string;
  to: string;
  distanceKm?: number;
}): PathwaySimulation {
  const pathway = getSignalPathway(input.kind);
  if (!pathway) throw new Error('SIGNAL_KIND_UNKNOWN');
  const distance = Math.max(0, input.distanceKm ?? 1);
  const speed =
    input.kind === 'acoustic' ? 0.343
      : input.kind === 'radio' || input.kind === 'optical_laser' || input.kind === 'satellite_orbital' ? 299_792
        : 1;
  const latencyMs = Math.max(0.01, (distance / speed) * 1000);
  const loss = Math.min(0.95, distance / (input.kind === 'acoustic' ? 50 : 40_000));
  return {
    id: cortexId('sigsim'),
    kind: input.kind,
    from: input.from,
    to: input.to,
    latencyMs,
    loss,
    isHardwareControl: false,
    isReality: false,
    state: pathway.state === 'AVAILABLE' ? 'AVAILABLE' : 'SIMULATION_ONLY',
    notes: [
      pathway.notes,
      'This is a local physics-inspired simulation, not a live RF/laser/acoustic emission.',
      'XIV does not control physical radios, lasers, speakers, or satellites.',
    ],
  };
}

export function satelliteOrbitalGateway() {
  const pathway = getSignalPathway('satellite_orbital')!;
  const starlink = providerSlots().find((slot) => slot.provider === 'starlink');
  return {
    ...pathway,
    controlPhysicalSatellites: false as const,
    hardwareAdapter: pathway.adapterConfigured && pathway.adapterAuthorized ? pathway.state : 'UNAVAILABLE' as const,
    starlinkTransport: starlink?.configured && starlink.authorized ? starlink.state : 'UNAVAILABLE' as const,
    starlinkIsCompute: false as const,
    notes: [
      pathway.notes,
      'Starlink, when present, is network transport only — not compute and not an AI provider.',
      'Unconfigured satellite adapters remain UNAVAILABLE.',
    ],
  };
}

export function signalInfrastructureHonesty() {
  const pathways = listSignalPathways();
  return {
    darkMatterAsInfrastructure: false as const,
    darkEnergyAsInfrastructure: false as const,
    galacticInfrastructureReal: false as const,
    satelliteControl: false as const,
    unconfiguredRemainUnavailable: pathways
      .filter((item) => item.mode !== 'research_domain_only' && !item.adapterConfigured)
      .every((item) => item.state === 'UNAVAILABLE' || item.state === 'SIMULATION_ONLY'),
    researchDomains: pathways.filter((item) => item.mode === 'research_domain_only').map((item) => item.kind),
  };
}
