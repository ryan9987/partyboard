# Jack status

Jack or Jack's agent owns this file.

## Current

- Working on `feat/server-controller` in the separate `../partyboard-jack` worktree.
- Merged Ryan's branch through `d98b65d` in merge commit `bc4fad1`, retaining our HTTPS demo runner and his host recovery, deployment preflight, visual design, and 32-tile board.
- Temporary HTTPS demo serving is implemented in Jack-owned server files, with one public origin for the built host, phone controller, QR URL, and Socket.IO.
- The server, phone controller, and Ryan's 3D host now run together with VITE_SOCKET_URL configured. The five-minute polling task was disabled when the live integration arrived.

## Completed

- In-memory rooms with four distinct-color players, private host/session credentials, public snapshots, and persistent player identity independent of Socket.IO IDs.
- Server-authoritative rolls and board traversal, phase timers, turn rotation, host authorization, per-session request deduplication, and restart timer cancellation.
- Schema validation of incoming/outgoing game messages.
- Controller refresh/reconnection, replacement transport invalidation, active disconnect timeout, skipping offline players, and pause/resume when everyone disconnects.
- Socket.IO server with exact origin checks and an interactive text host (`pnpm --filter @party-board/server debug:host`).
- `/controller` and `/controller/ROOM` join, lobby, waiting, active-turn, connection/error, and motion-permission UI.
- Visible touch Roll fallback, shared synchronous touch/shake request latch, pending-roll retry with the same request ID after reconnect, and localStorage session recovery.
- Dependency-free motion recognition, listener cleanup, permission handling, gravity fallback, and deterministic tests.
- Jack explicitly authorized the shared lockfile, web motion dependency, controller route, and root dev/typecheck/test integration edits in this thread. Ryan's host/board/networking/protocol source and status were preserved through the merge, with no additional local edits to his owned implementation.

## Verification

- `pnpm install --frozen-lockfile` — passed.
- `pnpm check` — passed: package type checking, lint, shared formatting checks, 41 Vitest tests, 10 motion tests, and production Vite build.
- Additional Prettier check of server, controller, motion, and server tests — passed.
- Engine simulation and actual Socket.IO tests each complete five rotations with four controllers, correct positions/wraparound, and one result per turn despite duplicate requests.
- Additional tests exercise private joins, malformed payloads, host/player authorization, invalid origins, restart during animation, lost-request retries, refresh, and disconnect recovery.
- Browser at a 390 px viewport: join/ready, active turn, touch roll and immediate disable, permission denial with enabled touch fallback, synthetic shake submission, and refresh restoring the same room/player during a running game.
- Text-host creation/show/quit and root dev process startup smoke-tested.
- Combined live 3D browser run: three automated controller clients plus one rendered touch controller completed exactly 20 rolls, five per player, reaching turn 21. Server dice sums, server snapshots, and host positions matched (tiles 0, 4, 5, 13). This was a local browser test, not physical-phone demo-network proof.
- Earlier integration: controller refresh retained Jack's identity and room R6LK; host refresh then created a new empty room B7UT (fixed by the newly merged host-resume flow). A separate live host restart check kept room B7UT and its player identity, reset tile-3 to tile-0, and cleared lastRoll; automated server restart tests also pass.
- Earlier integration: the host showed skipped intermediate movement steps under the tested rendering load. Exact evidence and the snapshot/animation interaction are recorded for Ryan in the integration notes.
- Non-blocking build warning: existing host chunk exceeds Vite's 500 kB advisory. React StrictMode's development effect cleanup can produce an initial closed-WebSocket warning; the subsequent connection succeeds.

## HTTPS demo verification

- Added compiled static serving with deep links, explicit asset MIME types, and build-directory containment. Three new tests cover routes/assets/HEAD, missing/dot/traversal/symlink paths, and same-origin Socket.IO polling.
- Added `pnpm --filter @party-board/server demo`: reserves a loopback port, starts an account-free Cloudflare Quick Tunnel, builds for its generated public origin, starts the game/static server, checks public reachability, and keeps both services running until stopped.
- No npm dependency, shared protocol, or Ryan-owned source changes were required. cloudflared 2026.10.3 was downloaded outside the repo and verified against its official release SHA-256 digest.
- Public HTTPS returned HTTP 200; browser confirmed `isSecureContext === true`, the correct HTTPS QR link, controller join, and immediate touch-roll disable. Browser WSS Engine.IO handshake succeeded.
- A separate public WSS client completed create/join/start, duplicate roll rejection, server dice/movement, and turn advancement. Physical phone motion remains untested.
- Public demo is temporary and depends on the running process/laptop/network. Current URL is provided in the conversation, not committed as permanent configuration. Run instructions and shutdown behavior are in `apps/server/README.md`.

## Latest integration check

- Applied the explicitly requested Ponytail skill from the local Claude plugin cache: reused existing implementation, added one 32-tile wraparound check, and made a small tunnel readiness fix rather than adding dependencies or another deployment service.
- Existing engine/socket tests cover the merged authenticated host-resume command; the new sixth six-space roll verifies the exact tile-30 → tile-31 → tile-0 → tile-4 wraparound path.
- The public HTTPS preflight reports a secure context, correct controller URL, and connected server. Browser refresh preserved lobby room LTZN. A public WSS roll/resume check also preserved the same room, turn, and moved position after replacing the host connection.
- A temporary local DNS negative-cache miss delayed Quick Tunnel startup. A fresh system resolver query succeeded; no persistent DNS or Tailscale settings were changed. The runner now waits up to two minutes and includes the last HTTP/network failure in its error.
- Browser automation briefly disconnected around a Start click, so the active-game resume was verified with the actual public WSS client rather than claiming a completed browser game-refresh check.
- Root `.env` instructions now match Ryan's Vite configuration. Full `pnpm check` passes (51 total tests); the readiness follow-up also passes server type checking and lint.

## Blockers and handoffs

- Ryan's host-resume and movement-snapshot fixes are merged. Remaining acceptance work is physical iPhone/Android motion, four-phone HTTPS rotations, and intended-network proof.
- Browser and server configuration now both load root `.env`. Run instructions are in `apps/server/README.md` and `apps/web/src/controller/README.md`.
- No physical iPhone/Android motion tuning or four-phone HTTPS/demo-network proof has been completed. The full milestone is not complete.
- Rooms, session memberships, and accepted request IDs remain in memory for the room lifetime. No database or player replacement feature is implemented.

## iPhone Shake to Undo report

- The reported Undo popup is the iPhone system editing gesture. Added an optional, keyboard-accessible disclosure beside motion controls with the exact system-settings path and the existing touch Roll alternative.
- No gesture thresholds, roll submission logic, or shared protocol changed. The website does not claim to disable the operating-system setting. The player must turn off Shake to Undo on the phone to suppress it while shaking.
- Verification: controller/web type checking, lint, formatting, and build; physical iPhone popup suppression requires the device setting and manual confirmation.
