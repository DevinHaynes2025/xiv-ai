import { readSync } from 'node:fs';
import { assessDeviceParticipation, DEVICE_PARTICIPATION_LIMITS } from './device-participation-assessment';

// Read bounded JSON from stdin only; output a policy assessment, never run a worker.
try {
  if (process.argv.length !== 2 || process.stdin.isTTY) throw new Error('bounded stdin required');
  const buffer = Buffer.alloc(DEVICE_PARTICIPATION_LIMITS.maxInputBytes + 1);
  let used = 0;
  while (used < buffer.length) {
    const count = readSync(0, buffer, used, buffer.length-used, null);
    if (count === 0) break;
    used += count;
  }
  const result = assessDeviceParticipation(buffer.subarray(0,used).toString('utf8'),Date.now());
  console.log(JSON.stringify(result,null,2));
  if (result.status==='BLOCKED') process.exitCode=2;
} catch {
  console.error('Device participation assessment failed; no worker was started.');
  process.exitCode=2;
}
