# XIV Agent Roster — Company Roles → Coding Workers

One brain. Many specialized agents. Models are interchangeable.

| Role | Mission | Primary worker | Online / offline |
|------|---------|----------------|------------------|
| **Home Base / Orchestrator** | Queue, evidence, handoffs, schedule | Grok Bot (xiv ai) | Both |
| **Local Engineering Agent** | Implement stories on child branches | Ollama + Aider/OpenCode on ASUS | Offline-first |
| **Cursor Editor** | Diffs, debug, Git, terminal | Human + Cursor IDE | Local |
| **Cursor Cloud Agent** | Heavy PR slices when usage authorized | Cloud agent | Online only |
| **Story Author** | User stories → acceptance criteria | ChatGPT | Online |
| **Architecture Reviewer** | Second opinion on PRs / design | ChatGPT + Grok | Online |
| **Executive Agent** | Business health / Story Engine turns | `services/ai` (Gemini/Ollama) | Online or local model |
| **Guardian** | Health checks, no arbitrary exec | Runtime Guardian | Local |
| **Data Steward** | Migrations, RLS, Supabase | Grok + Supabase connector | Online DB / local SQL |
| **Cloud Infra (AWS/Azure)** | IaC later; status stubs today | AWS/Azure connectors + skills | Online |
| **CRM / ERP Specialist** | Salesforce etc. when connected | Salesforce connector (pending) | Online |
| **Research / Foresight** | Public sources with provenance | Grok + proven adapters | Online; `WAITING_DATA` offline |

## Rules
- Agents propose; humans approve consequential actions. L4=false.
- No role may invent internet activity while offline.
- Neural pathways = **Git evidence loop** (story → code → test → lesson in ops docs), not unbounded data mining.
