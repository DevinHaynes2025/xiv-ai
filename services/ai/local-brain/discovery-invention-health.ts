import { writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { probeHardware } from './hardware-probe';
import { DISCOVERY_HONESTY, KNOWLEDGE_DISCOVERY_CYCLE } from './discovery-invention-types';
import { predecessorMap } from './discovery-predecessors';
import { listDiscoveryCycles } from './discovery-invention-runtime';
import { honestyLocks } from './discovery-authority';

export type DiscoveryHealth = {
  phase: '62L-AT';
  parent: '62L-AO';
  hops: typeof KNOWLEDGE_DISCOVERY_CYCLE;
  locks: typeof DISCOVERY_HONESTY;
  predecessors: ReturnType<typeof predecessorMap>;
  providers: Array<{ provider: string; state: string; configured: boolean; authorized: boolean }>;
  runtimes: Array<{ provider: string; state: string; configured: boolean }>;
  hardware: Awaited<ReturnType<typeof probeHardware>>;
  cycles: number;
  windowsNodeVerification: 'NOT_TESTED';
  productionAuthorization: false;
  inventedPass: false;
  tipLand: false;
  qpu: 'UNAVAILABLE';
  claimsQuantumAdvantage: false;
};

export async function buildDiscoveryHealth(input: { tenantId: string; universeId: string; root?: string }): Promise<DiscoveryHealth> {
  const cycles = await listDiscoveryCycles(input);
  return {
    phase: '62L-AT',
    parent: '62L-AO',
    hops: KNOWLEDGE_DISCOVERY_CYCLE,
    locks: honestyLocks(),
    predecessors: predecessorMap(),
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state,
      configured: slot.configured,
      authorized: slot.authorized,
    })),
    runtimes: (['local', 'aws', 'azure', 'gcp'] as const).map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.state, configured: runtime.configured };
    }),
    hardware: await probeHardware(),
    cycles: cycles.length,
    windowsNodeVerification: 'NOT_TESTED',
    productionAuthorization: false,
    inventedPass: false,
    tipLand: false,
    qpu: 'UNAVAILABLE',
    claimsQuantumAdvantage: false,
  };
}

export async function writeDiscoveryHealth(root = process.cwd()) {
  const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
  const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
  const report = await buildDiscoveryHealth({ tenantId, universeId, root });
  const path = xivLocalPath(root, 'discovery-invention-health.json');
  await writeJsonFileAtomic(path, report);
  return { path, report };
}
