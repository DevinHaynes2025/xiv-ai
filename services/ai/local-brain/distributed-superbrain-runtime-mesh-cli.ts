#!/usr/bin/env tsx
/**
 * 62L-DB Distributed Superbrain Runtime Mesh health CLI.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDistributedSuperbrainRuntimeMeshHealthReport } from './distributed-superbrain-runtime-mesh-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(repoRoot, 'docs/operations');
const outPath = join(outDir, '62l-db-distributed-superbrain-runtime-mesh-health.json');

const report = await buildDistributedSuperbrainRuntimeMeshHealthReport({ root: repoRoot });
await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, honestyBanner: report.honestyBanner }, null, 2));
