import {
  createHash,
} from 'node:crypto';

export type XviAgentRelationship =
  | 'FAMILY'
  | 'PARTNER'
  | 'FRIEND'
  | 'MENTOR'
  | 'APPRENTICE'
  | 'TEAMMATE'
  | 'COFOUNDER'
  | 'COMMUNITY_MEMBER';

export interface XviAgentRelationshipInput {
  sourceAgentId: string;
  targetAgentId: string;

  relationship: XviAgentRelationship;

  createdAtMs: number;

  sharedGoalsEnabled: boolean;
  sharedMemoryEnabled: boolean;
}

export interface XviAgentRelationshipReceipt {
  version:
    'xvi-agent-relationship-v1';

  sourceAgentId: string;
  targetAgentId: string;

  relationship: XviAgentRelationship;

  createdAtMs: number;

  sharedGoalsEnabled: boolean;
  sharedMemoryEnabled: boolean;

  relationshipDigest: string;

  credentialsShared: false;
  secretsShared: false;
  authorityShared: false;
  privateHumanMemoryShared: false;

  productionAuthority: false;
}

const RELATIONSHIPS =
  new Set<XviAgentRelationship>([
    'FAMILY',
    'PARTNER',
    'FRIEND',
    'MENTOR',
    'APPRENTICE',
    'TEAMMATE',
    'COFOUNDER',
    'COMMUNITY_MEMBER',
  ]);

const refuse = (): never => {
  throw new Error(
    'XVI_AGENT_SOCIETY_REFUSED',
  );
};

function identifier(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    value !== value.trim() ||
    !/^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/.test(
      value,
    )
  ) {
    refuse();
  }

  return value;
}

export function createXviAgentRelationship(
  input: XviAgentRelationshipInput,
): Readonly<XviAgentRelationshipReceipt> {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'sourceAgentId',
    'targetAgentId',
    'relationship',
    'createdAtMs',
    'sharedGoalsEnabled',
    'sharedMemoryEnabled',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      input,
    );

  const keys =
    Reflect.ownKeys(input);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as
            (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  const sourceAgentId =
    identifier(
      descriptors.sourceAgentId.value,
    );

  const targetAgentId =
    identifier(
      descriptors.targetAgentId.value,
    );

  if (
    sourceAgentId ===
      targetAgentId
  ) {
    refuse();
  }

  const relationship =
    descriptors.relationship.value as
      XviAgentRelationship;

  if (
    !RELATIONSHIPS.has(
      relationship,
    )
  ) {
    refuse();
  }

  const createdAtMs =
    descriptors.createdAtMs.value;

  if (
    !Number.isSafeInteger(
      createdAtMs,
    ) ||
    createdAtMs < 0
  ) {
    refuse();
  }

  const sharedGoalsEnabled =
    descriptors.sharedGoalsEnabled.value;

  const sharedMemoryEnabled =
    descriptors.sharedMemoryEnabled.value;

  if (
    typeof sharedGoalsEnabled !==
      'boolean' ||
    typeof sharedMemoryEnabled !==
      'boolean'
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      'xvi-agent-relationship-v1',
      sourceAgentId,
      targetAgentId,
      relationship,
      createdAtMs,
      sharedGoalsEnabled,
      sharedMemoryEnabled,
    ]);

  const relationshipDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-agent-relationship-v1' as const,

    sourceAgentId,
    targetAgentId,

    relationship,

    createdAtMs,

    sharedGoalsEnabled,
    sharedMemoryEnabled,

    relationshipDigest,

    credentialsShared:
      false as const,

    secretsShared:
      false as const,

    authorityShared:
      false as const,

    privateHumanMemoryShared:
      false as const,

    productionAuthority:
      false as const,
  });
}
