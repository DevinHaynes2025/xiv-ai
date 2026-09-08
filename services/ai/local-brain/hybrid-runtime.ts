export type RuntimeProvider = 'local' | 'aws' | 'azure' | 'gcp';
export type RuntimeState = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'SUSPENDED';

export type RuntimeRegistration = {
  provider: RuntimeProvider;
  state: RuntimeState;
  configured: boolean;
  authorized: boolean;
  locality: 'device' | 'edge' | 'cloud';
  allowedClassifications: string[];
};

const registrations = new Map<RuntimeProvider, RuntimeRegistration>();

export function registerRuntime(runtime: RuntimeRegistration) {
  if (!runtime.configured || !runtime.authorized) {
    runtime.state = 'UNAVAILABLE';
  }
  registrations.set(runtime.provider, runtime);
  return runtime;
}

export function getRuntime(provider: RuntimeProvider): RuntimeRegistration {
  return registrations.get(provider) ?? {
    provider,
    state: 'UNAVAILABLE',
    configured: false,
    authorized: false,
    locality: provider === 'local' ? 'device' : 'cloud',
    allowedClassifications: [],
  };
}

export function selectRuntime(options: {
  online: boolean;
  classification: string;
  preferred?: RuntimeProvider[];
}) {
  const preferred = options.preferred ?? ['local', 'gcp', 'azure', 'aws'];
  for (const provider of preferred) {
    if (!options.online && provider !== 'local') continue;
    const runtime = getRuntime(provider);
    if (runtime.state !== 'AVAILABLE') continue;
    if (!runtime.allowedClassifications.includes(options.classification)) continue;
    return runtime;
  }
  return null;
}

// Cloud names are capability slots only. No cloud is usable until separately
// configured, authorized, credentialed and verified.
registerRuntime({ provider: 'local', state: 'UNAVAILABLE', configured: false, authorized: false, locality: 'device', allowedClassifications: [] });
registerRuntime({ provider: 'aws', state: 'UNAVAILABLE', configured: false, authorized: false, locality: 'cloud', allowedClassifications: [] });
registerRuntime({ provider: 'azure', state: 'UNAVAILABLE', configured: false, authorized: false, locality: 'cloud', allowedClassifications: [] });
registerRuntime({ provider: 'gcp', state: 'UNAVAILABLE', configured: false, authorized: false, locality: 'cloud', allowedClassifications: [] });
