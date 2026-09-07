# Business Live v2

Business-only livestreaming. Consumers do not receive Go Live.

**Status:** PROTOTYPE (catalog + host model) · NOT CONFIGURED (provider, verification, private hosting)

## Hosts

Only business accounts / authorized business representatives can host.

Path: authenticated user → organization membership → authorized host role → business verification → stream policy → moderation/security → stream.

Because tenant persistence is blocked (`schema_collision`), real private hosting remains NOT CONFIGURED. Authorization is not faked.

## Live Intelligence

May later caption, summarize, extract topics, identify actions/questions, translate, flag sensitive exposure, and draft a post-stream brief. It cannot automatically publish private content.

## Security

Host identity, business verification, session/device/tenant validation, stream-key security, short-lived credentials, viewer authorization, rate limiting, bot detection, DLP, recording consent, screen-share warnings, classification, moderation, kill switch, audit, retention. Infrastructure remains NOT CONFIGURED. Unavailable DLP does not claim scan success.
