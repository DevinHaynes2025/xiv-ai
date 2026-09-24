import { mkdirSync, lstatSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LocalDraftQueue, runDraftTick } from './local-draft-worker';

const seeds = [
  ['json-extraction-regression', 'Propose a TypeScript regression test for a local model that wraps JSON in Markdown fences when the contract requires a bare JSON object containing only color blue. Keep the strict rubric; do not silently repair invalid responses.'],
  ['reading-provenance-recovery', 'Propose acceptance criteria for resuming three stale local reading tasks. Their document digest, source register and body must match before execution. A stored document hash prefix must not be treated as a Git commit. Do not invent evidence.'],
  ['offline-task-status-ui', 'Propose a small accessible React status panel for a local draft worker with READY, RUNNING, AWAITING_REVIEW, FAILED, PAUSED and STOPPED states. Distinguish generated drafts from implemented features.'],
] as const;

export async function draftWorkerMain(args: readonly string[]) {
  const command = args[0];
  if (!['run', 'once', 'seed', 'status', 'pause', 'pause-low-battery', 'resume', 'stop', 'drafts', 'enqueue'].includes(command) ||
      args.length !== (command === 'enqueue' ? 3 : 1)) throw new Error('INVALID_COMMAND');
  const runtime = fileURLToPath(new URL('../../.xiv-runtime/', import.meta.url));
  mkdirSync(runtime, { recursive: true });
  if (lstatSync(runtime).isSymbolicLink()) throw new Error('UNSAFE_RUNTIME_PATH');
  const directory = join(runtime, 'local-draft-worker');
  mkdirSync(directory, { recursive: true });
  if (lstatSync(directory).isSymbolicLink()) throw new Error('UNSAFE_RUNTIME_PATH');
  const path = join(directory, 'queue.sqlite');
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    if (existsSync(path + suffix) && lstatSync(path + suffix).isSymbolicLink()) throw new Error('UNSAFE_DATABASE_PATH');
  }
  const queue = new LocalDraftQueue(path);
  try {
    if (command === 'seed') for (const [id, objective] of seeds) queue.enqueue(id, objective);
    else if (command === 'enqueue') queue.enqueue(args[1], args[2]);
    else if (command === 'pause') queue.control('PAUSED');
    else if (command === 'pause-low-battery') queue.pauseForLowBattery();
    else if (command === 'resume') queue.control('RUNNING');
    else if (command === 'stop') queue.control('STOPPED');
    else if (command === 'drafts') { console.log(JSON.stringify(queue.drafts(), null, 2)); return; }
    else if (command === 'once') console.log(await runDraftTick(queue));
    else if (command === 'run') {
      let stopping = false;
      const stop = () => { stopping = true; };
      process.once('SIGINT', stop); process.once('SIGTERM', stop);
      try {
        while (!stopping && queue.status().mode !== 'STOPPED') {
          await runDraftTick(queue);
          // Control checks stay responsive without waking a model while the queue is idle.
          for (let seconds = 0; seconds < 60 && !stopping && queue.status().mode !== 'STOPPED'; seconds++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
    }
    console.log(JSON.stringify(queue.status(), null, 2));
  } finally { queue.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  draftWorkerMain(process.argv.slice(2)).catch(() => { console.error('LOCAL_DRAFT_WORKER_REFUSED'); process.exitCode = 1; });
}
