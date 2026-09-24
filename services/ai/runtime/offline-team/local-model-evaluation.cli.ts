import { pathToFileURL } from 'node:url';
import { readConsoleOllamaInventory } from './offline-console-ollama';
import { runLocalModelEvaluation, validateEvaluationModels } from './local-model-evaluation';

export async function runEvaluationCommand(args: readonly string[], dependencies = {
  readInventory: readConsoleOllamaInventory,
  evaluate: runLocalModelEvaluation,
}) {
  if (args[0] !== '--run') {
    throw new Error(
      'Usage: local-model-evaluation.cli.ts --run [--suite baseline|operational|homebase-grounding] model [model]',
    );
  }

  let suite: 'baseline' | 'operational' | 'homebase-grounding' = 'baseline';
  let modelStart = 1;

  if (args[1] === '--suite') {
    const requestedSuite = args[2];

    if (
      requestedSuite !== 'baseline' &&
      requestedSuite !== 'operational' &&
      requestedSuite !== 'homebase-grounding'
    ) {
      throw new Error('LOCAL_EVALUATION_SUITE_REFUSED');
    }

    suite = requestedSuite;
    modelStart = 3;
  }

  const models = args.slice(modelStart);

  validateEvaluationModels(models);

  const inventory = await dependencies.readInventory();

  if (inventory === null) {
    throw new Error('Local inventory unavailable. Start Ollama and retry explicitly.');
  }

  if (models.some(model => !inventory.some(installed => installed.name === model))) {
    throw new Error('A requested model is not present in the local inventory. No inference started.');
  }

  return dependencies.evaluate(models, undefined, suite);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEvaluationCommand(process.argv.slice(2)).then(report => {
    console.log(JSON.stringify(report, null, 2));
    if (report.results.some(result => result.passed !== result.total)) process.exitCode = 1;
  }).catch(() => {
    console.error('Evaluation did not start. Use --run with installed qwen2.5:3b and/or qwen2.5-coder:7b; verify local Ollama inventory.');
    process.exitCode = 1;
  });
}
