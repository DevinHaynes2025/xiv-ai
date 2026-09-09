import { checkLocalBrainHealth } from './health-check';

const health = await checkLocalBrainHealth();
console.log(JSON.stringify(health, null, 2));
process.exitCode = health.ok ? 0 : 2;
