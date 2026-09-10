export type OnboardingStep = 'WELCOME' | 'ACCOUNT' | 'IDENTITY' | 'MFA_PASSKEY' | 'PRIVACY' | 'CONTRACTS' | 'CONNECTED_APPS' | 'AVATAR' | 'PLAN' | 'DEVICE_TRUST' | 'RECOVERY' | 'FINAL_REVIEW' | 'COMPLETE';
export type SurfaceFormFactor = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP';

export interface OnboardingScreenModel {
  tenantId: string;
  userId: string;
  step: OnboardingStep;
  formFactor: SurfaceFormFactor;
  title: string;
  body: string;
  required: boolean;
  completed: boolean;
  evidenceRefs: string[];
  nextAllowed: boolean;
}

export function buildOnboardingScreen(input: OnboardingScreenModel): OnboardingScreenModel {
  if (!input.tenantId || !input.userId) throw new Error('tenantId and userId required');
  if (input.required && !input.completed && input.nextAllowed) throw new Error('required onboarding step cannot be bypassed');
  return { ...input, evidenceRefs: [...new Set(input.evidenceRefs)] };
}

export const ONBOARDING_EXPERIENCE_GUARDRAILS = {
  noSecurityStepBypass: true,
  contractsMustBeVersioned: true,
  privacyChoicesBeforePersonalization: true,
  accessibilityRequired: true,
  responsiveAcrossMajorFormFactors: true,
  topSecretClientValuesAllowed: false,
};
