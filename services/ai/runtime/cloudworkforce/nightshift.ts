/**
 * Night Shift mission template — allowed vs NOT automatically allowed work.
 */

export const NIGHT_SHIFT_TEMPLATE_ID = 'night_shift_v1' as const;

export const NIGHT_SHIFT_ALLOWED_WORK = [
  'RESEARCH_SUMMARY',
  'QA_TRIAGE',
  'DATA_QUALITY_CHECK',
  'SANDBOX_PATCH_PREP',
  'SECURITY_REVIEW_NOTES',
  'PRODUCT_IDEA_CAPTURE',
  'CHECKPOINT_AND_DEBRIEF',
  'FOUNDER_BRIEF_AGGREGATION',
  'HANDOFF_VIA_GUARDIAN',
] as const;

export const NIGHT_SHIFT_NOT_AUTOMATICALLY_ALLOWED = [
  'SILENT_PRODUCTION_DEPLOY',
  'L4_AUTONOMY',
  'SELF_GRANT_PERMISSIONS',
  'AUTHORITY_ESCALATION',
  'CROSS_TENANT_ACCESS',
  'CROSS_UNIVERSE_ACCESS',
  'ALL_TOOLS_UNLOCK',
  'GLOBAL_BRAIN_AUTO_PROMOTION',
  'LIVE_EXTERNAL_SEND',
  'SECRET_ROTATION',
  'DISABLE_GUARDIAN',
  'FORCE_PUSH_PROTECTED',
  'FABRICATE_LIVE_247_CLAIM',
] as const;

export type NightShiftAllowedWork = (typeof NIGHT_SHIFT_ALLOWED_WORK)[number];
export type NightShiftForbiddenWork = (typeof NIGHT_SHIFT_NOT_AUTOMATICALLY_ALLOWED)[number];

export type NightShiftMissionTemplate = {
  templateId: typeof NIGHT_SHIFT_TEMPLATE_ID;
  allowed: readonly NightShiftAllowedWork[];
  notAutomaticallyAllowed: readonly NightShiftForbiddenWork[];
  defaultPermissions: 'NONE';
  l4Enabled: false;
  productionLive: false;
  runs247Live: false;
};

export function openNightShiftMissionTemplate(): NightShiftMissionTemplate {
  return {
    templateId: NIGHT_SHIFT_TEMPLATE_ID,
    allowed: NIGHT_SHIFT_ALLOWED_WORK,
    notAutomaticallyAllowed: NIGHT_SHIFT_NOT_AUTOMATICALLY_ALLOWED,
    defaultPermissions: 'NONE',
    l4Enabled: false,
    productionLive: false,
    runs247Live: false,
  };
}

export function evaluateNightShiftWork(
  work: string,
): { allowed: true } | { allowed: false; reason: string; audited: true } {
  if ((NIGHT_SHIFT_NOT_AUTOMATICALLY_ALLOWED as readonly string[]).includes(work)) {
    return { allowed: false, reason: 'not_automatically_allowed', audited: true };
  }
  if ((NIGHT_SHIFT_ALLOWED_WORK as readonly string[]).includes(work)) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'work_not_in_night_shift_allowlist', audited: true };
}
