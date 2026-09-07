# Tenant activation gate

Runtime: `services/ai/runtime/tenant/activation-gate.ts`.

## Required evidence

Live requires **both** provenances, with timestamps, and every proof key:

1. `isolationEvidenceKind = authenticated_runtime` and `isolationValidated = true`  
   from the hosted User A / User B authenticated harness
2. `catalogEvidenceKind = human_verified_hosted_catalog` and `catalogValidated = true`  
   from human SQL Editor catalog verification after migration install

These are distinct from:

- unit / semantic helpers
- inferred FORCE RLS (`apply && rlsVerified`)
- simulated proof
- this chat asserting PASS

Proof keys that must also be true, with Phase 2F unapplied:

- migrationApplied
- rlsVerified
- forceRlsVerified
- userABootstrapPassed
- userBBootstrapPassed
- crossOrgIsolationPassed
- crossUniverseIsolationPassed
- arbitraryJoinDenied
- selfPromotionDenied
- foreignRoleGrantDenied
- staleAuthorizationDenied
- clientSelectorNotAuthority
- userRolesNotAuthority
- profileCompanyNotAuthority

Only then:

- `tenantPersistence = live`
- `businessModulesTenantReady = true` (marketplace still not implemented)
- `tenantAuthorization = implemented` (Business Live provider remains `not_configured`)
- mobile may hydrate authoritative `xiv_*` data

Otherwise:

- `tenantPersistence = blocked`
- no partial live state
