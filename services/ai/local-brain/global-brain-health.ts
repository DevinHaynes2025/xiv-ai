import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { checkLocalBrainHealth } from './health-check';
import { probeHardware } from './hardware-probe';
import { buildResearchHighwayHealthMap } from './research-highway-health';
import { buildCortexHealthReport } from './cortex-runtime';
import { knowledgePackStats } from './knowledge-packs';
import { PHYSICS_HONESTY } from './physics-domains';
import { signalInfrastructureHonesty } from './signal-infrastructure';
import { EXECUTIVE_INTELLIGENCE_CYCLE } from './executive-cortex';
import { CLOSED_INTELLIGENCE_LOOP } from './bounded-feedback';

export async function buildGlobalBrainHealthReport(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const [local, cortex, research, packs, hardware] = await Promise.all([
    checkLocalBrainHealth(root),
    buildCortexHealthReport(root),
    buildResearchHighwayHealthMap({ tenantId: input.tenantId, universeId: input.universeId, root }),
    knowledgePackStats(root),
    probeHardware(),
  ]);
  const providers = providerSlots().map((slot) => ({
    provider: slot.provider,
    state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    configured: slot.configured,
  }));
  return {
    generatedAt: new Date().toISOString(),
    cycle: EXECUTIVE_INTELLIGENCE_CYCLE,
    closedLoop: CLOSED_INTELLIGENCE_LOOP,
    localHealth: local,
    cortex,
    research,
    packs,
    hardware: hardware.map((item) => ({
      kind: item.kind,
      availability: item.availability,
      evidence: item.evidence,
    })),
    providers,
    cloudRuntimes: (['aws', 'azure', 'gcp'] as const).map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    honesty: {
      ...PHYSICS_HONESTY,
      ...signalInfrastructureHonesty(),
      l4AutonomyEnabled: false as const,
      inventedPass: false as const,
      satelliteControl: false as const,
      productionAuthorization: false as const,
    },
    productionAuthorization: false as const,
    next: 'Human review of 62L-Z. Do not merge main. Do not tip-land xiv-v2.',
  };
}
