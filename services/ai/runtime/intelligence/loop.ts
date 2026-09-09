export const CONTINUOUS_INTELLIGENCE_LOOP = [
  'sense',
  'understand',
  'predict',
  'decide',
  'act',
  'measure',
  'learn',
] as const;

export function predictionIsNotFact(stance: string) {
  return stance !== 'observed';
}
