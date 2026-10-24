# Jack status

Jack or Jack's agent owns this file.

## Current

- Working on `feat/server-controller` in the separate `../partyboard-jack` worktree.
- Merged Ryan's host/board foundation commit `f6dcafd`.
- First server/controller acceptance slice works through a text host and live phone-controller route. Ryan's 3D host still uses its fixture.

## Completed

- In-memory rooms with four distinct-color players, private host/session credentials, public snapshots, and persistent player identity independent of Socket.IO IDs.
- Server-authoritative rolls and board traversal, phase timers, turn rotation, host authorization, per-session request deduplication, and restart timer cancellation.
- Schema validation of incoming/outgoing game messages.
- Controller refresh/reconnection, replacement transport invalidation, active disconnect timeout, skipping offline players, and pause/resume when everyone disconnects.
- Socket.IO server with exact origin checks and an interactive text host (`pnpm --filter @party-board/server debug:host`).
- `/controller` and `/controller/ROOM` join, lobby, waiting, active-turn, connection/error, and motion-permission UI.
- Visible touch Roll fallback, shared synchronous touch/shake request latch, pending-roll retry with the same request ID after reconnect, and localStorage session recovery.
- Dependency-free motion recognition, listener cleanup, permission handling, gravity fallback, and deterministic tests.
- Jack explicitly authorized the shared lockfile, web motion dependency, controller route, and root dev/typecheck/test integration edits in this thread. Ryan's host, board, networking, protocol, and status were not edited.

## Verification

- `pnpm install --frozen-lockfile` — passed.
- `pnpm check` — passed: package type checking, lint, shared formatting checks, 28 Vitest tests, 10 motion tests, and production Vite build.
- Additional Prettier check of server, controller, motion, and server tests — passed.
- Engine simulation and actual Socket.IO tests each complete five rotations with four controllers, correct positions/wraparound, and one result per turn despite duplicate requests.
- Additional tests exercise private joins, malformed payloads, host/player authorization, invalid origins, restart during animation, lost-request retries, refresh, and disconnect recovery.
- Browser at a 390 px viewport: join/ready, active turn, touch roll and immediate disable, permission denial with enabled touch fallback, synthetic shake submission, and refresh restoring the same room/player during a running game.
- Text-host creation/show/quit and root dev process startup smoke-tested.
- Non-blocking build warning: existing host chunk exceeds Vite's 500 kB advisory. React StrictMode's development effect cleanup can produce an initial closed-WebSocket warning; the subsequent connection succeeds.

## Blockers and handoffs

- Ryan must connect the 3D host to live events. Exact follow-up requests, including host reattachment and Vite environment-file location, are in `docs/INTEGRATION_NOTES.md`.
- Browser configuration currently belongs in `apps/web/.env.local` or exported variables; server configuration belongs in root `.env`. Run instructions are in `apps/server/README.md` and `apps/web/src/controller/README.md`.
- No physical iPhone/Android motion tuning or four-phone HTTPS/demo-network proof has been completed. The full milestone is not complete.
- Rooms, session memberships, and accepted request IDs remain in memory for the room lifetime. No database or player replacement feature is implemented.
