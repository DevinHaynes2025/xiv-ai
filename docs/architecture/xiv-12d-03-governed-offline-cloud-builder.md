# XIV 12D-03 — Governed Offline + Cloud Builder

## Purpose
Enable Grok, Ollama, ChatGPT, Gemini, and future models to contribute architecture, schemas, migrations, tests, and code without requiring Cursor and without granting autonomous production authority.

## Operating model
1. Human defines objective and target branch.
2. Planner model proposes architecture and database blueprint.
3. Ollama may run the local/offline generation path through `127.0.0.1:11434` when configured.
4. Cloud models may generate artifacts through provider adapters when credentials are configured.
5. Database work runs against SQLite/Postgres/vector/graph sandboxes or isolated cloud resources.
6. Every artifact receives checksums, provenance, tests, rollback instructions, and cost/quality evidence.
7. GitHub and GitLab remain versioned source-of-truth mirrors.
8. Production execution, destructive migrations, secrets, tenant policy changes, and deployments require an explicit separate approval path.

## Google Cloud target pattern
The builder may generate Terraform/IaC and database plans for isolated Google Cloud development projects. Provider credentials must be least-privilege, scoped to sandbox resources, and never embedded in prompts or repository files.

## Grok + Ollama division of labor
- Grok: optional networked planner/reviewer when its API adapter is configured.
- Ollama: preferred offline/local inference path for schema generation, refactoring, test generation, summarization, and local architecture reasoning.
- XIV policy layer: decides whether an artifact is generate-only, sandbox-executable, or blocked.

## Non-goals
This story does not give any model unrestricted cloud credentials, production database access, force-push rights, autonomous deploy rights, or authority to bypass repository reviews.
