import { buildSystemSnapshot, type InstalledModel } from './offline-system-snapshot';

const OLLAMA_TAGS_URL = 'http://127.0.0.1:11434/api/tags';
const MAX_RESPONSE_BYTES = 65_536;
const validationScope = Object.freeze({ tenantId: 'local', universeId: 'offline', requesterId: 'operator' });

/** Explicit local inventory probe. Metadata alone does not establish model execution readiness. */
export async function readConsoleOllamaInventory(fetcher: typeof fetch = fetch): Promise<readonly InstalledModel[] | null> {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>(resolve => {
    timer = setTimeout(() => { controller.abort(); resolve(null); }, 3000);
  });
  const read = async (): Promise<readonly InstalledModel[] | null> => {
    const response = await fetcher(OLLAMA_TAGS_URL, { method: 'GET', redirect: 'error', signal: controller.signal });
    if (!response.ok || response.redirected || !response.body) return null;
    reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) return null;
      chunks.push(next.value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || !('models' in parsed) ||
        !Array.isArray(parsed.models) || parsed.models.length > 32) return null;
    const models = parsed.models.map((model: unknown) => {
      if (!model || typeof model !== 'object' || !('name' in model) || !('size' in model)) throw new Error('INVALID_INVENTORY');
      return { name: model.name, sizeBytes: model.size };
    });
    // Reuse the console's identifier, size, duplicate and cardinality contract.
    buildSystemSnapshot(validationScope, validationScope, { identity: validationScope, installedModels: models, pendingReviews: null });
    return Object.freeze(models.map(model => Object.freeze(model as InstalledModel)));
  };
  try {
    return await Promise.race([read(), timeout]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    controller.abort();
    if (reader) void reader.cancel().catch(() => {});
  }
}
