/**
 * Child process used by tools/mutation-check.ts.
 *
 * Runs the named acceptance criteria against whatever is currently on disk and
 * prints one JSON line of `{ "AC-03": "FAIL", ... }`. It lives in its own file
 * so each mutation is measured by a fresh module graph rather than one the
 * parent already imported with the guard intact.
 *
 * Usage: node --import tsx tools/mutation-probe.ts AC-03 AC-05
 */
import { PRODUCERS } from '../acceptance/run';

const requested = process.argv.slice(2).map((entry) => entry.toUpperCase());

async function main() {
  const statuses: Record<string, string> = {};
  for (const producer of PRODUCERS) {
    if (!requested.includes(producer.id)) continue;
    try {
      statuses[producer.id] = (await producer.run()).status;
    } catch (error) {
      // A removed guard can make the producer throw rather than report. That is
      // still not a pass, which is what the caller is checking for.
      statuses[producer.id] = `THREW:${(error as Error).message?.slice(0, 80) ?? 'unknown'}`;
    }
  }
  process.stdout.write(`${JSON.stringify(statuses)}\n`);
}

void main();
