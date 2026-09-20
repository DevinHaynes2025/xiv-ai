# XIV Agent Handoff Contract

Use this file to move work between Cursor, Ollama, GrokBot, ChatGPT, and other coding agents.

## Input packet
- STORY
- TASK
- BRANCH
- BASE_SHA
- RELEVANT_FILES
- ACCEPTANCE_CRITERIA
- KNOWN_FAILURES
- COMMANDS_TO_RUN
- ALLOWED_CHANGES
- FORBIDDEN_CHANGES

## Return receipt
- AGENT
- MODEL/RUNTIME
- STORY
- BRANCH
- BASE_SHA
- FILES_READ
- FILES_CHANGED
- WHY_CHANGED
- COMMANDS_RUN
- TESTS_PASS
- TESTS_FAIL
- TESTS_NOT_RUN
- BUGS_FOUND
- SECURITY_FINDINGS
- PERFORMANCE_FINDINGS
- DATA_FINDINGS
- BLOCKERS
- LESSON_CANDIDATES
- NEXT_SAFE_TASK

## Rules
External model output is a proposal until reviewed.
Do not let multiple writers edit the same file simultaneously.
Do not merge or deploy from a handoff.
Do not include secrets, credentials, or hidden chain-of-thought.
