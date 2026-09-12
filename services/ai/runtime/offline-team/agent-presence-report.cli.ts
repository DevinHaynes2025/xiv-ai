import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { AuthenticatedAgentReport } from './agent-presence-report';

// Inventory inspection only. No credentials, key generation, network calls, or worker startup.
// An enrolled service adapter is a separate acceptance gate, not hidden inside this command.
try {
  if (process.argv.length !== 2) throw new Error('this inspection command accepts no arguments');
  const report = new AuthenticatedAgentReport({ tenantId: 'xiv-dev-pilot',
    definitions: listXivAgents(), seats: DEFAULT_OFFLINE_TEAM, enrollments: [] });
  console.log(JSON.stringify(report.snapshot(), null, 2));
} catch {
  console.error('XIV presence inspection failed. Check the source inventory and installed tooling; no live count was inferred.');
  process.exitCode = 2;
}
