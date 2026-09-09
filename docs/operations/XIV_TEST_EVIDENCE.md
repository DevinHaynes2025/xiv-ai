# XIV Test Evidence

Append entries; never delete history. Skipped mandatory tests ≠ pass.

## Template

```
### YYYY-MM-DD — STORY_ID — worker
- Branch / SHA:
- Commands run:
- Passed:
- Failed:
- Not run:
- Notes:
```

## 2026-09-09 — bootstrap — grok
- Branch / SHA: `xiv-v2` / `65fa7a0688c63c5d07945ce7e7969185697b6434`
- Commands run: `Invoke-WebRequest http://127.0.0.1:8787/health` (earlier session)
- Passed: health `{"ok":true,"agent":"executive_agent"}` when service started
- Failed: n/a
- Not run: full `npm run test:runtime` (pending EY1)
- Notes: AI service deps present; Ollama not yet installed
