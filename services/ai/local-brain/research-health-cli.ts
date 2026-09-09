import { buildResearchHighwayHealthMap } from './research-highway-health';

const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
const report = await buildResearchHighwayHealthMap({ tenantId, universeId, root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.honesty.productionAuthorization ? 1 : 0;
