# Integration notes

Use this file for changes one lane needs from another lane or from a shared contract. Resolve entries during an integration checkpoint instead of making surprise cross-ownership edits.

## Open requests

### 2026-10-24 — Connect Ryan's host to Jack's live server

- Requested by: Jack's agent.
- Owning area: Ryan — host, shared networking, protocol, shared configuration.
- Blocking or non-blocking: Blocks the complete visual board demo; the text host and phone controllers can exercise the live server independently.
- Requested contract or behavior change: Replace host fixtures with `room.create`, authenticated start/restart, snapshots, dice, and movement events. Validate all consumed browser payloads in the shared adapter. Add a jointly approved read-only host reattachment command; the current protocol has no way for a refreshed host to subscribe without restarting the game. Consider an explicit turn identity on roll requests to reject an original request delayed into a later turn, and agree on retryable error codes before controllers unlock rejected submissions.
- Reason: Server and controller now implement the committed schemas, without inventing events or fields. Reconnecting movement snapshots contain the destination; live hosts should use movement events for animation and snapshots for recovery. When no connected next player exists, the server pauses in `TURN_END` with null current player and emits no `turn.ended` until a next player exists; the schema requires a non-null next player. Turn numbers remain monotonic across restart. Session memberships remain reserved for the room lifetime.
- Proposed acceptance check: Four real phones complete five rotations on the intended HTTPS demo network, including refresh, motion denial, active-player disconnect, and host recovery. Ensure snapshots do not interrupt event-driven animation. Configure Vite to load root `.env` (currently browser values must be set in `apps/web/.env.local` or exported); extend shared formatting coverage to the new owned paths when integrating.
- Resolution: Open handoff recorded for Ryan. No external message sent. The physical-device milestone is not claimed complete.

## Resolved requests

### 2026-10-24 — Shared foundation and explicit integration delegation

- Requested by: Jack's agent.
- Owning area: Ryan — workspace, protocol, board, browser networking.
- Resolution: Merged Ryan's `f6dcafd` (`feat: build host board foundation`) into Jack's branch. It provides shared schemas, private response types, public snapshots without credentials, board traversal, and the browser socket factory.
- Explicit delegation: Jack authorized the requested shared integration edits in this thread: server/motion lockfile entries, web motion dependency, controller route replacement, and root dev/typecheck/test commands. Only those integration files were edited outside Jack's original ownership. No protocol events or fields were changed, and Ryan's host remains his fixture implementation.
- Verification: The frozen lockfile installs, package type checking, lint, formatting, automated tests, and production build are checked on Jack's branch. Details are in `docs/status/JACK.md`.
