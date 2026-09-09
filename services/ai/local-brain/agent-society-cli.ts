import { writeAgentSocietyReport } from './agent-society-runtime';

const root = process.cwd();
const { path, report } = await writeAgentSocietyReport(root);
console.log(JSON.stringify(report, null, 2));
console.error(`[xiv-local] agent society report written to ${path}`);
process.exitCode = report.productionAuthorization || report.locks.inventedPass || report.locks.l4AutonomyEnabled || report.locks.smarterBecauseMoreAgents || report.locks.tipLand ? 1 : 0;
