# XIV Universe

Phase 2E in-memory isolation plus Phase 2F persistence **design**. Persisted Universes are **not LIVE**.

## Status

| Piece | Maturity |
| --- | --- |
| Universe / membership / resource types | IMPLEMENTED IN CODE (in-memory domain) |
| Deterministic isolation helpers | IMPLEMENTED IN CODE |
| Company media Universe check | IMPLEMENTED IN CODE (deny when missing; real IDs only when a persisted row exists) |
| Persistence SQL + tenant helpers | MIGRATION AUTHORED — NOT APPLIED (collision) |
| Mobile tenant selection / bootstrap UX | IMPLEMENTED IN CODE |
| Persisted Universes (hosted) | NOT CONFIGURED |
| Cross-Universe relationships | PLANNED |
| Cross-Universe agent data sharing | FORBIDDEN (no inferred sharing) |

## Model

A Universe is a logically isolated organization space:

- `universeId`, `organizationId`, `name`, `status`
- `dataClassification`, `storageTier`, `regionPreference`
- `prototype`

Roles: owner, executive, admin, manager, employee, member, consumer_guest, agent.

Visibility: private, universe, organization, employees, public.

Every protected resource can carry: `resourceId`, `universeId`, `organizationId`, `ownerId`, `resourceType`, `visibility`, `classification`, `createdAt`.

## Isolation

```
DEFAULT = DENY
Unknown Universe → DENY
Missing organization → DENY
Missing ownership metadata → DENY
Universe A resource from Universe B → DENY
```

Helpers:

- `canReadUniverseResource`
- `canPublishUniverseResource`
- `canAgentAccessUniverseResource`

A compromise in one Universe must not automatically expose another. There is no global superuser for agents.

Consumers do not automatically gain access to private company Universes. Company data does not automatically become public.
