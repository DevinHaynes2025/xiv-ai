/**
 * LOCAL_RULES / Ollama-routed city+universe blueprint emitter.
 * Writes reviewable artifacts only â€” NOT applied DDL / NOT PRODUCTION deploy.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decideBuilderRequest } from '../builder/policy';
import type { BuilderProvider, BuilderRequest, DatabaseBlueprint } from '../builder/types';
import { isomorphicContentHash } from './datagene';
import { UNIVERSE_KERNEL_GUARDRAILS, assertEthicsSafeCopy, isHighAutonomyTarget } from './universe-ethics';

export type BlueprintEmitterResult = {
  providerUsed: BuilderProvider;
  providerStatus: 'LOCAL_RULES' | 'OLLAMA' | 'WAITING_PROVIDER';
  artifactPath: string;
  checksum: string;
  appliedDdl: false;
  productionDeploy: false;
};

async function probeOllama(endpoint = 'http://127.0.0.1:11434'): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 250);
    const raced = await Promise.race([
      fetch(endpoint + '/api/tags', { signal: ctrl.signal }).then((res) => res.ok),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 300)),
    ]);
    clearTimeout(timer);
    ctrl.abort();
    return raced === true;
  } catch {
    return false;
  }
}

function localRulesBlueprint(universeId: string): DatabaseBlueprint {
  return {
    name: 'universe-sim-' + universeId,
    engine: 'SQLITE',
    purpose:
      'SIMULATION-layer Pocket Brain metadata + offline manifest substrate for Universe Kernel (reviewable only)',
    tablesOrCollections: ['pocket_meta', 'offline_manifest', 'world_state_index', 'scenario_branch'],
    region: 'local',
    offlineCapable: true,
    productionReady: false,
  };
}

function renderBlueprintMarkdown(input: {
  universeId: string;
  tenantId: string;
  providerUsed: BuilderProvider;
  providerStatus: BlueprintEmitterResult['providerStatus'];
  blueprint: DatabaseBlueprint;
}): string {
  const body = [
    '# Universe Simulation Blueprint (REVIEW ONLY)',
    '',
    '- **Universe:** `' + input.universeId + '`',
    '- **Tenant:** `' + input.tenantId + '`',
    '- **Provider:** ' + input.providerUsed + ' (' + input.providerStatus + ')',
    '- **Engine:** ' + input.blueprint.engine,
    '- **Purpose:** ' + input.blueprint.purpose,
    '- **Collections:** ' + input.blueprint.tablesOrCollections.join(', '),
    '- **Applied DDL:** false',
    '- **Production deploy:** false',
    '',
    '## Ethics',
    '',
    'Universes are SIMULATION layers only. Red-line capabilities remain disabled.',
    'GCP/Azure adapters remain CLOUD_SANDBOX routing â€” not PRODUCTION deploy or live DDL.',
    '',
    '## Guardrails',
    '',
    '- autonomousProductionDDL: ' + String(UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDDL),
    '- autonomousProductionReplication: ' +
      String(UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionReplication),
    '- liveProductionDdlAllowed: ' + String(UNIVERSE_KERNEL_GUARDRAILS.liveProductionDdlAllowed),
    '',
  ].join('\n');
  assertEthicsSafeCopy(body, 'blueprint markdown');
  return body;
}

/**
 * Prefer Ollama when reachable; otherwise WAITING_PROVIDER and still ship LOCAL_RULES artifact.
 */
export async function emitUniverseBlueprint(input: {
  universeId: string;
  tenantId: string;
  outDir: string;
  preferOllama?: boolean;
  ollamaEndpoint?: string;
}): Promise<BlueprintEmitterResult> {
  if (!isHighAutonomyTarget('LOCAL')) {
    throw new Error('LOCAL must be a high-autonomy target');
  }
  const request: BuilderRequest = {
    requestId: '12d05-blueprint-' + input.universeId,
    provider: 'LOCAL_RULES',
    target: 'LOCAL',
    artifactKind: 'ARCHITECTURE',
    objective: 'Emit reviewable SIMULATION universe blueprint (no applied DDL)',
    repositoryBranch: 'grok/12d-05-universe-simulation-kernel',
    requiresNetwork: false,
    touchesProductionData: false,
    destructive: false,
  };
  const decision = decideBuilderRequest(request);
  if (!decision.allowed || decision.executionMode === 'BLOCKED') {
    throw new Error('blueprint emission blocked by builder policy');
  }

  let providerUsed: BuilderProvider = 'LOCAL_RULES';
  let providerStatus: BlueprintEmitterResult['providerStatus'] = 'LOCAL_RULES';
  if (input.preferOllama !== false) {
    const ok = await probeOllama(input.ollamaEndpoint);
    if (ok) {
      providerUsed = 'OLLAMA';
      providerStatus = 'OLLAMA';
    } else {
      providerStatus = 'WAITING_PROVIDER';
      providerUsed = 'LOCAL_RULES';
    }
  }

  const blueprint = localRulesBlueprint(input.universeId);
  const md = renderBlueprintMarkdown({
    universeId: input.universeId,
    tenantId: input.tenantId,
    providerUsed,
    providerStatus,
    blueprint,
  });
  mkdirSync(input.outDir, { recursive: true });
  const artifactPath = join(input.outDir, 'universe-blueprint-' + input.universeId + '.md');
  writeFileSync(artifactPath, md, 'utf8');
  return {
    providerUsed,
    providerStatus,
    artifactPath,
    checksum: isomorphicContentHash(md),
    appliedDdl: false,
    productionDeploy: false,
  };
}
