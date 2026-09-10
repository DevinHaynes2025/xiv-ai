export type SecretClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export interface SealedSecretRef { secretId: string; classification: SecretClass; locatorRef: string; checksum?: string; }
export const CONFIDENTIAL_VAULT_GUARDRAILS = {
  plaintextSecretsInSourceAllowed: false,
  secretValuesInLogsAllowed: false,
  topSecretRequiresExternalSecretStore: true,
  tenantIsolationRequired: true,
} as const;
export function validateSealedSecret(ref: SealedSecretRef): boolean {
  if (!ref.secretId || !ref.locatorRef) return false;
  if (ref.classification === 'TOP_SECRET' && !/^vault:|^env:|^kms:|^secret-store:/i.test(ref.locatorRef)) return false;
  return true;
}
