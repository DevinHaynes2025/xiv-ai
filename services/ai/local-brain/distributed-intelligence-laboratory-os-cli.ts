#!/usr/bin/env tsx
/**
 * 62L-CV Distributed Intelligence Laboratory OS health CLI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDistributedIntelligenceLaboratoryOsHealthReport } from './distributed-intelligence-laboratory-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(repoRoot, 'docs/operations');
const outPath = join(outDir, '62l-cv-distributed-intelligence-laboratory-os-health.json');

const report = await buildDistributedIntelligenceLaboratoryOsHealthReport({ root: repoRoot });
await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, honestyBanner: report.honestyBanner }, null, 2));
