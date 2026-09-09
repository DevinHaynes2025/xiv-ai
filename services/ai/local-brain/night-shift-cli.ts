import { readFile } from 'node:fs/promises';

import { runNightShift, type NightShiftTask } from './night-shift';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run local:night -- <approved-task-file.json>');
  process.exit(2);
}

const raw = await readFile(file, 'utf8');
const parsed = JSON.parse(raw) as unknown;
if (!Array.isArray(parsed)) {
  console.error('Night Shift task file must be a JSON array.');
  process.exit(2);
}

const report = await runNightShift(parsed as NightShiftTask[], {
  resume: process.env.XIV_NIGHT_SHIFT_RESUME === 'true',
});
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.tasksBlocked > 0 ? 2 : 0;
