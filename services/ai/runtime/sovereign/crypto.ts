import type { CryptoReadiness } from './types';

export type CryptoAlgorithmRegistry = {
  algorithmId: string;
  version: string;
  class: 'CLASSICAL' | 'POST_QUANTUM_CANDIDATE';
};

export type CryptoMigrationPolicy = { supported: true; redesignPlatform: false };
export type PostQuantumReadiness = { status: CryptoReadiness; claimedQuantumSecurity: false };
export type KeyRotationPolicy = { rotatable: true };
export type SecurityCriticalAction = {
  founderAuthority: true;
  passkey: true;
  trustedDevice: true;
  stepUp: true;
  humanConfirmation: true;
  audit: true;
};

export type CryptoPolicy = {
  algorithmsVersioned: true;
  migrationSupported: true;
  quantumSecurityProven: false;
};

export const CRYPTO_POLICY: CryptoPolicy = {
  algorithmsVersioned: true,
  migrationSupported: true,
  quantumSecurityProven: false,
};

export function cryptoAlgorithmsAreVersioned(): true {
  return true;
}

export function cryptoMigrationSupported(): true {
  return true;
}

export function quantumSecurityClaimedWithoutProof(): false {
  return false;
}

export function postQuantumReadiness(): PostQuantumReadiness {
  return { status: 'NOT_PROVEN', claimedQuantumSecurity: false };
}
