import type { XviBrainId } from "./xvi-cognitive-brain-registry";

export const XVI_MODEL_FAMILIES = [
  "XVI_REASONING_MODEL",
  "XVI_KNOWLEDGE_MODEL",
  "XVI_MEMORY_MODEL",
  "XVI_PLANNING_MODEL",
  "XVI_SECURITY_MODEL",
  "XVI_ENGINEERING_MODEL",
  "XVI_SCIENTIFIC_MODEL",
  "XVI_DATA_MODEL",
  "XVI_BUSINESS_MODEL",
  "XVI_HUMAN_EXPERIENCE_MODEL",
  "XVI_SIMULATION_MODEL",
  "XVI_VERIFICATION_MODEL",
] as const;

export type XviModelFamily =
  typeof XVI_MODEL_FAMILIES[number];

export type XviModelEvidenceState =
  | "DEFINED"
  | "CONFIGURED"
  | "LOCALLY_TESTED"
  | "SIMULATED"
  | "OBSERVED_RUNNING";

export type XviModelCapability =
  | "REASONING"
  | "RETRIEVAL"
  | "MEMORY"
  | "PLANNING"
  | "SECURITY_ANALYSIS"
  | "CODE"
  | "SCIENTIFIC_ANALYSIS"
  | "DATA_ANALYSIS"
  | "BUSINESS_ANALYSIS"
  | "HUMAN_INTERACTION"
  | "SIMULATION"
  | "VERIFICATION";

export type XviModelDefinition = Readonly<{
  modelFamily: XviModelFamily;
  brain: XviBrainId;
  capability: XviModelCapability;
  evidenceState: XviModelEvidenceState;
  executionAuthority: "NONE";
}>;

export const XVI_MODEL_REGISTRY: readonly XviModelDefinition[] =
  Object.freeze([
    {
      modelFamily: "XVI_REASONING_MODEL",
      brain: "REASONING",
      capability: "REASONING",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_KNOWLEDGE_MODEL",
      brain: "KNOWLEDGE",
      capability: "RETRIEVAL",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_MEMORY_MODEL",
      brain: "MEMORY",
      capability: "MEMORY",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_PLANNING_MODEL",
      brain: "PLANNING",
      capability: "PLANNING",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_SECURITY_MODEL",
      brain: "SECURITY",
      capability: "SECURITY_ANALYSIS",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_ENGINEERING_MODEL",
      brain: "ENGINEERING",
      capability: "CODE",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_SCIENTIFIC_MODEL",
      brain: "SCIENTIFIC",
      capability: "SCIENTIFIC_ANALYSIS",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_DATA_MODEL",
      brain: "DATA",
      capability: "DATA_ANALYSIS",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_BUSINESS_MODEL",
      brain: "BUSINESS",
      capability: "BUSINESS_ANALYSIS",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_HUMAN_EXPERIENCE_MODEL",
      brain: "HUMAN_EXPERIENCE",
      capability: "HUMAN_INTERACTION",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_SIMULATION_MODEL",
      brain: "SIMULATION",
      capability: "SIMULATION",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
    {
      modelFamily: "XVI_VERIFICATION_MODEL",
      brain: "VERIFICATION",
      capability: "VERIFICATION",
      evidenceState: "DEFINED",
      executionAuthority: "NONE",
    },
  ]);

export function getXviModelForBrain(
  brain: XviBrainId,
): XviModelDefinition {
  const model = XVI_MODEL_REGISTRY.find(
    (candidate) => candidate.brain === brain,
  );

  if (!model) {
    throw new Error(`no XVI model registered for brain: ${brain}`);
  }

  return model;
}
