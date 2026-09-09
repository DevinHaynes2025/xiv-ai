#!/usr/bin/env tsx
/**
 * 62L-DH Adaptive Life & Business Intelligence OS health CLI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAdaptiveLifeBusinessIntelligenceOsHealthReport } from './adaptive-life-business-intelligence-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(repoRoot, 'docs/operations');
const outPath = join(outDir, '62l-dh-adaptive-life-business-intelligence-os-health.json');

const report = await buildAdaptiveLifeBusinessIntelligenceOsHealthReport({ root: repoRoot });
await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, honestyBanner: report.honestyBanner }, null, 2));
