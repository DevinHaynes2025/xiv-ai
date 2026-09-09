import { writeOfflineWorkcellHealth } from './offline-agent-runtime';

const root = process.cwd();
const { path, report } = await writeOfflineWorkcellHealth(root);
console.log(JSON.stringify(report, null, 2));
console.error(`[xiv-local] offline workcell health written to ${path}`);
process.exitCode = report.productionAuthorization || report.inventedPass || report.locks.l4AutonomyEnabled ? 1 : 0;
