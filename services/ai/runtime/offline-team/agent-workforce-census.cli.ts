import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { buildAgentWorkforceCensus } from './agent-workforce-census';

// Reviewable local command. No model probes, credentials, customer data, database reads or background jobs.
try {
  if (process.argv.length !== 2) throw new Error('this source census accepts no arguments');
  const sourceSha256 = Object.fromEntries([
    ['primaryCatalog', '../agents.ts'],
    ['defaultOfflineSeats', './orchestrator.ts'],
  ].map(([name, relativePath]) => [name, createHash('sha256').update(readFileSync(new URL(relativePath, import.meta.url))).digest('hex')]));
  const census = buildAgentWorkforceCensus({ catalog: listXivAgents(), offlineSeats: DEFAULT_OFFLINE_TEAM,
    generatedAt: new Date().toISOString() });
  console.log(JSON.stringify({ ...census, sourceSha256 }, null, 2));
} catch {
  console.error('XIV source census failed: check registry integrity and the checked-out source files. No runtime count was inferred.');
  process.exitCode = 2;
}
