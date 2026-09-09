#!/usr/bin/env tsx
/**
 * 62L-DY Intelligent Supply Chain Command health CLI
 */
import { intelligentSupplyChainCommandHonesty } from './intelligent-supply-chain-command';
import { buildIntelligentSupplyChainCommandHealthReport } from './intelligent-supply-chain-command-runtime';
import type { DyActor } from './intelligent-supply-chain-command-types';

const actor: DyActor = {
  kind: 'supply_chain_command_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildIntelligentSupplyChainCommandHealthReport({
  orgId: actor.orgId,
  tenantId: actor.tenantId,
  universeId: actor.universeId,
  actor,
  root: process.env.XIV_ROOT ?? process.cwd(),
  repoRoot: process.env.XIV_REPO_ROOT,
});

console.log(
  JSON.stringify(
    {
      report,
      honesty: intelligentSupplyChainCommandHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
