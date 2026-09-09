#!/usr/bin/env tsx
/**
 * 62L-DK Unified Intelligence Experience OS health CLI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildUnifiedIntelligenceExperienceOsHealthReport } from './unified-intelligence-experience-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(repoRoot, 'docs/operations');
const outPath = join(outDir, '62l-dk-unified-intelligence-experience-os-health.json');

const report = await buildUnifiedIntelligenceExperienceOsHealthReport({ root: repoRoot });
await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, honestyBanner: report.honestyBanner }, null, 2));
