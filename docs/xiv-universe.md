# XIV Universe

Phase 2D domain and isolation model. **No database migration.** This does not replace existing auth, RLS, or session provisioning.

## Status

| Piece | Maturity |
| --- | --- |
| Universe / membership / resource types | IMPLEMENTED (in-memory domain) |
| Deterministic isolation helpers | IMPLEMENTED |
| Persisted Universes | PLANNED |
| Cross-Universe relationships | PLANNED |

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
