/**
 * XIV work-surface routing — one home per core so agents do not fork
 * separate AMD, enterprise, mobile, and government brains.
 *
 * Documentation lock only. Does not start routers, buses, or L4.
 */

export const WORK_SURFACES = [
  'GLOBAL_OPERATIONS_BRAIN',
  'ENTERPRISE_OPERATING_SYSTEM',
  'ENGINEERING_CIVILIZATION_ARCHITECTURE',
  'MOBILE_PRODUCT',
] as const;

export type WorkSurface = (typeof WORK_SURFACES)[number];

export const SURFACE_OWNS = {
  GLOBAL_OPERATIONS_BRAIN: [
    'agents',
    'home_base',
    'cpu_gpu_npu_routing',
    'hybrid_cloud',
    'orchestration',
    'neural_pathways',
    'security',
    'compute_graph',
    'message_bus',
    'task_graph',
    'home_base_receipts',
  ],
  ENTERPRISE_OPERATING_SYSTEM: [
    'organizations',
    'erp_crm',
    'contracts',
    'government',
    'pricing',
    'cfo_coo',
    'supply_chain',
    'industry_packs',
  ],
  ENGINEERING_CIVILIZATION_ARCHITECTURE: [
    'long_range_architecture',
    'software_factories',
    'rd',
    'photonics',
    'quantum_research',
    'chip_compatibility_research',
    'space_edge_simulations',
  ],
  MOBILE_PRODUCT: ['ui', 'onboarding', 'consumer_experience', 'employee_experience'],
} as const;

export type StoryKind =
  | 'CORE_COMPUTE_AGENT_INFRASTRUCTURE'
  | 'ENTERPRISE_CUSTOMER_WORKFLOW'
  | 'ENGINEERING_RD'
  | 'MOBILE_PRODUCT_UI';

export function canonicalHomeForStory(kind: StoryKind): WorkSurface {
  switch (kind) {
    case 'CORE_COMPUTE_AGENT_INFRASTRUCTURE':
      return 'GLOBAL_OPERATIONS_BRAIN';
    case 'ENTERPRISE_CUSTOMER_WORKFLOW':
      return 'ENTERPRISE_OPERATING_SYSTEM';
    case 'ENGINEERING_RD':
      return 'ENGINEERING_CIVILIZATION_ARCHITECTURE';
    case 'MOBILE_PRODUCT_UI':
      return 'MOBILE_PRODUCT';
  }
}

export function nextStoryDefaultSurface(): WorkSurface {
  return 'GLOBAL_OPERATIONS_BRAIN';
}

export function surfaceOwnsCanonicalComputeInfra(surface: WorkSurface): boolean {
  return surface === 'GLOBAL_OPERATIONS_BRAIN';
}
