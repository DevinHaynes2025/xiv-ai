# XIV 62D — Dependency Review

AC-17 requires that no direct dependency arrives unreviewed. The acceptance suite
diffs `package.json` files on this branch against the base branch and fails if a
direct dependency was added without an entry here.

Run the analysis with:

```bash
cd services/runtime
npm run sbom            # lockfile inventory + npm audit per shipping runtime
npm run sbom -- --write docs/62d/sbom   # CycloneDX documents
```

## Direct dependencies added on this branch

All three are added to `services/runtime` only, as `devDependencies`, and none
of them execute in a shipping runtime path.

| Package | Version | Why it is here | Runtime exposure |
| --- | --- | --- | --- |
| `typescript` | `~5.9.2` | Type checking is a gate for AC-18, so the compiler must be pinned in the package rather than assumed present on the machine. | Build-time only. |
| `tsx` | `^4.20.5` | Runs the TypeScript sources for the acceptance suite, the unit suite and the tools without a separate build step. | Build- and test-time only. |
| `@types/node` | `^24.3.0` | Type definitions for the Node APIs the runtime uses (`node:crypto`, `node:http`, `node:test`). | Types only, erased at runtime. |

Reviewed against the versions resolved in `services/runtime/package-lock.json`.
Every component in that lockfile carries an integrity hash and resolves to
`registry.npmjs.org`, which is what AC-17's "unpinned or unverifiable dependency
sources" threshold measures.

## Open advisories

`npm audit` findings are recorded per run in `docs/62d/acceptance-evidence.json`
under AC-17. At the time of writing, `apps/mobile` carries moderate advisories
inherited from the Expo toolchain and no critical or high advisories exist in any
shipping runtime. Moderate findings do not block the gate; critical and high do.

## What this review does not cover

- No signed build provenance attestation is produced for XIV builds yet, so the
  chain from source to artifact is not independently verifiable.
- `npm audit` reflects the advisory database at the moment it runs. It is not a
  continuous monitor, and this evidence expires as new advisories are published.
