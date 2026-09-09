import { buildUniverseOsHealthReport } from './universe-os-kernel';

const report = await buildUniverseOsHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
