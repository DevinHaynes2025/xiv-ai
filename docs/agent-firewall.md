# Agent Firewall

Default-deny gate in front of every structured handoff.

Checks: source, destination, handoff type, scope, classification, authority, hop count, tools, tenant match, policy.

Unknown handoffs are denied. Guardian cannot join the tenant mesh. Authority cannot transfer. Cross-Universe tenant data cannot be sent.
