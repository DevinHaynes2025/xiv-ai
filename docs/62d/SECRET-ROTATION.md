# XIV 62D — Secret Rotation

AC-16 requires a rotation procedure that is documented **and tested**. The test
is part of the acceptance suite: `services/runtime/acceptance/supplychain.ts`
rotates the plane's signing material and then asserts that credentials issued
under the previous keys stop verifying while freshly issued ones still work.

## What the runtime signs

`SigningKeys` (`services/runtime/src/crypto.ts`) holds one HMAC key per purpose,
so a compromise of one does not carry into the others:

| Key | Signs |
| --- | --- |
| `enrollment` | Node enrollment tickets |
| `grant` | Workload authorization grants and guardian clearances |
| `attestation` | Attestation records |
| `offline` | Offline work packages and their results |
| `meeting` | Meeting rosters, messages and approvals |
| `checkpoint` | Execution checkpoints used by recovery |

## Rotation procedure

1. Generate fresh material: `generateSigningKeys()` produces 32 random bytes per
   key. Never hand-write a key and never reuse one across environments.
2. Rotate the plane: `plane.rotateKeys(next)`. Every subsystem holds the same key
   object, so the rotation is atomic across enrollment, grants, attestation,
   offline packages, meetings and checkpoints.
3. The rotation is recorded in the audit ledger as `signing_keys_rotated` with
   the **fingerprints** of the previous and current keys — `sha256(key)`
   truncated — and never the key material itself.
4. Re-issue what the rotation invalidated:
   - outstanding enrollment tickets must be re-issued (registration now fails
     with `enrollment_invalid`);
   - outstanding offline work packages must be re-issued (validation now fails
     with `package_invalid`);
   - nodes must re-attest;
   - in-flight grants expire on their own five-minute TTL.
5. Confirm the rotation the same way the suite does: an old package fails to
   validate, a newly issued one validates, and the audit ledger carries the
   rotation event with no key material in it.

## Blast radius, stated plainly

Rotation is deliberately disruptive. It invalidates every outstanding
signature at once, which is the point: after a suspected compromise there is no
window in which an attacker's ticket, grant or package is still honoured. Plan a
rotation as a fleet re-enrollment, not as a silent config change.

## What is not covered here

- Provider API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
  Supabase keys) live outside this runtime. No provider is configured in the
  staging environment these runs measure, so provider-key rotation is
  documented in the deployment runbook and is not exercised by this suite.
- Key custody. This layer keeps signing material in process memory for the life
  of the plane. It does not integrate a KMS or HSM, so "where the key lives
  between restarts" is a deployment concern that has not been solved here.
