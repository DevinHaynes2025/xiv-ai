# Authorization Freshness

**Status:** IMPLEMENTED (types) · NOT CONFIGURED (hosted membership clocks)

Persisted membership must be revalidated. Cached roles are not trusted forever.

Fields: `roleVersion`, `membershipUpdatedAt`, `authorizationCheckedAt`, `authorizationExpiresAt`.

Sensitive actions require a fresh window. Expired context is denied.
