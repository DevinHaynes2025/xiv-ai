# 12D-361 — WDI API interface-contract verification rung

**Story rung:** 12D-361 (operational rung — interface-contract
verification + supervised read) · **Parents:** 12D-360 (World Bank
cross-region rung) · **Policy footprint:** none added

## What this rung is

The 12D-360 handoff's next candidate: verify the WDI API interface
contract before any extraction rung. Verified from the publisher's own
API documentation article (datahelpdesk.worldbank.org article 898581,
"API Basic Call Structures"):

- **Base URL:** `https://api.worldbank.org/V2/` (query/path styles,
  language prefix supported).
- **Formats:** xml (default), json, jsonP (+prefix), jsonstat;
  `downloadformat` = csv/xml/excel ("Downloads to ZIP file").
- **Pagination:** `page` + `per_page` (default 50 results per page);
  `mrv`/`mrnev` most-recent-values selectors; `gapfill`; `frequency`.
- **Limits:** max 60 indicators per multi-indicator call; max 1,500
  characters between two slashes; max 4,000-character URL; "You
  cannot currently sort any requests."
- **DISCLOSED:** rate limits are NOT documented on this page.
- **License context:** dataset license CC BY 4.0 verified in 12D-360
  (catalog licensing page); this article carries only site-terms of
  use (quoted in the snapshot).
- One document read through the REAL 12D-283 supervised cycle →
  **2 drafts AWAITING_REVIEW** (census 2), loopback only,
  `remoteCalls 0`.
- NO extraction performed — extraction is a separate, measured,
  CEO-gated step; 2,000,000 rows/database remains the only measured
  ceiling.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361.
2. Measured WDI extraction rung (CEO-gated): per_page-bounded JSON
   fetches for named African/Chinese economy indicators, rows counted
   against the 2M ceiling, CC BY 4.0 attribution carried.
3. 12D-340 apply execution — CEO-approved 2026-09-18/19; classifier-
   gate-blocked, retrying each segment.
4. Approval rung for the 12D-360/361 drafts (approval #6 covers 360;
   361's 2 drafts are CEO-gated).

## Approval record (blanket, DISCLOSED)

2026-09-18b — CEO Devin Xavier Haynes: "i approve lets continue
working" — blanket authorization for the 12D-360 drafts. 2026-09-19 —
CEO: "go ahead and run the apply driver" — explicit authorization to
EXECUTE the staged apply; execution gate-blocked so far, retrying.