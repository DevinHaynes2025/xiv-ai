import { buildInformationEconomyHealthReport } from './information-economy-runtime';

const report = await buildInformationEconomyHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode =
  report.honesty.L4_AUTONOMY_ENABLED ||
  report.honesty.RAW_CROSS_ENTERPRISE_POOLING ||
  report.productionAuthorization ||
  report.executionsAuthorized > 0 ||
  report.tipLand
    ? 1
    : 0;
