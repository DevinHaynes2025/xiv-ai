/**
 * Acceptance runner for XIV 62D.
 *
 * Runs every acceptance criterion, writes the measured evidence and renders the
 * readiness scorecard. Exits non-zero when the canary gate is closed, so this
 * can be wired into a release gate without a human having to read the report to
 * find out whether it passed.
 *
 * Usage: tsx acceptance/run.ts [--only AC-05,AC-12] [--no-write] [--quiet]
 */
import { cpus, totalmem } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAc04, runAc14, runAc15 } from './authorization';
import { runAc01, runAc02, runAc13 } from './fleet';
import { runAc08, runAc09, runAc21, runAc22 } from './governance';
import type { AcceptanceResult } from './harness';
import { runAc03 } from './isolation';
import { runAc10, runAc11, runAc12, runAc23, runAc24 } from './resilience';
import { runAc05, runAc06, runAc07 } from './routing';
import { buildScorecard, gitValue, renderConsoleSummary, renderScorecard, type RunMetadata } from './scorecard';
import { runAc16, runAc17 } from './supplychain';
import { runAc18, runAc19, runAc20 } from './surface';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

type Producer = { id: string; run: () => AcceptanceResult | Promise<AcceptanceResult> };

/**
 * The registry is the suite's contract: AC-18 reads this file to confirm every
 * criterion has an evidence producer, so a criterion cannot quietly disappear.
 */
export const PRODUCERS: readonly Producer[] = [
  { id: 'AC-01', run: runAc01 },
  { id: 'AC-02', run: runAc02 },
  { id: 'AC-03', run: runAc03 },
  { id: 'AC-04', run: runAc04 },
  { id: 'AC-05', run: runAc05 },
  { id: 'AC-06', run: runAc06 },
  { id: 'AC-07', run: runAc07 },
  { id: 'AC-08', run: runAc08 },
  { id: 'AC-09', run: runAc09 },
  { id: 'AC-10', run: runAc10 },
  { id: 'AC-11', run: runAc11 },
  { id: 'AC-12', run: runAc12 },
  { id: 'AC-13', run: runAc13 },
  { id: 'AC-14', run: runAc14 },
  { id: 'AC-15', run: runAc15 },
  { id: 'AC-16', run: runAc16 },
  { id: 'AC-17', run: runAc17 },
  { id: 'AC-19', run: runAc19 },
  { id: 'AC-20', run: runAc20 },
  { id: 'AC-21', run: runAc21 },
  { id: 'AC-22', run: runAc22 },
  { id: 'AC-23', run: runAc23 },
  { id: 'AC-24', run: runAc24 },
  // AC-18 runs the type checker and the unit suite as subprocesses, so it goes
  // last: its evidence covers the same tree the criteria above just exercised.
  { id: 'AC-18', run: runAc18 },
];

function parseOnly(argv: readonly string[]): Set<string> | null {
  const index = argv.indexOf('--only');
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value) return null;
  return new Set(value.split(',').map((entry) => entry.trim().toUpperCase()));
}

export async function runAcceptance(options: { only?: Set<string> | null; quiet?: boolean } = {}) {
  const started = Date.now();
  const results: AcceptanceResult[] = [];

  for (const producer of PRODUCERS) {
    if (options.only && !options.only.has(producer.id)) continue;
    const producerStarted = Date.now();
    if (!options.quiet) process.stderr.write(`[acceptance] ${producer.id} …`);
    const result = await producer.run();
    results.push(result);
    if (!options.quiet) {
      process.stderr.write(` ${result.status} (${((Date.now() - producerStarted) / 1000).toFixed(1)}s)\n`);
    }
  }

  results.sort((a, b) => a.id.localeCompare(b.id));

  const metadata: RunMetadata = {
    ranAt: new Date().toISOString(),
    commit: gitValue(['rev-parse', 'HEAD'], 'unknown'),
    branch: gitValue(['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown'),
    nodeVersion: process.version,
    platform: `${process.platform}-${process.arch}`,
    cpuModel: cpus()[0]?.model ?? 'unknown',
    cpuCount: cpus().length,
    totalMemoryMb: Math.round(totalmem() / (1024 * 1024)),
    durationMs: Date.now() - started,
  };

  return buildScorecard(results, metadata);
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (invokedDirectly) {
  const only = parseOnly(process.argv);
  const quiet = process.argv.includes('--quiet');
  const scorecard = await runAcceptance({ only, quiet });

  if (!process.argv.includes('--no-write')) {
    const outDir = join(repoRoot, 'docs/62d');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'SCORECARD.md'), renderScorecard(scorecard));
    writeFileSync(
      join(outDir, 'acceptance-evidence.json'),
      `${JSON.stringify(
        { metadata: scorecard.metadata, gate: scorecard.gate, counts: scorecard.counts, results: scorecard.results },
        null,
        2,
      )}\n`,
    );
  }

  console.info(renderConsoleSummary(scorecard));
  if (scorecard.gate !== 'GO') process.exitCode = 1;
}
