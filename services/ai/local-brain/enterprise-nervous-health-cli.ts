import { buildEnterpriseNervousHealthReport } from './enterprise-nervous-runtime';

const report = await buildEnterpriseNervousHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
