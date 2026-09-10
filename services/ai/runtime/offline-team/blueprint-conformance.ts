export type BlueprintArea = 'OFFLINE_FIRST' | 'EVIDENCE' | 'TENANT_ISOLATION' | 'AGENT_GOVERNANCE' | 'DATABASE_GROWTH' | 'HYBRID_CLOUD' | 'CROSS_OS' | 'SIMULATION_HONESTY';

export interface BlueprintCheck {
  area: BlueprintArea;
  status: 'PASS' | 'PARTIAL' | 'FAIL' | 'UNVERIFIED';
  evidence: readonly string[];
  note: string;
}

export interface BlueprintReport {
  generatedAt: string;
  branch: string;
  checks: readonly BlueprintCheck[];
  productionReady: false;
}

export function buildBlueprintReport(branch: string, checks: readonly BlueprintCheck[], now = new Date()): BlueprintReport {
  if (!branch) throw new Error('branch required');
  return Object.freeze({
    generatedAt: now.toISOString(),
    branch,
    checks: Object.freeze(checks.map((c) => Object.freeze({ ...c, evidence: Object.freeze([...c.evidence]) }))),
    productionReady: false,
  });
}
