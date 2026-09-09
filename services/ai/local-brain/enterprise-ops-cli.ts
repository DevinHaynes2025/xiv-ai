import { buildOpsHealthReport } from './enterprise-ops-runtime';

const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
const report = await buildOpsHealthReport({ tenantId, universeId, root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.honesty.l4AutonomyEnabled || report.executionsAuthorized > 0 || report.spendingAuthorized > 0 ? 1 : 0;
