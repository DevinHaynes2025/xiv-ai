import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';
import { executeOneOllamaJob } from './ollama-job-executor';

async function main() {
  const queue = new OfflineWorkQueue();
  const journal = new RecoveryJournal();
  const jobId = process.env.XIV_JOB_ID ?? `xiv-job-${Date.now()}`;
  const storyId = process.env.XIV_STORY_ID ?? '12D-26-LOCAL';
  const objective = process.env.XIV_JOB_OBJECTIVE ?? 'Review the XIV offline runtime and propose the next bounded implementation step with tests.';
  const model = process.env.XIV_OLLAMA_MODEL ?? 'qwen2.5-coder:7b';

  queue.enqueue({ id: jobId, storyId, objective, priority: 100, maxAttempts: 2 });
  const result = await executeOneOllamaJob({
    queue,
    journal,
    model,
    fetchImpl: async (url, init) => fetch(url, init) as unknown as Promise<{ ok: boolean; json(): Promise<unknown> }>,
  });

  const repoRoot = resolve(process.cwd(), '..', '..');
  const outputDir = join(repoRoot, '.xiv-runtime', 'jobs');
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${jobId}.json`);
  await writeFile(outputPath, JSON.stringify({ result, queue: queue.snapshot(), journal: journal.list() }, null, 2), 'utf8');
  console.log(JSON.stringify({ result, outputPath }, null, 2));
  if (!result?.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
