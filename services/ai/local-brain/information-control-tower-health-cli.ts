import { buildInformationControlTowerHealthReport } from './information-control-tower-runtime';

const report = await buildInformationControlTowerHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
