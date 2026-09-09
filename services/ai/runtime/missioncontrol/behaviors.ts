/**
 * Shift behavior flows for Engineering / Research / QA / Database / Security /
 * Knowledge / Product / Sales / Supply Chain.
 * No automatic consequential production deployment.
 */

import type { ShiftTemplateId } from './types';

export type ShiftBehaviorFlow = {
  shiftId: ShiftTemplateId;
  steps: readonly string[];
  allowsSilentProductionDeploy: false;
  allowsSpamOutreach: false;
  destructiveDbRequiresAuthority: true;
};

const FLOWS: Record<ShiftTemplateId, readonly string[]> = {
  ENGINEERING_SHIFT: [
    'STORY',
    'ARCHITECTURE',
    'IMPLEMENTATION',
    'TYPECHECK',
    'TEST',
    'SECURITY',
    'REVIEW',
    'CHECKPOINT',
    'COMMIT',
  ],
  RESEARCH_SHIFT: [
    'QUESTION',
    'AUTHORIZED_SOURCES',
    'RETRIEVE',
    'PROVENANCE',
    'VERIFY',
    'CONTRADICTION',
    'SYNTHESIS',
    'KNOWLEDGE_CANDIDATE',
  ],
  QA_SHIFT: [
    'UNIT',
    'INTEGRATION',
    'API',
    'DATABASE',
    'RLS',
    'SECURITY',
    'AGENT',
    'MOBILE',
    'WEB',
    'OFFLINE',
    'SYNC',
    'REGRESSION',
    'ACCESSIBILITY',
    'PERFORMANCE',
  ],
  DATABASE_SHIFT: [
    'RLS',
    'TENANT_ISOLATION',
    'MIGRATION_STATE',
    'SLOW_QUERIES',
    'INDEXES',
    'SCHEMA_QUALITY',
    'LINEAGE',
    'BACKUP_EVIDENCE',
    'CONNECTION_HEALTH',
    'PROPOSE_ONLY',
  ],
  SECURITY_SHIFT: [
    'AUTHENTICATION',
    'AUTHORIZATION',
    'TENANT_BOUNDARIES',
    'AGENT_PERMISSIONS',
    'TOOL_CALLS',
    'SECRETS',
    'DEPENDENCY_RISKS',
    'PROMPT_INJECTION',
    'CROSS_TENANT_LEAKAGE',
    'UNSAFE_ACTIONS',
    'STOP_UNSAFE_WORK',
  ],
  KNOWLEDGE_SHIFT: [
    'STALE_KNOWLEDGE',
    'MISSING_EVIDENCE',
    'CONTRADICTIONS',
    'DUPLICATES',
    'BROKEN_PROVENANCE',
    'GAPS',
    'RETRIEVAL_QUALITY',
    'REPAIR_OR_RESEARCH',
  ],
  PRODUCT_SHIFT: [
    'USER_FEEDBACK',
    'BUGS',
    'FAILURES',
    'ANALYTICS',
    'RESEARCH',
    'CUSTOMER_OUTCOMES',
    'ENGINEERING_DEBT',
    'PROPOSE_STORIES',
  ],
  SALES_RESEARCH_SHIFT: [
    'AUTHORIZED_RESEARCH',
    'ACCOUNT_ANALYSIS',
    'INDUSTRY_ANALYSIS',
    'XIV_FIT',
    'DEMO_PREP',
    'PROPOSAL_DRAFTS',
  ],
  SUPPLY_CHAIN_SHIFT: [
    'INVENTORY',
    'SUPPLIERS',
    'SHIPMENTS',
    'WAREHOUSES',
    'ORDERS',
    'TRANSPORTATION',
    'EXCEPTIONS',
    'OBSERVATION',
    'EVIDENCE',
    'IMPACT',
    'CAUSES',
    'OPTIONS',
    'RECOMMENDATION',
  ],
  RELIABILITY_SHIFT: ['HEALTH', 'RECOVERY', 'ALERTS', 'CHECKPOINT', 'HANDOFF'],
  FOUNDER_BRIEF_SHIFT: [
    'MISSIONS_COMPLETED',
    'CODE_BUILT',
    'TESTS',
    'RESEARCH',
    'DB',
    'SECURITY',
    'KNOWLEDGE',
    'COST',
    'DECISIONS_REQUIRED',
  ],
};

export function getShiftBehavior(shiftId: ShiftTemplateId): ShiftBehaviorFlow {
  return {
    shiftId,
    steps: FLOWS[shiftId],
    allowsSilentProductionDeploy: false,
    allowsSpamOutreach: false,
    destructiveDbRequiresAuthority: true,
  };
}

export function engineeringAllowsAutoProdDeploy(): false {
  return false;
}

export function salesAllowsSpam(): false {
  return false;
}

export function databaseAgentsProposeOnly(): true {
  return true;
}

export function securityFindingsCanStopUnsafeWork(): true {
  return true;
}

export function unknownRemainsValidInResearch(): true {
  return true;
}
