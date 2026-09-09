/**
 * SecretReference — reference-only; never embeds secret values.
 */

import type { SecretReference } from './types';
import type { AdapterLifecycle } from '../cloudworkforce/types';
import { detectCloudDeployment } from './deployment';

export function createSecretReference(input: {
  secretId: string;
  name: string;
  provider?: SecretReference['provider'];
}): SecretReference {
  const provider = input.provider ?? 'GUARDIAN_VAULT';
  let lifecycle: AdapterLifecycle = 'NOT_CONFIGURED';
  if (provider === 'ENV') {
    lifecycle = process.env[input.name] ? 'CONFIGURED' : 'NOT_CONFIGURED';
  } else if (provider === 'CLOUD_SECRET_MANAGER') {
    const cloud = detectCloudDeployment('AWS_ECS');
    lifecycle = cloud.cloudDeployment === 'BLOCKED' ? 'NOT_CONFIGURED' : 'CONFIGURED';
  } else {
    // Guardian vault path — configured as reference routing only in this phase.
    lifecycle = 'CONFIGURED';
  }
  return {
    secretId: input.secretId,
    provider,
    name: input.name,
    resolved: false,
    lifecycle,
    productionLive: false,
  };
}

export function resolveSecretValue(_ref: SecretReference): never {
  throw new Error('REFUSED: SecretReference must not resolve raw secret values in LA-02 runtime');
}

export function secretReferenceHoldsValue(ref: SecretReference): false {
  return ref.resolved;
}
