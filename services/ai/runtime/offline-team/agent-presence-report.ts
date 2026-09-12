import { buildAgentCensus, type CensusDefinition, type CensusSeat } from './agent-census';
import { AgentPresenceCensus, type AgentPresenceEnrollment } from './agent-presence-census';

/**
 * Operator-created, process-local monitor. Enrollment is never read from a heartbeat.
 * This adapter joins source inventory and signed observations WITHOUT granting work authority.
 * There is deliberately no listener, polling loop, model invocation, or disk key store.
 */
export class AuthenticatedAgentReport {
  readonly #source: ReturnType<typeof buildAgentCensus>;
  readonly #presence: AgentPresenceCensus;

  constructor(input: {
    tenantId: string;
    definitions: readonly CensusDefinition[];
    seats: readonly CensusSeat[];
    enrollments: readonly AgentPresenceEnrollment[];
    clock?: () => number;
  }) {
    if (!Array.isArray(input.definitions) || input.definitions.length > 10_000
      || !Array.isArray(input.seats) || input.seats.length > 1024) throw new Error('bounded inventories required');
    this.#source = buildAgentCensus(input.definitions, input.seats);
    this.#presence = new AgentPresenceCensus({ tenantId: input.tenantId,
      definitionIds: this.#source.coreDefinitions.map(d => d.id), enrollments: input.enrollments, clock: input.clock });
  }

  get collectorId(): string { return this.#presence.collectorId; }
  get tenantId(): string { return this.#presence.tenantId; }

  /** Call only behind a separately authenticated, bounded ingestion boundary. */
  acceptSignedReport(raw: string): boolean { return this.#presence.accept(raw); }

  /** Operator-only action; exposing this method as a public endpoint would be unsafe. */
  revoke(instanceId: string): void { this.#presence.revoke(instanceId); }

  snapshot() {
    const presence = this.#presence.snapshot();
    return Object.freeze({
      schemaVersion: 1,
      evidenceKind: 'SOURCE_INVENTORY_AND_ENROLLED_REPORTER_OBSERVATIONS',
      sourceInventory: this.#source,
      instancePresence: presence,
      observedAtMs: presence.observedAtMs,
      globalLiveAgentCount: null,
      allAgentsAligned: null,
      operationalAuthorizationGranted: false,
      executionClaimsVerified: false,
      humanReviewRequiredForActivation: true,
      deploymentReadinessInferred: false,
    });
  }
}
