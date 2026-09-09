export type AcceleratorKind =
  | 'cpu_x86_64'
  | 'cpu_arm64'
  | 'nvidia_cuda'
  | 'amd_rocm'
  | 'apple_metal'
  | 'samsung_arm'
  | 'quantum_simulator'
  | 'quantum_qpu';

export type AcceleratorState = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'SUSPENDED';

export type AcceleratorRegistration = {
  id: string;
  kind: AcceleratorKind;
  vendor: 'generic' | 'nvidia' | 'amd' | 'apple' | 'samsung' | 'quantum-provider';
  state: AcceleratorState;
  configured: boolean;
  authorized: boolean;
  local: boolean;
  capabilities: string[];
  evidenceRefs: string[];
};

const registry = new Map<string, AcceleratorRegistration>();

export function registerAccelerator(input: AcceleratorRegistration) {
  const registration = { ...input };
  if (!registration.configured || !registration.authorized) registration.state = 'UNAVAILABLE';
  if (registration.state === 'AVAILABLE' && registration.evidenceRefs.length === 0) {
    throw new Error('AVAILABLE accelerator requires verification evidence');
  }
  registry.set(registration.id, registration);
  return registration;
}

export function acceleratorById(id: string) {
  return registry.get(id) ?? null;
}

export function selectAccelerator(requiredCapability: string, options?: { localOnly?: boolean }) {
  return [...registry.values()].find((item) =>
    item.state === 'AVAILABLE' &&
    item.capabilities.includes(requiredCapability) &&
    (!options?.localOnly || item.local),
  ) ?? null;
}

// Capability slots are deliberately unavailable until a host probe proves them.
[
  ['cpu_x86_64', 'generic'],
  ['cpu_arm64', 'generic'],
  ['nvidia_cuda', 'nvidia'],
  ['amd_rocm', 'amd'],
  ['apple_metal', 'apple'],
  ['samsung_arm', 'samsung'],
  ['quantum_simulator', 'quantum-provider'],
  ['quantum_qpu', 'quantum-provider'],
].forEach(([kind, vendor]) => registerAccelerator({
  id: `slot_${kind}`,
  kind: kind as AcceleratorKind,
  vendor: vendor as AcceleratorRegistration['vendor'],
  state: 'UNAVAILABLE',
  configured: false,
  authorized: false,
  local: !kind.startsWith('quantum_'),
  capabilities: [],
  evidenceRefs: [],
}));
