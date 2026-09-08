import type { MeshAgentRole } from './agent-mesh';

export type BusinessDepartment = {
  key: string;
  name: string;
  responsibilities: string[];
  defaultAgentRoles: MeshAgentRole[];
};

export const BUSINESS_DEPARTMENTS: BusinessDepartment[] = [
  {
    key: 'executive',
    name: 'Executive Office',
    responsibilities: ['strategy', 'prioritization', 'risk review', 'cross-functional synthesis', 'briefing', 'meeting and decision preparation'],
    defaultAgentRoles: [
      'executive_secretary',
      'executive_synthesizer',
      'decision_strategist',
      'workflow_planner',
      'business_analyst',
      'evidence_verifier',
      'skeptic',
    ],
  },
  {
    key: 'engineering',
    name: 'Engineering & Architecture',
    responsibilities: ['architecture', 'software delivery', 'testing', 'security', 'reliability'],
    defaultAgentRoles: ['architect', 'coder', 'tester', 'security', 'evidence_verifier'],
  },
  {
    key: 'operations',
    name: 'Operations',
    responsibilities: ['process health', 'capacity', 'quality', 'continuous improvement'],
    defaultAgentRoles: ['operations_analyst', 'workflow_planner', 'business_analyst', 'skeptic'],
  },
  {
    key: 'supply_chain',
    name: 'Supply Chain & Logistics',
    responsibilities: ['inventory', 'transportation', 'supplier risk', 'warehousing', 'information logistics'],
    defaultAgentRoles: ['supply_chain_analyst', 'business_analyst', 'evidence_verifier'],
  },
  {
    key: 'finance',
    name: 'Finance & Capital',
    responsibilities: ['financial analysis', 'budgeting', 'scenario modeling', 'market intelligence'],
    defaultAgentRoles: ['finance_analyst', 'decision_strategist', 'business_analyst', 'skeptic', 'evidence_verifier'],
  },
  {
    key: 'research',
    name: 'Research & Civilization Intelligence',
    responsibilities: ['historical research', 'culture', 'public institutions', 'science', 'humanities', 'knowledge curation'],
    defaultAgentRoles: ['researcher', 'culture_historian', 'knowledge_curator', 'memory_librarian', 'evidence_verifier', 'skeptic'],
  },
];

export function departmentByKey(key: string) {
  return BUSINESS_DEPARTMENTS.find((department) => department.key === key);
}
