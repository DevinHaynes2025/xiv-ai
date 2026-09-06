# XIV Security Architecture

Engineering target: defense in depth, zero trust, least privilege, compartmentalization, tenant isolation, resilience, continuous verification, auditable access.

Do **not** describe XIV as hack-proof or unhackable.

A compromise of one user, device, Universe, organization, service, storage partition, or region must not automatically compromise another. There is no global superuser mechanism for agents.

## Control maturity

| Control | Status |
| --- | --- |
| Identity | IMPLEMENTED |
| MFA / passkeys architecture | PLANNED |
| Device / session trust | PROTOTYPE |
| RBAC | PROTOTYPE |
| ABAC | PROTOTYPE |
| Universe isolation | PROTOTYPE |
| Organization isolation | PROTOTYPE |
| Data classification | PROTOTYPE |
| Least privilege | IMPLEMENTED |
| Signed media access | NOT CONFIGURED (grant shape only) |
| Media quarantine | IMPLEMENTED (local / conceptual) |
| Malware scanning | NOT CONFIGURED |
| Encryption in transit | IMPLEMENTED |
| Encryption at rest | PLANNED |
| Key-management abstraction | PROTOTYPE |
| Rate limiting | PLANNED |
| WAF / DDoS architecture | PLANNED |
| Malware scanning | PLANNED |
| Content validation | PROTOTYPE |
| Audit events | PROTOTYPE |
| Anomaly detection | PLANNED |
| Backup / recovery | PLANNED |
| Regional isolation | PLANNED |
| Secret management | IMPLEMENTED |
| Dependency security | PLANNED |
| Secure SDLC | PROTOTYPE |
| Agent policy enforcement | IMPLEMENTED |

## Classification

`public` · `internal` · `confidential` · `restricted` (future: regulated)

- Consumer + restricted company data → DENY
- Guardian + confidential/restricted business data → DENY
- Executive + confidential summary → policy check required

## Audit

Access records identify who, what, Universe, organization, resource, reason, decision, timestamp.

Never log passwords, tokens, API keys, signed URL query strings, private encryption keys, or raw secrets. `stripSignedUrlSecrets()` and `sanitizeAuditText()` enforce this on access events.

## Human approval

Necessary but not sufficient. Policy may still deny an approved action. L4 remains disabled. Production writes remain denied.
