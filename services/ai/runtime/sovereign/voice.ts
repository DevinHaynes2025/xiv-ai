import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';
import type { VoiceMode } from './types';

export type VoiceConsent = { granted: boolean; purpose: VoicePurpose | null };
export type VoicePurpose = 'ASSISTANT' | 'MEETING' | 'PERSONAL_MEMORY' | 'COMPANY_WORKFLOW';
export type VoiceTranscript = { text: string; classified: true };
export type VoiceMemoryPolicy = { destination: 'PERSONAL' | 'COMPANY' | 'NONE'; explicit: boolean };
export type VoiceRetention = { days: number | null; alwaysRetain: false };
export type VoiceDeletionRequest = { honored: true };

export type VoiceSession = {
  mode: VoiceMode;
  microphonePermission: boolean;
  recordingVisible: boolean;
  purpose: VoicePurpose | null;
};

export const DEFAULT_VOICE_MODE: VoiceMode = 'VOICE_OFF';

export function openVoiceSession(input: {
  mode?: VoiceMode;
  microphonePermission: boolean;
  recordingVisible: boolean;
  purpose?: VoicePurpose;
}): VoiceSession | { allowed: false; reason: string } {
  const mode = input.mode ?? DEFAULT_VOICE_MODE;
  if (mode === 'VOICE_OFF') {
    return { allowed: false, reason: 'voice_disabled_by_default' };
  }
  if (!input.microphonePermission) {
    return { allowed: false, reason: 'microphone_requires_permission' };
  }
  if (!input.recordingVisible) {
    return { allowed: false, reason: 'recording_requires_visible_state' };
  }
  if (!input.purpose) {
    return { allowed: false, reason: 'voice_memory_requires_explicit_policy' };
  }
  return {
    mode,
    microphonePermission: true,
    recordingVisible: true,
    purpose: input.purpose,
  };
}

export function alwaysRecordEverythingEnabled(): false {
  return false;
}

export function voiceDisabledByDefault(): boolean {
  return DEFAULT_VOICE_MODE === 'VOICE_OFF';
}

export function personalVoiceEntersCompanyBrainAutomatically(): boolean {
  return evaluateBrainTransfer({ from: 'personal', to: 'company' }).allowed === true;
}

export function companyVoiceEntersGlobalBrainAutomatically(): boolean {
  return companyEntersGlobalBrainAutomatically() || evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed === true;
}

export function storeVoiceMemory(policy: VoiceMemoryPolicy): { allowed: boolean; reason?: string } {
  if (!policy.explicit) {
    return { allowed: false, reason: 'voice_memory_requires_explicit_policy' };
  }
  return { allowed: true };
}
