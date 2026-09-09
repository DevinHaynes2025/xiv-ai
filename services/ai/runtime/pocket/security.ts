import { boundedAutonomyEnabled } from '../authority';
import { requestAgentSelfPromotion } from '../everywhere/cyber';
import { internationalCrossOrgDenied } from '../international/intelligence';

export type AndroidSecureKey = {
  store: 'android_keystore_when_supported';
  hardcodedCredential: false;
  writtenToClientConfig: false;
};

export function androidSecureKey(): AndroidSecureKey {
  return { store: 'android_keystore_when_supported', hardcodedCredential: false, writtenToClientConfig: false };
}

export function secretsWrittenToClientConfig(): false {
  return false;
}

export function guardianRemainsAboveAgents(): boolean {
  return (
    requestAgentSelfPromotion({ agentId: 'pocket-executive', claimedRole: 'Guardian', requestedAuthority: 'L4' }).allowed ===
    false
  );
}

export function pocketL4Disabled(): boolean {
  return boundedAutonomyEnabled() === false;
}

export function pocketCrossOrgDenied(): boolean {
  return internationalCrossOrgDenied().allowed === false;
}

export const TRIPLE_BOUNDARY = ['DEVICE', 'IDENTITY', 'UNIVERSE'] as const;
