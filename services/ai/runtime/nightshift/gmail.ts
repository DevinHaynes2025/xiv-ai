/**
 * Gmail as authorized channel contract only.
 * Live send stays NOT_CONFIGURED unless proven.
 */
import type { CapabilityLifecycle } from './types';

export type GmailChannelContract = {
  channelId: 'GMAIL';
  authorizedChannelContract: true;
  liveSend: CapabilityLifecycle;
  productionLive: false;
};

let gmailLiveSendProven = false;

export function resetGmailProofForTests(): void {
  gmailLiveSendProven = false;
}

export function recordGmailLiveSendProof(): void {
  gmailLiveSendProven = true;
}

export function openGmailChannelContract(): GmailChannelContract {
  return {
    channelId: 'GMAIL',
    authorizedChannelContract: true,
    liveSend: gmailLiveSendProven ? 'LIVE' : 'NOT_CONFIGURED',
    productionLive: false,
  };
}

export function gmailLiveSendState(): CapabilityLifecycle {
  return gmailLiveSendProven ? 'LIVE' : 'NOT_CONFIGURED';
}

export function sendViaGmail(input: {
  consentOk: boolean;
  liveSendProven?: boolean;
}) {
  if (!input.consentOk) {
    return { allowed: false as const, reason: 'gmail_requires_consent' };
  }
  if (!(input.liveSendProven === true || gmailLiveSendProven)) {
    return { allowed: false as const, reason: 'gmail_live_send_not_configured' };
  }
  return { allowed: true as const };
}

export function gmailLiveSendConfiguredWithoutProof(): boolean {
  return false;
}
