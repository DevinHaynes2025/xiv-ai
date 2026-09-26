export const XVI_BRAIN_IDS = [
  "REASONING",
  "KNOWLEDGE",
  "MEMORY",
  "PLANNING",
  "SECURITY",
  "ENGINEERING",
  "SCIENTIFIC",
  "DATA",
  "BUSINESS",
  "HUMAN_EXPERIENCE",
  "SIMULATION",
  "VERIFICATION",
] as const;

export type XviBrainId = typeof XVI_BRAIN_IDS[number];

export const XVI_COGNITIVE_LAYERS = [
  "PERCEPTION",
  "CONTEXT",
  "RETRIEVAL",
  "MEMORY",
  "PATTERN_RECOGNITION",
  "REASONING",
  "CAUSAL_ANALYSIS",
  "PLANNING",
  "SIMULATION",
  "CRITIC",
  "VERIFICATION",
  "LEARNING_PROPOSAL",
] as const;

export type XviCognitiveLayer =
  typeof XVI_COGNITIVE_LAYERS[number];

export type XviComputeEvidenceState =
  | "CONCEPT"
  | "SIMULATED"
  | "LOCALLY_VERIFIED"
  | "HARDWARE_VERIFIED";

export type XviBrainDefinition = Readonly<{
  id: XviBrainId;
  layers: readonly XviCognitiveLayer[];
  authority: "NONE";
}>;

function createBrain(id: XviBrainId): XviBrainDefinition {
  return Object.freeze({
    id,
    layers: Object.freeze([...XVI_COGNITIVE_LAYERS]),
    authority: "NONE",
  });
}

export const XVI_BRAIN_REGISTRY: readonly XviBrainDefinition[] =
  Object.freeze(XVI_BRAIN_IDS.map(createBrain));

export function getXviBrain(
  id: XviBrainId,
): XviBrainDefinition {
  const brain = XVI_BRAIN_REGISTRY.find(
    (candidate) => candidate.id === id,
  );

  if (!brain) {
    throw new Error(`unknown XVI brain: ${id}`);
  }

  return brain;
}

export function countXviCognitiveLayers(): number {
  return XVI_BRAIN_REGISTRY.reduce(
    (total, brain) => total + brain.layers.length,
    0,
  );
}
