import { proposeStructuredPatch, type PatchFileChange } from './coding-agent';
import { runProtectedCodingWorkcell } from './offline-workcells';
import { verifySecurity } from './security-verifier';
import { runTestingAgent, type TestingAgentRunner } from './testing-agent';
import { readApprovedContext } from './context-vault';
import { decisionGate } from './decision-gate';
import { refuseSealedReplication } from './research-authority';
import type { AllowedLocalCommand } from './local-command-runner';
import type { ProtectedSandbox } from './software-factory-sandbox';

export type FactoryRequirements = {
  storyId: string;
  tenantId: string;
  universeId: string;
  objective: string;
  acceptance: string[];
  source: 'approved_story' | 'verified_discovery';
  inventedFacts: false;
};

export type FactoryArchitecture = {
  cycle: 'offline_software_factory';
  workcell: 'engineering';
  sandboxRequired: true;
  productionAuthorization: false;
  summary: string;
};

export type ApiContract = {
  name: string;
  version: string;
  paths: string[];
  published: false;
  productionEndpoint: false;
};

export type FactoryDiscoveryIntake = {
  summary: string;
  promoted: boolean;
  state: 'SUPPORTED' | 'UNVERIFIED' | 'REVIEW_REQUIRED';
  verifiedFact: false;
  replicated: boolean;
  sealed?: unknown;
};

export function acceptAiVerifiedDiscovery(input: FactoryDiscoveryIntake) {
  const sealed = refuseSealedReplication(input.sealed ?? {});
  if (!sealed.allowed) {
    return {
      accepted: false as const,
      reason: sealed.reason,
      source: 'verified_discovery' as const,
      ceoSealedNonReplicating: true as const,
    };
  }
  if (input.verifiedFact) {
    return {
      accepted: false as const,
      reason: 'Factory refuses invented VERIFIED_FACT. 62L-AI never assigns verified fact.',
      source: 'verified_discovery' as const,
    };
  }
  if (!input.promoted || input.state !== 'SUPPORTED' || !input.replicated) {
    return {
      accepted: false as const,
      reason: 'Discovery is not independently replicated and promoted by 62L-AI. Factory input DENIED.',
      source: 'verified_discovery' as const,
    };
  }
  return {
    accepted: true as const,
    source: 'verified_discovery' as const,
    reason: '62L-AI supported local discovery may enter the factory as a build-candidate input only. Not a release.',
    productionAuthorization: false as const,
  };
}

export function deriveRequirements(input: {
  storyId: string;
  tenantId: string;
  universeId: string;
  objective: string;
  source: 'approved_story' | 'verified_discovery';
  acceptance?: string[];
}): FactoryRequirements {
  return {
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective.trim(),
    acceptance: input.acceptance ?? [
      'Tenant and Universe boundaries are preserved.',
      'Compile and tests passing does not authorize release.',
      'Unconfigured providers remain UNAVAILABLE.',
    ],
    source: input.source,
    inventedFacts: false,
  };
}

export async function loadRequirementsContext(input: {
  repoRoot: string;
  path: string;
}) {
  return readApprovedContext(input.repoRoot, input.path);
}

export function recordArchitecture(objective: string): FactoryArchitecture {
  return {
    cycle: 'offline_software_factory',
    workcell: 'engineering',
    sandboxRequired: true,
    productionAuthorization: false,
    summary: `Candidate architecture for: ${objective.trim()}`,
  };
}

export function generateAgentCode(input: {
  storyId: string;
  tenantId: string;
  universeId: string;
  summary: string;
  files: PatchFileChange[];
  testsExpected: string[];
  requestedShell?: string[];
}) {
  if (!input.testsExpected.length) {
    return { accepted: false as const, reason: 'TEST_FIRST_REQUIRED: agent code generation requires testsExpected before a candidate is accepted.' };
  }
  return proposeStructuredPatch({
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.summary,
    files: input.files,
    testsExpected: input.testsExpected,
    requestedShell: input.requestedShell,
  });
}

export async function runEngineeringWorkcell(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  objective: string;
  files: PatchFileChange[];
  testsExpected: AllowedLocalCommand[];
  cwd: string;
  runner?: TestingAgentRunner;
  requestedShell?: string[];
  currentBranch?: string;
  approved?: boolean;
  root?: string;
}) {
  return runProtectedCodingWorkcell({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    objective: input.objective,
    files: input.files,
    testsExpected: input.testsExpected,
    cwd: input.cwd,
    runner: input.runner,
    requestedShell: input.requestedShell,
    currentBranch: input.currentBranch,
    approved: input.approved,
    root: input.root,
  });
}

export async function runTestFirstAcceptance(input: {
  cwd: string;
  testsExpected: string[];
  runner?: TestingAgentRunner;
}) {
  if (!input.testsExpected.length) {
    return {
      passed: false as const,
      reason: 'TEST_FIRST_REQUIRED: no acceptance tests were declared.',
      results: [],
      productionEffect: false as const,
      productionAuthorization: false as const,
    };
  }
  return runTestingAgent({
    cwd: input.cwd,
    commands: input.testsExpected,
    runner: input.runner,
  });
}

export function reviewSecurityCandidate(input: {
  files: Array<{ path: string; content?: string; unifiedDiff?: string }>;
  currentBranch?: string;
  tenantBoundaryChanged?: boolean;
}) {
  return verifySecurity({
    files: input.files,
    currentBranch: input.currentBranch,
    tenantBoundaryChanged: input.tenantBoundaryChanged,
    productionLocks: {
      l4Autonomy: false,
      autoProduction: false,
      productionDbWrite: false,
      productionGitPush: false,
      guardianOverride: false,
    },
  });
}

export function reviewApiContract(input: {
  name: string;
  version: string;
  paths: string[];
  publish?: boolean;
  productionEndpoint?: boolean;
}) {
  if (!input.name.trim() || !input.version.trim() || input.paths.length === 0) {
    return { accepted: false as const, reason: 'API contract requires name, version, and at least one path.', published: false as const };
  }
  if (input.publish || input.productionEndpoint) {
    return { accepted: false as const, reason: 'API contracts remain unpublished candidates. External publication is locked.', published: false as const };
  }
  const contract: ApiContract = {
    name: input.name.trim(),
    version: input.version.trim(),
    paths: [...input.paths],
    published: false,
    productionEndpoint: false,
  };
  return { accepted: true as const, contract, reason: 'API contract recorded as a candidate only.', published: false as const };
}

export function reviewApiUi(input: {
  sandbox: ProtectedSandbox;
  customerFacing?: boolean;
  publishStoreListing?: boolean;
}) {
  if (input.customerFacing || input.publishStoreListing) {
    return {
      accepted: false as const,
      reason: 'API/UI review refuses customer-facing publication. Agent-generated apps are build candidates only.',
      published: false as const,
      customerUseAuthorized: false as const,
    };
  }
  const gate = decisionGate({
    id: `ui_${input.sandbox.id}`,
    action: 'package_ui_candidate',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  return {
    accepted: gate.executableByAgent,
    reason: gate.reason,
    published: false as const,
    customerUseAuthorized: false as const,
    humanApprovalRequired: gate.humanApprovalRequired,
  };
}
