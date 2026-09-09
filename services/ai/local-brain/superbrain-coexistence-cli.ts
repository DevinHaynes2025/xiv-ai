import { buildSuperbrainCoexistenceHealthReport } from './superbrain-coexistence-runtime';

const report = await buildSuperbrainCoexistenceHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
