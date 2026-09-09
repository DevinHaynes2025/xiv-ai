import { buildHybridEdgeCloudHealthReport } from './hybrid-edge-cloud-runtime';

const report = await buildHybridEdgeCloudHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
