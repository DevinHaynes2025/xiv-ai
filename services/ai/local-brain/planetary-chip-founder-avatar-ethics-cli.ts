#!/usr/bin/env tsx
/**
 * 62L-BW health CLI — writes planetary chip / founder avatar / ethics health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildPlanetaryChipFounderAvatarEthicsHealthReport } from './planetary-chip-founder-avatar-ethics-runtime';

const root = process.cwd();
const report = await buildPlanetaryChipFounderAvatarEthicsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-bw-planetary-chip-founder-avatar-ethics-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-BW health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
