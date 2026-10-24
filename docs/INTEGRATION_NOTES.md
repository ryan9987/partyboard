# Integration notes

Use this file for changes one lane needs from another lane or from a shared contract. Resolve entries during an integration checkpoint instead of making surprise cross-ownership edits.

## Open requests

### 2026-10-24 — Host reconnection contract

- Requested by: Ryan
- Owning area: Jack's authoritative server and the shared integration contract
- Blocking or non-blocking: Blocking for the required host reconnection behavior; non-blocking for
  the first live-room integration pass
- Requested contract or behavior change: Provide a way for a refreshed or reconnected host socket
  to authenticate with its `roomCode` and `hostToken`, rejoin the Socket.IO room, and immediately
  receive `room.snapshot`. This may be a dedicated resume event or documented behavior on an
  existing host command, but it must not create a second room.
- Reason: Socket.IO reconnects with a new socket identity. The browser keeps the private host token,
  but the current protocol has no explicit event for attaching the new socket to the existing room.
- Proposed acceptance check: Start a game, refresh the host, reconnect with the same host token, and
  verify that the same room code and authoritative player positions render without interrupting the
  controllers.
- Resolution: Open; coordinate when Jack's server branch is available.

## Template

```md
### YYYY-MM-DD — Short request title

- Requested by:
- Owning area:
- Blocking or non-blocking:
- Requested contract or behavior change:
- Reason:
- Proposed acceptance check:
- Resolution:
```
