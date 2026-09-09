import { buildFactoryHealthReport } from './software-factory-runtime';

const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
const report = await buildFactoryHealthReport({ tenantId, universeId, root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.honesty.l4AutonomyEnabled || report.released > 0 ? 1 : 0;
