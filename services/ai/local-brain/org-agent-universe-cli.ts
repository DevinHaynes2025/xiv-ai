import { buildOrgAgentUniverseHealthReport } from './org-agent-universe-runtime';

const report = await buildOrgAgentUniverseHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
