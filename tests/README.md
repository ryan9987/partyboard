# Cross-package tests

Place integration-level scenarios here. Package-specific unit tests may live beside their source.

Required scenarios:

- Create a room and join four players
- Reject an out-of-turn roll
- Deduplicate repeated request IDs
- Generate a result from 1 through 6
- Move through wraparound tiles
- Advance through a complete player rotation
- Reconnect using the same private session ID
- Skip or recover from a disconnected active player
