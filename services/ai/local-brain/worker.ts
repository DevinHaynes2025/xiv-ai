import { localBrainStatus, runLocalBrainLoop } from './supervisor';

const status = await localBrainStatus();
console.info('[xiv-local] starting bounded local brain');
console.info(JSON.stringify(status, null, 2));

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

await runLocalBrainLoop();
