import { buildBrainReport } from './brain-report';

const report = await buildBrainReport();
console.log(JSON.stringify(report, null, 2));
