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
- Resolution: Open. Jack's branch is pushed and Ryan's live host (`f391a30`) is merged. Browser verification confirmed that refreshing host room R6LK creates a new room (B7UT), while the existing controller remains in R6LK. A shared resume contract and host credential persistence still need agreement; no unapproved event/field was added.

### 2026-10-24 — Remaining live-host movement and configuration integration

- Requested by: Jack's agent.
- Owning area: Ryan — host, shared networking, protocol, shared configuration.
- Blocking or non-blocking: Initial live play now works; stepwise movement and host recovery still block the full reliability milestone.
- Requested contract or behavior change: Keep host animation state separate from authoritative recovery snapshots during an active movement. `handleSnapshot` currently replaces the whole display state even when `player.moving` animation is running, and `TURN_END` cancels outstanding animation steps. Add a jointly approved read-only host reattachment command; the current protocol has no way for a refreshed host to subscribe without restarting the game. Consider an explicit turn identity on roll requests to reject an original request delayed into a later turn, and agree on retryable error codes before controllers unlock rejected submissions.
- Reason: Server and controller now implement the committed schemas, without inventing events or fields. Reconnecting movement snapshots contain the destination; live hosts should use movement events for animation and snapshots for recovery. When no connected next player exists, the server pauses in `TURN_END` with null current player and omits `turn.ended` in that case; the schema requires a non-null next player. Turn numbers remain monotonic across restart. Session memberships remain reserved for the room lifetime.
- Proposed acceptance check: Four real phones complete five rotations on the intended HTTPS demo network, including refresh, motion denial, active-player disconnect, and host recovery. Ensure snapshots do not interrupt event-driven animation. Configure Vite to load root `.env` (currently browser values must be set in `apps/web/.env.local` or exported); extend shared formatting coverage to the new owned paths when integrating.
- Resolution: Partially resolved by merging `f391a30`: live create/join/start, dice, movement, and turn rotation work together. The browser completed exactly 20 rolls, five per controller, and host/server tiles matched (0, 4, 5, 13). Three automated browser clients plus one rendered touch controller were used, not four physical phones. Under the observed rendering load, a six-space path from tile-18 to tile-4 displayed Space 19, Space 0, then Space 4 at turn end, skipping intermediate visible steps. Please make animation catch up against server timing and prevent destination snapshots from replacing an in-progress visual position. A refreshed controller retained its identity; a host refresh did not retain the room. The live Restart game action was separately verified to preserve room/player identity and reset position and lastRoll. No external message sent; physical-device proof remains pending.

## Resolved requests

### 2026-10-24 — Shared foundation and explicit integration delegation

- Requested by: Jack's agent.
- Owning area: Ryan — workspace, protocol, board, browser networking.
- Resolution: Merged Ryan's `f6dcafd` (`feat: build host board foundation`) into Jack's branch. It provides shared schemas, private response types, public snapshots without credentials, board traversal, and the browser socket factory.
- Explicit delegation: Jack authorized the requested shared integration edits in this thread: server/motion lockfile entries, web motion dependency, controller route replacement, and root dev/typecheck/test commands. Only those integration files were edited outside Jack's original ownership. No protocol events or fields were changed, and Ryan's host implementation was merged without local edits to his source files.
- Verification: The frozen lockfile installs, package type checking, lint, formatting, automated tests, and production build are checked on Jack's branch. Details are in `docs/status/JACK.md`.
