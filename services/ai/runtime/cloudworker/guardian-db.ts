/**
 * DB access via Guardian path — no ambient DB credentials in workers.
 */

import type { AdapterLifecycle } from '../cloudworkforce/types';
import type { SecretReference } from './types';
import { createSecretReference } from './secrets';

export type GuardianDbPath = {
  pathId: 'guardian-db-v1';
  lifecycle: AdapterLifecycle;
  workerHoldsDbCredentials: false;
  requiresGuardianBroker: true;
  productionLive: false;
  secretRef: SecretReference;
};

export function openGuardianDbPath(): GuardianDbPath {
  return {
    pathId: 'guardian-db-v1',
    lifecycle: 'CONFIGURED',
    workerHoldsDbCredentials: false,
    requiresGuardianBroker: true,
    productionLive: false,
    secretRef: createSecretReference({
      secretId: 'guardian-db-broker',
      name: 'XIV_GUARDIAN_DB_BROKER',
      provider: 'GUARDIAN_VAULT',
    }),
  };
}

export function workerMayHoldRawDbUrl(_path: GuardianDbPath): false {
  return false;
}

export function requestGuardianDbQuery(
  path: GuardianDbPath,
  input: { workerId: string; sqlFingerprint: string },
): { ok: true; brokered: true; audited: true } | { ok: false; reason: string } {
  if (path.workerHoldsDbCredentials) {
    return { ok: false, reason: 'worker_must_not_hold_db_credentials' };
  }
  if (!path.requiresGuardianBroker) {
    return { ok: false, reason: 'guardian_broker_required' };
  }
  void input;
  return { ok: true, brokered: true, audited: true };
}
