export type InteractionMode = 'TOUCH' | 'MOUSE_KEYBOARD' | 'VOICE' | 'GAZE' | 'READ_ONLY';

export interface VisualInteractionContract {
  formFactor: 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'XR';
  modes: InteractionMode[];
  drilldownDepth: number;
  supportsOffline: boolean;
  supportsApprovalAction: boolean;
}

export function buildInteractionContract(formFactor: VisualInteractionContract['formFactor']): VisualInteractionContract {
  if (formFactor === 'PHONE') return { formFactor, modes: ['TOUCH','VOICE'], drilldownDepth: 2, supportsOffline: true, supportsApprovalAction: true };
  if (formFactor === 'TABLET') return { formFactor, modes: ['TOUCH','VOICE'], drilldownDepth: 3, supportsOffline: true, supportsApprovalAction: true };
  if (formFactor === 'XR') return { formFactor, modes: ['GAZE','VOICE','READ_ONLY'], drilldownDepth: 2, supportsOffline: false, supportsApprovalAction: false };
  return { formFactor, modes: ['MOUSE_KEYBOARD','VOICE'], drilldownDepth: 4, supportsOffline: true, supportsApprovalAction: true };
}

export const VISUAL_INTERACTION_GUARDRAILS = {
  mobilePrioritizesNarrativeAndApprovals: true,
  desktopPrioritizesExploration: true,
  xrIsResearchInterfaceUntilVerified: true,
  approvalActionsRemainPolicyGated: true,
};
