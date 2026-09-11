import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { bridgeHistoryOntoCity } from './dimensional/database-city';
import { rankStoriesLocalRules as councilRank, DEBATE_SCORE_AXES as councilAxes } from './storyfactory/adaptive-council';
import { rankStoriesLocalRules, DEBATE_SCORE_AXES } from './storyfactory/priority-scores';
import ts from 'typescript';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

test('historical city bridge preserves explicit nonverification in type and value', () => {
  const result = bridgeHistoryOntoCity({ refId: 'fixture-old', relatedRefId: 'fixture-new', stance: 'HYPOTHESIS', ancientSource: true }, 'local_shard', 'company_brain');
  const autoVerified: false = result.autoVerified;
  assert.equal(autoVerified, false);
  assert.equal(result.stance, 'HYPOTHESIS');
  assert.equal(result.ancientSource, true);
  assert.ok(result.evidenceScore <= 0.4);
});

test('council reexports retain the original local-rules implementation', () => {
  assert.equal(councilRank, rankStoriesLocalRules);
  assert.equal(councilAxes, DEBATE_SCORE_AXES);
  assert.deepEqual(councilRank([]), []);
});

test('GitHub-specific scenario and device/chip validator exports have explicit origins', () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const configPath = resolve(root, '../tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  assert.equal(parsed.errors.length, 0);
  const checks = [
    ['offline-team/index.ts', 'ScenarioBranch', 'parallel-scenario-compiler.ts'],
    ['offline-team/index.ts', 'LabScenarioBranch', 'parallel-scenario-lab.ts'],
    ['dimensional/index.ts', 'assertPathwayHonesty', 'device-pathways-registry.ts'],
    ['dimensional/index.ts', 'assertChipLabPathwayHonesty', 'virtual-chip-lab-registry.ts'],
  ] as const;
  const program = ts.createProgram([...new Set(checks.map(([path]) => resolve(root, path)))], parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: ts.sys.getCurrentDirectory, getCanonicalFileName: path => path, getNewLine: () => '\n',
  }));
  const checker = program.getTypeChecker();
  for (const [path, name, expectedSource] of checks) {
    const source = program.getSourceFile(resolve(root, path)); assert.ok(source);
    const mod = checker.getSymbolAtLocation(source); assert.ok(mod);
    const symbol = checker.getExportsOfModule(mod).find(s => s.name === name); assert.ok(symbol);
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    assert.ok(target.declarations?.some(d => basename(d.getSourceFile().fileName) === expectedSource));
  }
});
