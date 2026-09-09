import { inspectCapabilityRoot, listRootIdentities } from './root-identities';
import { GAP_POLICY, type GapKind } from './information-supply-chain-types';
import type { TypedHighwayGraph } from './typed-highway-edges';
import { describeIntegrationAdapter, type IntegrationAdapterId } from './database-adapters';

export type GapFinding = {
  kind: GapKind;
  subject: string;
  exploit: false;
  attackSteps: [];
  vulnerabilityBypass: false;
  redesign: string;
};

const EXPLOIT_INTENT = /exploit|bypass security|zero[- ]day|hack (the |their )|break into|steal credential/i;

export async function analyzeRootGaps(input: {
  tenantId: string;
  universeId: string;
  requiredCapabilityRoots?: string[];
  requiredIdentityKinds?: Array<'data_root' | 'highway_root' | 'memory_root' | 'vault_root'>;
  root?: string;
}): Promise<GapFinding[]> {
  const findings: GapFinding[] = [];
  for (const capability of input.requiredCapabilityRoots ?? ['guardian', 'local-brain', 'learning-ledger']) {
    const inspect = inspectCapabilityRoot(capability);
    if (!inspect.node) {
      findings.push({
        kind: 'missing_root',
        subject: capability,
        exploit: false,
        attackSteps: [],
        vulnerabilityBypass: false,
        redesign: `Register a durable ${capability} root with tenant/Universe scope instead of inventing a shadow path around it.`,
      });
      continue;
    }
    if (!inspect.readiness.ready) {
      findings.push({
        kind: 'missing_root',
        subject: capability,
        exploit: false,
        attackSteps: [],
        vulnerabilityBypass: false,
        redesign: `Close dependency gaps ${inspect.readiness.missing.join(', ') || inspect.readiness.unavailable.join(', ')} rather than bypassing the root.`,
      });
    }
  }
  const identities = await listRootIdentities({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  for (const kind of input.requiredIdentityKinds ?? []) {
    if (!identities.some((item) => item.kind === kind)) {
      findings.push({
        kind: 'missing_root',
        subject: kind,
        exploit: false,
        attackSteps: [],
        vulnerabilityBypass: false,
        redesign: `Create a local ${kind} identity and cache it offline. Do not impersonate a missing root or punch through another system to invent one.`,
      });
    }
  }
  return findings;
}

export function analyzeHighwayGaps(graph: TypedHighwayGraph): GapFinding[] {
  return graph.highwayGaps().map((gap) => ({
    kind: gap.kind,
    subject: gap.to ? `${gap.from}→${gap.to}` : gap.from,
    exploit: false,
    attackSteps: [] as const,
    vulnerabilityBypass: false as const,
    redesign:
      gap.kind === 'recursive_loop'
        ? 'Redesign the pathway as a DAG with a circuit breaker. Do not follow the recursive loop.'
        : gap.kind === 'stale_path'
          ? 'Refresh or retire the stale highway; do not keep moving data along a dead/stale path.'
          : gap.kind === 'dead_route'
            ? 'Remove the dead route and generate a live query-to-data pathway.'
            : 'Connect the disconnected graph with an explicit typed edge, or keep the query at the source store.',
  }));
}

export function analyzeAdapterGaps(adapters: IntegrationAdapterId[]): GapFinding[] {
  const findings: GapFinding[] = [];
  for (const adapter of adapters) {
    const slot = describeIntegrationAdapter(adapter);
    if (slot.state === 'UNAVAILABLE') {
      findings.push({
        kind: adapter === 'snowflake' || adapter === 'databricks' || adapter === 'aws' ? 'vendor_lock_in' : 'brittle_api',
        subject: adapter,
        exploit: false,
        attackSteps: [],
        vulnerabilityBypass: false,
        redesign: `${adapter} is UNAVAILABLE. Keep query-to-data on local stores. Do not treat an unconfigured vendor slot as a partnership or bypass its security to make it look available.`,
      });
    }
  }
  return findings;
}

export function refuseExploitIntent(intent: string): {
  accepted: false;
  exploit: false;
  attackSteps: [];
  vulnerabilityBypass: false;
  redesign: string;
  policy: typeof GAP_POLICY;
} | { accepted: true; exploit: false } {
  if (EXPLOIT_INTENT.test(intent)) {
    return {
      accepted: false,
      exploit: false,
      attackSteps: [],
      vulnerabilityBypass: false,
      redesign:
        'Loopholes are system weaknesses to redesign around (silos, stale paths, brittle APIs, duplicate movement, disconnected graphs, schema fragmentation, dead routes, vendor lock-in, weak provenance, trust-boundary mistakes, recursive loops). They are not an invitation to exploit another company\'s security.',
      policy: GAP_POLICY,
    };
  }
  return { accepted: true, exploit: false };
}
