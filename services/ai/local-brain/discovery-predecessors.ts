import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export type PredecessorId =
  | '62L-AB'
  | '62L-AG'
  | '62L-AH'
  | '62L-AI'
  | '62L-AM'
  | '62L-AO'
  | '62L-AP'
  | '62L-AQ'
  | '62L-AR'
  | '62L-AS';

const PREDECESSOR_FILES: Record<PredecessorId, string[]> = {
  '62L-AB': ['knowledge-lake.ts'],
  '62L-AG': ['evaluation-harness.ts'],
  '62L-AH': ['causal-world-model.ts'],
  '62L-AI': ['research-director.ts', 'negative-result-memory.ts'],
  '62L-AM': ['information-supply-chain.ts', 'data-fabric.ts', 'info-supply-chain.ts'],
  '62L-AO': ['supply-chain-runtime.ts'],
  '62L-AP': ['enterprise-ops-runtime.ts'],
  '62L-AQ': ['ethical-sentinel.ts', 'enterprise-nervous-system.ts'],
  '62L-AR': ['neural-highway-compiler.ts', 'distributed-memory-highway.ts'],
  '62L-AS': ['cognitive-compiler.ts', 'math-reasoning-fabric.ts'],
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  const files = PREDECESSOR_FILES[id];
  return files.some((file) => existsSync(join(HERE, file))) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorMap(): Record<PredecessorId, 'AVAILABLE' | 'WAITING_DATA'> {
  return {
    '62L-AB': predecessorModuleState('62L-AB'),
    '62L-AG': predecessorModuleState('62L-AG'),
    '62L-AH': predecessorModuleState('62L-AH'),
    '62L-AI': predecessorModuleState('62L-AI'),
    '62L-AM': predecessorModuleState('62L-AM'),
    '62L-AO': predecessorModuleState('62L-AO'),
    '62L-AP': predecessorModuleState('62L-AP'),
    '62L-AQ': predecessorModuleState('62L-AQ'),
    '62L-AR': predecessorModuleState('62L-AR'),
    '62L-AS': predecessorModuleState('62L-AS'),
  };
}

export function researchDirectorPresent() {
  return existsSync(join(HERE, 'research-director.ts'));
}

export function cognitiveCompilerPresent() {
  return existsSync(join(HERE, 'cognitive-compiler.ts')) || existsSync(join(HERE, 'math-reasoning-fabric.ts'));
}

export function negativeResultMemoryModulePresent() {
  return existsSync(join(HERE, 'negative-result-memory.ts'));
}
