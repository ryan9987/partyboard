# Ryan status

Ryan or Ryan's agent owns this file.

## Current

- Ryan-approved Fishing reliability/orientation pass on `fix/fishing-controls-and-motion-guide`.
  Reproduced early-reel failure in regression tests before fixing it. Casting/waiting no longer
  expose an active Reel button or lose a fish on an early action; gentle edge-triggered wrist
  gestures, setup calibration, 250ms tilt hold, a 2.4s bite window and ±0.75 catch tilt tolerance.
  Sustained extreme tilt still breaks a line; terminal feedback/catch animation holds 1.2s.
- Shared `FISHING_RULES` align server/phone/host cues. Named REEL NOW scorecards, larger bite
  bobber and a green meter band matching the catch threshold. Four-player tests cover independent
  catches, moderate tilt, early input, late reaction, retries, duplicates and recasting.
- Code-native portrait/front and wrist-lift diagrams in the phone lobby, all five mini-game
  setup screens and expandable active-phone help. Four-second setup precedes the unchanged final
  3–2–1; no new Start click. Touch-mode text explicitly says to tap; lobby explains motion access.
- Browser: live Fishing cast→wait→bite→reel earned 100 points. Waiting action disabled, catch
  feedback visible, compact 320px/390px phone layouts and final host setup diagram inspected.
  Host/controller error logs empty. Real Socket.IO regression also casts, refreshes mid-cast,
  reels for 100 points, pays rewards once and automatically returns to the correct board turn.
- Verification: `pnpm check` passes with 134 Vitest + 10 motion tests, types/lint/format/build.
  No dependencies or new wire fields. Physical phone gesture tuning and Render rollout remain
  unverified. Main push authorized; server redeploys still require a fresh room.

- Seamless-round/controller-focus integration requested by Ryan; supersedes manual starts/results.
  Default automatic 3–2–1 into all six round games and duels, named results and automatic trail
  return. Connected turns/shops remain untimed. Optional authenticated manual operator mode retained.
- Fixed command-level auth errors erasing saved phone sessions, competing-tab session handoff,
  immediate disconnect forfeits, and refreshed mini-game input sequences. Eight-second activity
  reconnect grace preserves arrows/score/cooldowns; expiry, restart and disposal are guarded.
  Rooms remain in-memory and cannot survive process restarts/deploys; no database added.
- Close frontal Archery camera, named large targets, clear reticles and matching visual/scoring
  radius. Finish after all final arrow flights. Minimal owner-only phone controls, collapsed motion
  help/touch-only switch, and matching blue snowflake/amber boot/green leaf-shield SVG symbols.
- Browser rehearsal: two live round cycles automatically returned to turns 3 and 5; visible 3–2–1
  intro and named shared winners; scored 53 points, refreshed the 390px phone, preserved two arrows
  and fired another. Shop purchase/remaining travel works at 320px. Four-player Archery art checked.
  Fresh host/controller browser error logs empty. Physical iOS/Android sensors remain untested.
- Safari has no exposed native Shake to Undo switch; blur join input, retain tap/tilt alternatives
  and truthful help. This does not promise to suppress the iOS system prompt without Settings.
  Verification: `pnpm check` (125 Vitest + 10 motion tests), types, lint, format and production build.
  Render rollout/hardware testing remains separate from the requested main push.

- Smooth-travel/per-space-reward integration requested by Ryan, including main push. Continuous
  render-loop path sampling, rounded bends, exact timed arrivals, distance-based gait, blended
  limb poses/turns, shared camera/die focus and soft arena/wrap reveals. Instanced assets retained;
  scratch vectors/buffers reused. Travel pace is 420 ms per space; no new dependencies/physics.
- Server awards one coin per actual forward crossing, including shops, Boots and Start. No extra
  landing bonus or coins for freezes, penalties, duplicates or stale movement after restart.
  Browser rehearsal: first three spaces 6→9 coins; Boots purchase 9→5; five-plus-two-space roll
  to space 10 yields 12 coins. Inspected successive travel frames; fresh console errors empty.
- Automated coverage includes exact arrivals, continuity, 30/60/120 Hz equivalence, bounded lap
  wrap, crossing ticks, shop continuation, Boots, duplicates, restart, penalties/cap and real sockets.
  Final `pnpm check` passes: 114 Vitest + 10 motion tests, types, lint, format and production build.
  Presentation-laptop FPS, physical phones and the eventual Render rollout still need verification.

- Integrating Jack's `feat/visual-overhaul` and latest server-lane verification notes at Ryan's
  request, preserving relaxed pacing and visible economy. One documentation-only conflict was
  resolved by retaining both of Jack's status sections. Full check passes: 100 Vitest + 10 motion
  tests, typecheck, lint, formatting and production build. Fresh GLB scene loads without errors.
  Main push authorized; Render rollout and physical-device performance are not yet verified.

- Relaxed pacing on `feat/relaxed-pacing-and-player-coins`: connected turns and market visits
  are untimed. Every duel/round-game intro and result waits for authenticated host Start/Continue.
  Gameplay clocks and disconnect recovery remain. Mini-game time rebases on actual start.
- Deliberate on-turn power-up selection disables motion/touch rolls while choosing or waiting
  for confirmation. Server-authored actor/target/effect notices, reconnect retry with the same
  request ID, and duplicate-use protection. Compact per-player coin ledgers on host and phones.
- Verification: `pnpm check` passes, 92 Vitest + 10 motion tests. Includes ten-minute untimed
  waits, all five rebased rounds, potato/duel stages, stale/unauthorized Continue, reconnect,
  restart and item input latches. Browser four-player shop purchases/coin synchronization,
  320/390px shop layouts, 430px controller, manual duel/Potato instruction/result transitions,
  exact 8/2-coin rewards, and on-turn Boots selection/activation notices verified locally.
  Fresh host/controller console error logs are empty. Preview proof is in the task's outputs folder.
- Ryan requested integrating this feature into main and pushing it to GitHub. The Render rollout
  has not been verified; physical-device and venue network rehearsal remain necessary.

- Demo hardening pass: full four-controller six-game rotation plus sword duels; targeted
  Archery (three arrows, 157 points) and Balance tilt replays; actual narrow iframe layouts
  at 320/390/430px. Shop purchases, Boots, Shield and targeted Frost exercised in browser.
  Fresh live host/controller error logs empty. 78 Vitest + 10 motion tests pass before merge.
- Refined humanoid proportions, textured clothing, hands/face/hair; detailed merchant stall
  and product models. Fixed device-clock cues, flick/tension interference, mobile overflow,
  repeated purchases, action cooldown feedback and floating missed arrows.
- Physical iPhone/Android gesture/permission and venue-network checks remain required.

- Added Balance, Fishing, Dodge, Archery and Rhythm to the round-end rotation on
  `feat/woodland-minigames`. New wrist attachments hold props; Hot Potato now passes hand-to-hand.
  Clean matching HUD/controller cards, locally authored arenas and visible cast/arrow actions.
  Contract and rehearsal instructions: `docs/MINIGAMES.md`.
- Verification: `pnpm check` passes (75 Vitest + 10 motion tests, typecheck, lint, format, build).
  Real Socket.IO test exercises mini-game input, payout and board resumption. Browser inspected
  all six art scenes and completed a two-controller Fishing cast/bite/catch, 100-point shared score,
  Ryan's winner result, balances 15/9 and turn-3 board resumption; live host/controller error logs empty.
  Physical-device gesture/layout tests remain pending; browser viewport override was ineffective.

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
