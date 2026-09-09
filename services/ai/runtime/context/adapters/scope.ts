import type { DataClassification } from '../../universe/types';

export type DataScope = 'public' | 'personal' | 'organization' | 'universe';

export type ScopeAuthorizationInput = {
  agentId: string;
  ownerId?: string | null;
  organizationId?: string | null;
  universeId?: string | null;
  classification?: DataClassification;
  scope?: DataScope;
};

export type ScopeAuthorizationResult = {
  allowed: boolean;
  reason: string;
};

function present(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Scope is never inferred as public from missing metadata.
 * Technology domain is not a scope and is not consulted here.
 */
export function authorizeDataScope(input: {
  agentId: string;
  request: ScopeAuthorizationInput;
  provenance: {
    scope?: DataScope | null;
    ownerId?: string | null;
    organizationId?: string | null;
    universeId?: string | null;
    dataClassification?: DataClassification;
  };
}): ScopeAuthorizationResult {
  const scope = input.provenance.scope;
  if (!scope) return { allowed: false, reason: 'Missing scope: DENY' };

  if (input.agentId === 'guardian' && scope !== 'public') {
    return {
      allowed: false,
      reason:
        scope === 'personal'
          ? 'Guardian cannot read personal session records.'
          : 'Guardian cannot read organization or Universe business data.',
    };
  }

  if (scope === 'public') {
    if (input.provenance.dataClassification !== 'public' || input.request.classification !== 'public') {
      return { allowed: false, reason: 'Public access requires explicit public classification: DENY' };
    }
    return { allowed: true, reason: 'Explicit public scope authorized.' };
  }

  if (scope === 'personal') {
    if (!present(input.provenance.ownerId)) {
      return { allowed: false, reason: 'Personal record requires ownerId: DENY' };
    }
    if (!present(input.request.ownerId)) {
      return { allowed: false, reason: 'Personal record requires ownerId: DENY' };
    }
    if (input.request.ownerId !== input.provenance.ownerId) {
      return { allowed: false, reason: 'Personal record owner mismatch: DENY' };
    }
    return { allowed: true, reason: 'Personal owner scope authorized.' };
  }

  if (scope === 'organization') {
    if (!present(input.provenance.organizationId) || !present(input.request.organizationId)) {
      return { allowed: false, reason: 'Organization-scoped record requires organizationId: DENY' };
    }
    if (input.request.organizationId !== input.provenance.organizationId) {
      return { allowed: false, reason: 'Organization mismatch: DENY' };
    }
    return { allowed: true, reason: 'Organization scope authorized.' };
  }

  if (scope === 'universe') {
    if (
      !present(input.provenance.organizationId) ||
      !present(input.provenance.universeId) ||
      !present(input.request.organizationId) ||
      !present(input.request.universeId)
    ) {
      return { allowed: false, reason: 'Universe-scoped record requires organizationId and universeId: DENY' };
    }
    if (
      input.request.organizationId !== input.provenance.organizationId ||
      input.request.universeId !== input.provenance.universeId
    ) {
      return { allowed: false, reason: 'Universe mismatch: DENY' };
    }
    return { allowed: true, reason: 'Universe scope authorized.' };
  }

  return { allowed: false, reason: 'Unknown scope: DENY' };
}

export function scopeFromRelationship(input: {
  organizationId?: string | null;
  universeId?: string | null;
}): DataScope {
  const organizationId = present(input.organizationId) ? input.organizationId : null;
  const universeId = present(input.universeId) ? input.universeId : null;
  if (organizationId && universeId) return 'universe';
  if (organizationId) return 'organization';
  return 'personal';
}
