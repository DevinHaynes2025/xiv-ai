import { buildInformationSupplyChainHealthReport } from './information-supply-chain-runtime';

const report = await buildInformationSupplyChainHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
