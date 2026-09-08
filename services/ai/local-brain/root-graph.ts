export type RootNodeKind = 'capability' | 'policy' | 'data_domain' | 'agent_role' | 'runtime' | 'workflow' | 'experience';

export type RootNode = {
  id: string;
  kind: RootNodeKind;
  label: string;
  dependencies: string[];
  tenantScoped: boolean;
  universeScoped: boolean;
  status: 'planned' | 'implemented' | 'verified' | 'unavailable';
};

const roots = new Map<string, RootNode>();

export function registerRoot(node: RootNode) {
  if (node.dependencies.includes(node.id)) throw new Error('root cannot depend on itself');
  roots.set(node.id, node);
  return node;
}

export function rootById(id: string) {
  return roots.get(id) ?? null;
}

export function dependencyClosure(id: string): RootNode[] {
  const visited = new Set<string>();
  const result: RootNode[] = [];
  function visit(nextId: string) {
    if (visited.has(nextId)) return;
    visited.add(nextId);
    const node = roots.get(nextId);
    if (!node) return;
    node.dependencies.forEach(visit);
    result.push(node);
  }
  visit(id);
  return result;
}

[
  { id: 'guardian', kind: 'policy', label: 'Guardian Policy Root', dependencies: [], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'local-brain', kind: 'runtime', label: 'Local Brain Runtime', dependencies: ['guardian'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'agent-mesh', kind: 'capability', label: 'Agent Mesh', dependencies: ['guardian','local-brain'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'learning-ledger', kind: 'data_domain', label: 'Learning Ledger', dependencies: ['guardian','agent-mesh'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'enterprise-os', kind: 'workflow', label: 'Enterprise Operating System', dependencies: ['guardian','agent-mesh','learning-ledger'], tenantScoped: true, universeScoped: true, status: 'planned' },
  { id: 'business-hospital', kind: 'experience', label: 'Business Hospital', dependencies: ['enterprise-os'], tenantScoped: true, universeScoped: true, status: 'planned' },
].forEach((node) => registerRoot(node as RootNode));
