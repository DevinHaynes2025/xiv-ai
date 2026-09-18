# 12D-348 — directive-#7 verified reads: awesome-opensource-email (LDCS + awesome-home-automation honestly skipped)

**Story rung:** 12D-348 (operational rung over committed doors — the
12D-341/342/343/345/346/347 read pattern; no code changed) ·
**Parents:** CEO directive #7 / 12D-276 / 12D-283 / 12D-322 ·
**Policy footprint:** none added

## What this rung is

Directive-#7 email/infra batch through the license-before-read rule:

- **Mindbaz/awesome-opensource-email** — READ (CC0-1.0 verified
  BEFORE read; CC0-LIST RULE disclosed: the list's license covers
  the LIST TEXT ONLY, not the projects it lists — each future
  per-project read verifies its own license). Curated open-source
  email tooling list (1.2k★): SMTP/IMAP/JMAP servers, testing,
  deliverability, DMARC/security tooling, disposable-domain lists.
- **LDMX-Software/LDCS** — REGISTERED-UNREAD, honest skip: no
  license on the repo page; LICENSE file 404 at trunk, master, and
  main. Unverifiable → no read.
- **brandonhimpfen/awesome-home-automation** — REGISTERED-UNREAD,
  honest skip: badge labeled "CC0" links to CC BY-SA 4.0
  (contradictory), no LICENSE file in the repo tree. Unverifiable →
  no read.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-348/`, never committed)

- 3 registered (1 PUBLIC_WEB read + 2 registered-unread), **3 chunks
  read** (the email list split in 3; the REAL 12D-287 continuation
  gate exercised on chunks 2 AND 3) = **3 counted loopback model
  calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0, all
  3 drafts AWAITING_REVIEW (draftChars 359/682/729 measured),
  stopped before review.
- Slate: 3 of 3, 0 redactions, digest `48f15aedb653…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- The CEO's "email security" direction maps to the list's
  Security/Deliverability rows: DMARC tooling (parsedmarc,
  checkdmarc), verification-without-sending (Reacher), disposable-
  domain detection (Mailchecker, 55,000+ domains), CISA's Trustymail
  — a bounded, defensive toolset shape.
- MTA diversity (Postfix → KumoMTA → Stalwart) = one protocol, many
  doors: SMTP is the standard boundary, servers are interchangeable
  components.
- Two honest skips in one rung: a contradictory license badge is as
  unverifiable as no license at all — both recorded in the register
  with the exact reason, never pretended.

## What this is NOT

- NOT any read of the listed projects' content (list text only —
  CC0-list rule), NOT any email sent or third-party system
  contacted, NOT any model-weight mutation or learning promotion,
  NOT any review decision (CEO-gated), NOT any fabricated
  verification (two skips recorded honestly).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: earthspecies
   repos, Socrata retry, remaining directive-#7 entries).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).