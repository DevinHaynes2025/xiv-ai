#!/usr/bin/env tsx
/**
 * 62L-BX health CLI — writes neural chip OS / semiconductor twin health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildNeuralChipOsSemiconductorTwinHealthReport } from './neural-chip-os-semiconductor-twin-runtime';

const root = process.cwd();
const report = await buildNeuralChipOsSemiconductorTwinHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-bx-neural-chip-os-semiconductor-twin-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-BX health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
