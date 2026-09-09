import { buildCortexHealthReport } from './cortex-runtime';

const report = await buildCortexHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
