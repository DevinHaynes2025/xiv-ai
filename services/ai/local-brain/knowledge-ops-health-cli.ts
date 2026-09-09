import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildGlobalBrainOpsReport } from './knowledge-ops-runtime';

const root = process.argv[2] ?? process.cwd();
await mkdir(join(root, '.xiv-local'), { recursive: true });
const report = await buildGlobalBrainOpsReport({
  tenantId: process.env.XIV_TENANT_ID ?? 'local-tenant',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'local-universe',
  root,
});
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.honesty.productionAuthorization) process.exitCode = 1;
