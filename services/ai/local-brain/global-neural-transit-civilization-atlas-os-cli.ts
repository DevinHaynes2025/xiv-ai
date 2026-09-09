#!/usr/bin/env tsx
/**
 * 62L-DM Global Neural Transit + Civilization Atlas OS health CLI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGlobalNeuralTransitCivilizationAtlasOsHealthReport } from './global-neural-transit-civilization-atlas-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(repoRoot, 'docs/operations');
const outPath = join(outDir, '62l-dm-global-neural-transit-civilization-atlas-health.json');

const report = await buildGlobalNeuralTransitCivilizationAtlasOsHealthReport({
  root: repoRoot,
  repoRoot,
});
await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, honestyBanner: report.honestyBanner }, null, 2));
