# XIV Test Evidence

Append entries; never delete history. Skipped mandatory tests â‰  pass.

## Template

```
### YYYY-MM-DD â€” STORY_ID â€” worker
- Branch / SHA:
- Commands run:
- Passed:
- Failed:
- Not run:
- Notes:
```

## 2026-09-09 â€” bootstrap â€” grok
- Branch / SHA: `xiv-v2` / `65fa7a0688c63c5d07945ce7e7969185697b6434`
- Commands run: `Invoke-WebRequest http://127.0.0.1:8787/health` (earlier session)
- Passed: health `{"ok":true,"agent":"executive_agent"}` when service started
- Failed: n/a
- Not run: full `npm run test:runtime` (pending EY1)
- Notes: AI service deps present; Ollama not yet installed

### 2026-09-09 — EY0-L — grok
- Branch / SHA: cursor/ey0-l-local-coding-brain / 87dfb54d0182da8813446d0aa9fcacc970281cdb
- Commands run: created AGENTS.md, .cursor/rules/*, docs/operations/*; git commit
- Passed: files present; commit succeeded (12 files, +408)
- Failed: n/a
- Not run: ollama install (next); full test:runtime (EY1)
- Notes: historical working-tree edits left unstaged by design

### 2026-09-09 — EY1 — grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (pre-commit tip 2bfa3b5; stories commit follows)
- Commands run: `ollama run qwen2.5-coder:7b`; `npm run test:runtime` in `services/ai`
- Passed: test:runtime exit_code 0 (~106s); all Phase 2* case suites reported passed in log; Ollama model `qwen2.5-coder:7b` listed (4.7GB)
- Failed: none
- Not run: full mobile test suite; EY2 ModelBackend
- Notes: AI health `{"ok":true,"agent":"executive_agent"}`; L4 remains disabled per suite assertions

### 2026-09-09 — EY2 — grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (commit follows)
- Commands run: `npx tsc --noEmit` in services/ai
- Passed: typecheck after ModelBackend + ollama provider id
- Failed: none
- Not run: live ollama executive turn e2e (optional next)
- Notes: executive-turn routes via model-backend; Metro mock keeps ollama label server-only
