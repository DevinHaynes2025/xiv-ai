import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAyHealthReport } from './growth-media-runtime';

const here = fileURLToPath(new URL('.', import.meta.url));
const servicesAi = resolve(here, '..');
const repoRoot = resolve(servicesAi, '../..');
const root = process.cwd();

const report = await buildAyHealthReport(root, repoRoot);
const outPath = resolve(root, '.xiv-local', 'ay-health-report.json');
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      phase: report.phase,
      jobs: report.jobs,
      charged: report.charged,
      deployed: report.deployed,
      autoPublished: report.autoPublished,
      consciousJobs: report.consciousJobs,
      localModel: report.localModel.availability,
      providersUnavailable: report.providers.filter((p) => p.state === 'UNAVAILABLE').length,
      predecessors: report.predecessors,
      nextPhase: report.nextPhase,
      outPath,
    },
    null,
    2,
  ),
);
