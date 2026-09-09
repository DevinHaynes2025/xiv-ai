import { buildSovereignSealedHealthReport } from './sovereign-sealed-runtime';

const report = await buildSovereignSealedHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
