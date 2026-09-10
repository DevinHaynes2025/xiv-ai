export type FullStackRole =
  | 'FULL_STACK_LEAD'
  | 'FRONTEND_ENGINEER'
  | 'BACKEND_ENGINEER'
  | 'MOBILE_ENGINEER'
  | 'API_ENGINEER'
  | 'DATABASE_ENGINEER'
  | 'QA_AUTOMATION'
  | 'UX_ENGINEER'
  | 'ACCESSIBILITY_ENGINEER'
  | 'PERFORMANCE_ENGINEER';

export interface FullStackTeamMember {
  role: FullStackRole;
  mission: string;
  preferredRuntime: 'OLLAMA_LOCAL' | 'HYBRID';
  canUseLovable: boolean;
  productionAuthority: false;
}

export const XIV_FULL_STACK_TEAM: FullStackTeamMember[] = [
  ['FULL_STACK_LEAD', 'Coordinate end-to-end architecture and integration.'],
  ['FRONTEND_ENGINEER', 'Build responsive web surfaces and reusable design-system components.'],
  ['BACKEND_ENGINEER', 'Build tenant-scoped services, authorization boundaries, and offline-safe workflows.'],
  ['MOBILE_ENGINEER', 'Build mobile-first experiences and shared contracts for iOS/Android clients.'],
  ['API_ENGINEER', 'Define typed versioned APIs and local/cloud adapters.'],
  ['DATABASE_ENGINEER', 'Own migrations, indexes, data integrity, and Company Brain persistence.'],
  ['QA_AUTOMATION', 'Create reproducible tests and evidence receipts.'],
  ['UX_ENGINEER', 'Turn agent intelligence into simple story-first user flows.'],
  ['ACCESSIBILITY_ENGINEER', 'Keep experiences keyboard, screen-reader, contrast, and localization aware.'],
  ['PERFORMANCE_ENGINEER', 'Measure latency, bundle/runtime cost, and degraded/offline behavior.'],
].map(([role, mission]) => ({
  role: role as FullStackRole,
  mission: mission as string,
  preferredRuntime: role === 'UX_ENGINEER' || role === 'FRONTEND_ENGINEER' ? 'HYBRID' : 'OLLAMA_LOCAL',
  canUseLovable: role === 'FULL_STACK_LEAD' || role === 'FRONTEND_ENGINEER' || role === 'MOBILE_ENGINEER' || role === 'UX_ENGINEER',
  productionAuthority: false,
}));
