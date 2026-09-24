import { startOfflineConsole } from './offline-console';
import { pathToFileURL } from 'node:url';
import { readConsoleOllamaInventory } from '../ai/runtime/offline-team/offline-console-ollama';
import type { ConsoleEvidence } from '../ai/runtime/offline-team/offline-system-snapshot';

const identity = Object.freeze({ tenantId: 'local', universeId: 'offline', requesterId: 'operator' });

/** Discovery is a startup opt-in, never triggered by a browser request. */
export async function loadLocalConsoleEvidence(
  args: readonly string[],
  readInventory = readConsoleOllamaInventory,
): Promise<ConsoleEvidence> {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--ollama')) {
    throw new Error('Usage: offline-console-local.ts [--ollama]');
  }
  return { identity, installedModels: args.length === 1 ? await readInventory() : null, pendingReviews: null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadLocalConsoleEvidence(process.argv.slice(2)).then(evidence => {
    const server = startOfflineConsole(identity, evidence);
    server.on('error', () => { console.error('Offline console could not start. Check whether port 6060 is in use.'); process.exitCode = 1; });
    server.once('listening', () => {
      console.log('Offline console: http://127.0.0.1:6060/system?tenantId=local&universeId=offline&requesterId=operator');
      if (process.argv.includes('--ollama') && evidence.installedModels === null) console.log('Local model inventory unavailable. Review Ollama and restart to retry.');
    });
  }).catch(() => { console.error('Unable to start. Usage: offline-console-local.ts [--ollama]'); process.exitCode = 1; });
}
