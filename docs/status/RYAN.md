# Ryan status

Ryan or Ryan's agent owns this file.

## Current

- Jack's server/controller/motion branch is integrated with Ryan's live 3D host.
- The first real host/controller integration checkpoint and host-refresh recovery test pass.

## Completed

- Named ownership assigned.
- Exact workspace dependencies and lockfile added.
- Public protocol implemented with Zod; private session IDs are excluded from snapshots.
- Validated 20-tile board and wraparound traversal implemented.
- Lazy `/host` route, lobby, QR code, four detailed characters, die, and turn overlay implemented.
- Fixture-driven dice and movement sequence completes a full player rotation.
- Typed Socket.IO client and room-state hook added for integration.
- Added a bright Three.js world with a layered grass island, stone path, trees, rocks, flowers,
  moving clouds, daylight, fog, shadows, and a central dice plaza.
- Replaced placeholder pawns with animated stylized humanoids featuring four distinct skin tones,
  outfits, hairstyles, accessories, idle motion, walking motion, and an active-player indicator.
- Character appearance is represented by typed data so a later pre-game customizer can reuse the
  same models without changing board movement or network state.
- Adjusted the camera and starting character cluster so all four players remain visible beside the
  host overlay at the tested laptop viewport.
- Added automatic dual-mode startup: fixture preview without `VITE_SOCKET_URL`, live room creation
  and server-backed UI when the variable is configured.
- Added validated handling for room creation, snapshots, incremental player updates, game start,
  turn start, dice result, movement path, turn end, and safe game errors.
- Connected authoritative movement paths to the existing per-tile character animation without
  allowing the host to generate live dice values or choose a path.
- Added authenticated live Start and Restart commands plus explicit connecting/disconnected UI.
- Added centralized runtime configuration validation for controller and Socket.IO URLs, including
  insecure remote endpoint and secure-context warnings.
- Added a polished in-app Preflight panel for host security, controller URL, server connection, and
  joined/ready controller counts. It can open automatically with `/host?preflight=1`.
- Added a platform-neutral deployment and release-proof playbook.
- CI, lint, formatting, tests, type checking, and production build configured.
- Added authenticated host resume without room creation or state reset.
- Configured Vite to read root environment files and expanded formatting coverage to every merged
  application/package lane.

## Blockers and handoffs

- Physical iPhone/Android motion and intended demo-network testing remain outstanding.

## Verification

- `pnpm check` passes.
- 37 Vitest checks and 10 motion tests pass across the integrated workspace.
- Production Vite build succeeds with the host isolated into a lazy-loaded chunk.
- Browser-tested the detailed lobby world, character placement, a six-space dice/movement turn,
  turn advancement, and updated player positions at a 944-by-804 viewport.
- No browser console errors were observed.
- Browser-tested the live-mode disconnected state with a configured unavailable server: the host
  displays a clear error, keeps the board rendered, and disables Start.
- Browser-tested a real controller join, server-generated roll, four-tile movement, automatic turn
  advancement, and host-page refresh with the same authoritative room and position.
