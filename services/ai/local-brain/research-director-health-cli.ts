import { buildResearchDirectorHealth } from './research-director-health';

const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
const report = await buildResearchDirectorHealth({ tenantId, universeId, root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.honesty.productionAuthorization || report.inventedPass ? 1 : 0;
