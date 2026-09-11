export type LocalHealthState = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface LocalHealthReceipt {
  state: LocalHealthState;
  generatedAt: string;
  localhostOnly: true;
  runtimeWritable: boolean;
  ollamaReachable: boolean | null;
  activeAgents: number;
  queueDepth: number;
  checkpointFresh: boolean;
  gpuVerified: boolean;
  notes: string[];
}

export function evaluateLocalHealth(input: Omit<LocalHealthReceipt, 'state' | 'generatedAt' | 'localhostOnly'>): LocalHealthReceipt {
  const notes = [...input.notes];
  let state: LocalHealthState = 'UNVERIFIED';
  if (!input.runtimeWritable) state = 'OFFLINE';
  else if (input.ollamaReachable === true && input.activeAgents >= 0 && input.checkpointFresh) state = 'HEALTHY';
  else if (input.ollamaReachable === false || !input.checkpointFresh) state = 'DEGRADED';
  if (!input.gpuVerified) notes.push('GPU acceleration not verified; CPU fallback remains valid.');
  return { ...input, notes, state, generatedAt: new Date().toISOString(), localhostOnly: true };
}

export const localHealthRoute = {
  method: 'GET',
  path: '/health',
  bind: '127.0.0.1',
  externalExposureAllowed: false,
  topSecretResponseAllowed: false,
};
