import { localBrainStatus } from './supervisor';
import { runOfflineBrainLoop } from './offline-brain-runtime';

const status = await localBrainStatus();
console.info('[xiv-local] starting persistent offline brain worker');
console.info(JSON.stringify(status, null, 2));

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

await runOfflineBrainLoop();
