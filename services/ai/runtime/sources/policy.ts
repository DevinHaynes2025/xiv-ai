import type { GlobalBrainAllowedCategory } from './types';
import { GLOBAL_BRAIN_ALLOWED_CATEGORIES, GLOBAL_BRAIN_DENIED_CATEGORIES } from './types';

export type GlobalBrainIngestionEvidence = {
  category: string | null;
  sourceId: string | null;
  provenancePresent: boolean;
};

export type GlobalBrainIngestionPolicy = {
  allowedCategories: readonly GlobalBrainAllowedCategory[];
  deniedCategories: readonly string[];
  companyAutomatic: false;
  personalAutomatic: false;
};

export type GlobalBrainIngestionDecision = {
  allowed: boolean;
  reason: string;
  brain: 'global';
};

export function globalBrainIngestionPolicy(): GlobalBrainIngestionPolicy {
  return {
    allowedCategories: GLOBAL_BRAIN_ALLOWED_CATEGORIES,
    deniedCategories: GLOBAL_BRAIN_DENIED_CATEGORIES,
    companyAutomatic: false,
    personalAutomatic: false,
  };
}

export function evaluateGlobalBrainIngestion(input: {
  category: string | null | undefined;
  brainOrigin: 'personal' | 'company' | 'global' | 'external_public';
  provenancePresent: boolean;
  licenseKnown: boolean;
  crossTenant?: boolean;
  unrestrictedAgentIngest?: boolean;
}): GlobalBrainIngestionDecision {
  if (input.unrestrictedAgentIngest) {
    return { allowed: false, reason: 'Agent-requested unrestricted ingestion is denied.', brain: 'global' };
  }
  if (input.crossTenant) {
    return { allowed: false, reason: 'Cross-tenant source access is denied.', brain: 'global' };
  }
  if (!input.provenancePresent) {
    return { allowed: false, reason: 'Missing provenance rejected.', brain: 'global' };
  }
  if (!input.licenseKnown) {
    return { allowed: false, reason: 'Unknown license rejected.', brain: 'global' };
  }
  if (input.brainOrigin === 'company') {
    return {
      allowed: false,
      reason: 'Company Brain data must NEVER automatically flow into Global Brain.',
      brain: 'global',
    };
  }
  if (input.brainOrigin === 'personal') {
    return {
      allowed: false,
      reason: 'Personal data rejected by Global Brain unless an explicit authorized path exists.',
      brain: 'global',
    };
  }
  const category = input.category ?? 'unknown_provenance';
  if ((GLOBAL_BRAIN_DENIED_CATEGORIES as readonly string[]).includes(category)) {
    return { allowed: false, reason: `Global Brain denies category ${category}.`, brain: 'global' };
  }
  if (!(GLOBAL_BRAIN_ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
    return { allowed: false, reason: 'Unknown provenance category denied by default.', brain: 'global' };
  }
  return { allowed: true, reason: 'Public/licensed/authorized source may enter Global Brain policy.', brain: 'global' };
}

export function sourcesUseServiceRole() {
  return false;
}
