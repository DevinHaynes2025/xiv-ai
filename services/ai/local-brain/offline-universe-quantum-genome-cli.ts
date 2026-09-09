#!/usr/bin/env tsx
/**
 * 62L-CQ health CLI — writes offline universe / quantum / genome health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildOfflineUniverseQuantumGenomeHealthReport } from './offline-universe-quantum-genome-runtime';

const root = process.cwd();
const report = await buildOfflineUniverseQuantumGenomeHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cq-offline-universe-quantum-genome-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CQ health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
