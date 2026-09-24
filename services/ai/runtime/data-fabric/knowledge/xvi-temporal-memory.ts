import {
  createHash,
} from 'node:crypto';

export interface XviTemporalObservation {
  sourceId: string;
  manifestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  observedAtMs: number;

  parentMemoryDigest:
    string | null;
}

export interface XviTemporalMemoryReceipt {
  version:
    'xvi-temporal-memory-v1';

  sequence: number;

  sourceId: string;
  manifestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  observedAtMs: number;

  parentMemoryDigest:
    string | null;

  memoryDigest: string;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_TEMPORAL_MEMORY_REFUSED',
  );
};

function digest64(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function exactObservation(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'sourceId',
    'manifestDigest',
    'contentDigest',
    'provenanceDigest',
    'observedAtMs',
    'parentMemoryDigest',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      value,
    );

  const keys =
    Reflect.ownKeys(value);

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

  return descriptors;
}

export class XviTemporalMemoryLedger {
  #sequence = 0;

  #lastObservedAtMs:
    number | null = null;

  #lastMemoryDigest:
    string | null = null;

  #seenProvenance =
    new Set<string>();

  append(
    observation:
      XviTemporalObservation,
  ): Readonly<XviTemporalMemoryReceipt> {
    const d =
      exactObservation(
        observation,
      );

    const sourceId =
      d.sourceId.value;

    if (
      typeof sourceId !== 'string' ||
      sourceId.length < 1 ||
      sourceId.length > 128 ||
      sourceId !== sourceId.trim()
    ) {
      refuse();
    }

    const manifestDigest =
      digest64(
        d.manifestDigest.value,
      );

    const contentDigest =
      digest64(
        d.contentDigest.value,
      );

    const provenanceDigest =
      digest64(
        d.provenanceDigest.value,
      );

    const observedAtMs =
      d.observedAtMs.value;

    if (
      typeof observedAtMs !== 'number' ||
      !Number.isSafeInteger(
        observedAtMs,
      ) ||
      observedAtMs < 0
    ) {
      refuse();
    }

    const parentMemoryDigest =
      d.parentMemoryDigest.value;

    if (
      parentMemoryDigest !== null &&
      !/^[a-f0-9]{64}$/.test(
        parentMemoryDigest,
      )
    ) {
      refuse();
    }

    /*
     * Temporal history never moves backward.
     */
    if (
      this.#lastObservedAtMs !== null &&
      observedAtMs <=
        this.#lastObservedAtMs
    ) {
      refuse();
    }

    /*
     * Every observation after genesis must
     * point to the current memory head.
     */
    if (
      this.#sequence === 0
        ? parentMemoryDigest !== null
        : parentMemoryDigest !==
            this.#lastMemoryDigest
    ) {
      refuse();
    }

    /*
     * The same provenance event cannot be
     * replayed into memory twice.
     */
    if (
      this.#seenProvenance.has(
        provenanceDigest,
      )
    ) {
      refuse();
    }

    const nextSequence =
      this.#sequence + 1;

    if (
      !Number.isSafeInteger(
        nextSequence,
      )
    ) {
      refuse();
    }

    const canonical =
      JSON.stringify([
        'xvi-temporal-memory-v1',
        nextSequence,
        sourceId,
        manifestDigest,
        contentDigest,
        provenanceDigest,
        observedAtMs,
        parentMemoryDigest,
      ]);

    const memoryDigest =
      createHash('sha256')
        .update(canonical)
        .digest('hex');

    /*
     * Mutate ledger state only after every
     * validation and digest operation succeeds.
     */
    this.#sequence =
      nextSequence;

    this.#lastObservedAtMs =
      observedAtMs;

    this.#lastMemoryDigest =
      memoryDigest;

    this.#seenProvenance.add(
      provenanceDigest,
    );

    return Object.freeze({
      version:
        'xvi-temporal-memory-v1' as const,

      sequence:
        nextSequence,

      sourceId,
      manifestDigest,
      contentDigest,
      provenanceDigest,

      observedAtMs,

      parentMemoryDigest,

      memoryDigest,

      executesContent:
        false as const,

      executesFetch:
        false as const,

      executesTraining:
        false as const,

      networkAuthority:
        false as const,

      productionAuthority:
        false as const,
    });
  }

  snapshot() {
    return Object.freeze({
      sequence:
        this.#sequence,

      lastObservedAtMs:
        this.#lastObservedAtMs,

      lastMemoryDigest:
        this.#lastMemoryDigest,

      productionAuthority:
        false as const,
    });
  }
}
