export type RootNodeKind = 'capability' | 'policy' | 'data_domain' | 'agent_role' | 'runtime' | 'workflow' | 'experience' | 'compute' | 'infrastructure';

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

function assertNoCycle(candidate: RootNode) {
  const view = new Map(roots);
  view.set(candidate.id, candidate);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string) {
    if (visiting.has(id)) throw new Error(`root dependency cycle detected at ${id}`);
    if (visited.has(id)) return;
    const node = view.get(id);
    if (!node) return;
    visiting.add(id);
    node.dependencies.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }

  visit(candidate.id);
}

export function registerRoot(node: RootNode) {
  if (!node.id.trim()) throw new Error('root id is required');
  if (node.dependencies.includes(node.id)) throw new Error('root cannot depend on itself');
  if (new Set(node.dependencies).size !== node.dependencies.length) throw new Error('duplicate root dependency');
  assertNoCycle(node);
  roots.set(node.id, { ...node, dependencies: [...node.dependencies] });
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

export function dependencyReadiness(id: string) {
  const node = roots.get(id);
  if (!node) return { ready: false, missing: [id], unavailable: [] as string[] };
  const missing = new Set<string>();
  const unavailable = new Set<string>();
  const visited = new Set<string>();
  function inspect(nextId: string) {
    if (visited.has(nextId)) return;
    visited.add(nextId);
    const next = roots.get(nextId);
    if (!next) {
      missing.add(nextId);
      return;
    }
    if (next.status === 'unavailable') unavailable.add(nextId);
    next.dependencies.forEach(inspect);
  }
  node.dependencies.forEach(inspect);
  return { ready: missing.size === 0 && unavailable.size === 0, missing: [...missing], unavailable: [...unavailable] };
}

[
  { id: 'guardian', kind: 'policy', label: 'Guardian Policy Root', dependencies: [], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'local-brain', kind: 'runtime', label: 'Local Brain Runtime', dependencies: ['guardian'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'agent-mesh', kind: 'capability', label: 'Agent Mesh', dependencies: ['guardian','local-brain'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'learning-ledger', kind: 'data_domain', label: 'Learning Ledger', dependencies: ['guardian','agent-mesh'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'accelerator-fabric', kind: 'compute', label: 'Multi-Accelerator Fabric', dependencies: ['guardian','local-brain'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'quantum-research', kind: 'capability', label: 'Governed Quantum Research', dependencies: ['guardian','accelerator-fabric'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'infrastructure-pathways', kind: 'infrastructure', label: 'Infrastructure Pathway Graph', dependencies: ['guardian','learning-ledger'], tenantScoped: true, universeScoped: true, status: 'implemented' },
  { id: 'enterprise-os', kind: 'workflow', label: 'Enterprise Operating System', dependencies: ['guardian','agent-mesh','learning-ledger'], tenantScoped: true, universeScoped: true, status: 'planned' },
  { id: 'business-hospital', kind: 'experience', label: 'Business Hospital', dependencies: ['enterprise-os'], tenantScoped: true, universeScoped: true, status: 'planned' },
].forEach((node) => registerRoot(node as RootNode));
