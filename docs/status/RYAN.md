# Ryan status

Ryan or Ryan's agent owns this file.

## Current

- Round-end Hot Potato, coin rewards, pass-by market stops, Frost Charm/Boots/Shield, and a 48-space
  route implemented at Ryan's request. Rules and verification are in `docs/PARTY_ECONOMY.md`.

- First mini-game implemented at Ryan's request: authoritative occupied-space sword duel,
  crossed-swords transition, woodland arena, phone swing/guard gestures, and touch fallback.

- Jack's server/controller/motion branch is integrated with Ryan's live 3D host.
- The first real host/controller integration checkpoint and host-refresh recovery test pass.
- Woodland visual pass implemented with local geometry/textures and instanced planting; no
  external assets, new dependencies, or controller/server changes required.
- Host UI now matches the woodland palette with ivory journal panels, forest-green text, plain
  turn labels, a pip-face last-roll display, and a matching original trail/leaf logo. SVG, multi-size
  ICO, and Apple touch icons are bundled locally with a reproducible Windows generator.

## Completed

- Named ownership assigned.
- Exact workspace dependencies and lockfile added.
- Public protocol implemented with Zod; private session IDs are excluded from snapshots.
- Validated 32-tile winding board and wraparound traversal implemented.
- Lazy `/host` route, lobby, QR code, four detailed characters, die, and turn overlay implemented.
- Fixture-driven dice and movement sequence completes a full player rotation.
- Typed Socket.IO client and room-state hook added for integration.
- Added a bright Three.js world with layered terrain, a stone path, trees, rocks, flowers, moving
  clouds, daylight, fog, shadows, and a floating die focus.
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
- Replaced the circular overview with an open visible trail, active-player follow camera, hidden
  distance, long meadow, route-side trees/rocks/flowers/clouds, a start gate, and a moving dice
  plaza. The logical last-to-first edge remains invisible for safe long-session wraparound.

## Blockers and handoffs

- Physical iPhone/Android motion and intended demo-network testing remain outstanding.

## Verification

- Combined Ryan/Jack integration: 59 Vitest checks plus 10 motion checks pass, alongside typecheck,
  lint, formatting, and production build. The static-host tests use a Windows-safe directory
  junction to retain path-escape coverage without elevated file-symlink permission.
- Browser rehearsal verified pass-by shopping, a four-coin Boots purchase, exact continuation to
  space six, Boots bonus movement, another shop, round-end Hot Potato, clockwise passing, and
  eight/two-coin rewards. Jack's controller-stop fix and iPhone guidance are preserved.

- Duel tests cover scoring, parries, clashes, deduplication, cooldowns, spectator rejection,
  timeouts, forfeits, restart cancellation, and four-controller rotations.
- Separate browser rehearsal verified joins, two moves onto space three, a successful guard,
  two clean hits, a 2–0 result, three-space penalty, and normal board-turn resumption. Physical
  phone sensitivity remains unverified pending iPhone/Android testing.

- `pnpm check` passes.
- Woodland pass: live six-space roll from tile 23, controller submission lock, overhead dice, and
  following-camera movement checked in the desktop browser. Presentation-laptop frame rate still
  requires hardware testing.
- 37 Vitest checks and 10 motion tests pass across the integrated workspace.
- Production Vite build succeeds with the host isolated into a lazy-loaded chunk.
- Browser-tested the detailed lobby world, character placement, a six-space dice/movement turn,
  turn advancement, and updated player positions at a 944-by-804 viewport.
- No browser console errors were observed.
- Browser-tested the live-mode disconnected state with a configured unavailable server: the host
  displays a clear error, keeps the board rendered, and disables Start.
- Browser-tested a real controller join, server-generated roll, four-tile movement, automatic turn
  advancement, and host-page refresh with the same authoritative room and position.
- Browser-tested the follow camera through four live turns to space 12; the active character, local
  floating die, nearby scenery, forward trail, and fogged horizon stayed framed throughout.
- Reworked the die with six complete inset-pip faces, rounded layered materials, camera-readable
  result poses, hover motion, and roll lighting; removed its pedestal entirely.
- Added a readable 3D start sign, detailed route rims, fuller tree canopies and roots, shrubs, and
  mushrooms. Browser-tested a live six-space roll and camera move from space 12 to space 18.
- Recorded automated and desktop-browser evidence directly in the demo checklist. Physical phone,
  venue-network, HTTPS deployment, recording, and release-tag proof remain intentionally open.
- Replaced the oversized host dashboard with a compact flat broadcast UI: no gradients, smaller
  typography, solid controls, a concise turn summary, and no technical explainer card.
- Reduced the 3D die to roughly half scale and moved it high beside the camera framing so it remains
  readable without covering the character or route. Browser-checked both lobby and active-game
  layouts with no console errors.
- Tightened the turn camera around the active character, anchored the animated die directly above
  that character throughout movement, and strengthened the active marker with a pulse and local
  light.
- Removed the accidental last-to-first decorative tube closure that drew long straight lines
  through the open board, while preserving logical wraparound in the authoritative board model.
