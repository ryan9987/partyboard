# Ryan status

Ryan or Ryan's agent owns this file.

## Current

- October 25 sword-fight retirement: no occupied-space combat, knockback, arena, controller,
  lesson, rehearsal choice or wire command. Strict snapshots reject the retired phase/field.
  Shared-space regression covers eight co-located players, normal round rotation and coins;
  bot co-location and reconnect-safe round instruction coverage remain in place.
- Shared wrist-motion helpers and round overlay classes now have game-neutral names. All five
  retained games, shops, items, motion/touch alternatives and trail victory are unchanged.
- Full gate: 198 Vitest +11 motion tests, types, lint, formatting and production build passed.
  All five compact motion lessons and the retained gameplay scenes were visually inspected.
  Refreshed host/phones and a new room are required after deployment. Submission story/tags
  are in DEVPOST.md; the revised 120-second video and seven PNG screenshots stay outside Git.

### Previous release history

- Eight-player motion-first presenter release: shared eight-seat/color contracts, matching
  outfits/portraits, grounded compact trail lineup, adaptive arena cameras, unobstructed archery
  targets, six duel spectators, and a two-row host ledger with separate coin/score values.
- Host-only lobby Demo mode fills to four with identified novice bots. They play all activities,
  shop/use items/roll automatically through validated commands, pause when phones disconnect,
  survive host resume, and clean up on finish/restart/dispose. Actual dice/scoring are unchanged.
- Motion onboarding and gesture prompts are primary. Rolls use two gentle peaks; Archery aims
  by tilt and releases by a settled-wrist flick. Touch controls are explicitly available as
  fallbacks. Phone stage changes reset scroll position. Existing iOS Undo guidance is retained.
- Visual checks: lobby, centered start gate, board, market, all six activities, instructions,
  and results; four/eight-player layouts at 1280×720. Fixed outer target tree occlusion,
  cropped archers/spectators, coin/score overlap and eight-seat instruction/footer collisions.
  Compact phone lessons checked for all games; touch layout checked at 320/390/430px.
- Automated coverage includes five rotations over real sockets with four and eight controllers,
  all five round games with eight participants, bot commands/security/lifecycle, actual visitor
  wins through normal inputs, a complete demo match, three-arrow flick gating and two-peak rolls.
- Final release gate: `pnpm check` (types, lint, formatting, 207 Vitest +11 motion tests, build).
  Physical phone sensors, venue Wi-Fi and measured presentation-laptop FPS still need rehearsal;
  desktop visual/automated checks are not physical-device certification. See PRESENTER_DEMO.md.
- This release includes the previously local-only centered start-gate fix described below.

- Start-gate alignment pass on `fix/center-start-gate`: share the actual Catmull–Rom trail
  centerline, place the gate halfway through the first segment and rotate it perpendicular
  to travel. Both post footings clear the path; no fixed world-Z offset or camera illusion.
- Extend posts/lift the intact header 0.65 for character headroom without stretching lettering.
  Reuse the detailed timber asset/material; one cloned static geometry with cleanup, no new
  assets, dependencies, per-frame placement work or changes to traversal/server/controller.
- Browser visual passes: fresh four-player lobby, ready-to-roll, multiple first-step crossings
  and later-turn board camera. START remains readable, path passes through the opening and
  characters fit underneath. Five regression tests cover center/tangent, both footings,
  alternative approach directions, ground contact, headroom and unchanged header proportions.
- Local visual fix only; this request did not ask for a main push or production deployment.
- Full `pnpm check` passes: types, lint, formatting, 189 Vitest +10 motion tests and production
  build. Fresh preview error log empty; existing large-3D-chunk warning remains unchanged.

- CI follow-up: reproduced the failed release's exact `pnpm check` command and confirmed the
  GitHub annotation points to an unused `MinigameState` import left by Dodge removal. Removed
  that import only; lint and CI enforcement unchanged. Full `pnpm check` now passes, including
  lint, formatting, 184 Vitest +10 motion tests, types and build. Main releases must use the
  full gate, not a subset. No gameplay changes or dependencies.

- October 25 instruction-review follow-through: larger 16px host steps/goals and 14px touch
  guidance in 760px cards with integrated game titles. Six host lessons fit without scrolling
  at 1280x720. Lobby objective and Start button fit together without scrolling too.
- Shared `gameLessons.ts` removes jargon and states every winning rule, including Archery's
  three-arrow total, Rhythm's center marker, Hot Potato elimination and duel knockback.
  Phone lessons/help match Touch/Motion with exact button labels and correct diagrams.
- Touch-aware Fishing cues no longer ask for phone movement; Balance corrections follow actual
  player lean. Completed duels/Hot Potato no longer show obsolete attack/pass prompts.
- Browser checked all 36 phone lesson combinations (six games × two modes ×320/390/430px):
  no horizontal overflow, wrong-mode steps or motion requirements in touch lessons. Live
  two-phone Fishing showed touch-first setup, automatic start, successful cast/reel and shared
  touch help. No physical permission/sensor certification or measured device FPS claimed.
- Added 14 lesson regression cases; complete suite 184 Vitest +10 motion tests, typecheck,
  formatting and production build pass. Existing large 3D bundle warning remains. No dependencies.
- Ryan requested merging all pending overlay/finish/economy/instruction work into main and
  pushing it. Release verification follows below; older “local only” notes are historical.

- October 25 terminal-trail/phone pass on `feat/woodland-overlays`, preserving the prior overlay
  work below. Ryan explicitly authorized integrated server/controller changes; recorded in
  `INTEGRATION_NOTES.md`. No edits to Jack's status, new dependencies or external artwork.
- Dodge is removed from the shared enum, random bag, server runtime, phone input, 3D arena,
  instructions and preview options. Five round games remain plus occupied-space sword duels.
- First player at space 47 wins. Overshoots and Boots clamp at finish; no exact roll. Terminal
  board metadata, original finish arch, validated snapshot winner, persistent named host/phone
  results and host-only Play again. Finish cancels timers; late events cannot reopen the match.
- Economy: start 6, one coin per completed forward turn (zero per space), mini-game prizes 4/1.
  Shared constants, unchanged shop prices, no skipped/interrupted/duplicate/backwards income.
- Phone uses a clear primary Roll, secondary optional pack, owner portrait/coins and visible
  Touch/Motion setup. Original animated lessons have readable labels, numbered steps and goals.
  Seven seconds of setup + final 3–2–1; connected turns and shops remain untimed.
- Live browser: eight six-space rolls through all shops ended at 47 with 14 coins, named winner,
  refresh-safe result and replay reset to start/6. Two-player Fishing still cast/reels (100 points),
  automatically returns and pays 4/1 (7/7 → 11/8). Error logs empty on fresh host/two phone tabs.
- Visually inspected all six remaining lessons. Real controller iframes at 320/390/430px had no
  horizontal overflow. Tightened intro controls so the 320px lesson includes its goal/touch cue.
- Typecheck, formatting check, 170 Vitest + 10 motion tests and production build pass. Coverage
  includes four-player victory, exact/overshoot/Boots, reconnect/replay, late events, final phone
  pending-roll cleanup and reduced payouts. Existing large 3D bundle warning remains.
- Local only: no main push/deploy requested. Physical sensors, venue-network/human balance and
  presentation-device FPS still need rehearsal. Refresh clients/create a new room when deploying.
  Existing submission footage predates these rules and should be updated before submission.

## Previous passes (historical rules and verification)

- Woodland overlay redesign on `feat/woodland-overlays`: pine/ivory trail cards, rounded system
  type, original character portraits, compact turn card and branded room header. One stable
  player rail replaces duplicated standings and carries coins, effects and arena scores.
- Matching market, animated lessons and shared named-winner/draw cards across all seven arenas.
  Five market items fit at 1280x720. Long labels truncate without losing accessible names;
  coin/score values remain separate. Balance fall timing and crossed-swords animation preserved.
- Only Ryan-owned host/app/presentation paths changed; no server, controller, motion or protocol
  changes, dependencies or external art assets. CSS is host-scoped and uses no gradients or blur.
- Browser-inspected all seven active arenas, instruction/result cards, board/lobby/market and
  320/390px iframe layouts. Live browser smoke: join, start, roll, +3 travel coins (6→9), Clover
  purchase (9→6), inventory/board return and visible activation/effect feedback. Physical sensors
  and presentation-device FPS remain unverified; art fixtures are not multiplayer proof.
- Added 15 player-rail regression cases: five game scores, phase return, separate coins, fishing
  cues, arrows, ties, disconnects, Hot Potato and delayed Balance winner reveal. Typecheck,
  production build and 166 Vitest + 10 motion tests pass. Existing large 3D chunk warning remains.
  Work is local; this request did not authorize a main push or deployment.

- Full game/economy pass on `feat/balanced-market`, based on the previous local tutorial commit.
  Frost costs 10, slows by two (minimum one), never skips a turn, and gives shared thaw protection
  through the following unhindered roll. Shield blocks grant protection too. Different attackers
  cannot bypass it. One successful power-up per turn persists through refresh; rejects cost nothing.
- Five-item catalogue: Clover 3, Boots 4, Shield 4, Compass 10, Frost 10. Clover raises the displayed
  die to at least four; Compass selects a server-validated 1–6 and previews adjusted landing spaces.
  Roll buffs do not stack. New status fields and Compass-only dieValue are covered by strict schemas.
- Wider readable host shop, unaffordable/full-pack/solo explanations, matching Clover/Compass glyphs
  and physical stall stock. Equipped effects remain visible after the pack empties. Host announces
  actual roll versus movement; phone stays focused on its owner and controls. Solo Frost is not sold.
- Verified live Clover raw 1→4, Compass 2 and controller refresh (space 16→18), then two-controller
  Frost: Jack retained his turn, rolled 1, moved 2→3 and earned 12→13 coins; thaw protection stayed
  visible and round/board resumption continued through turn 7. Checked 320/390px phone layouts and
  all seven active art scenes. Fresh host/phone browser error logs empty. Art fixtures are not proof
  of physical sensors; the live economy checks used real browser controls and a scripted test server.
- Final `pnpm check`: 151 Vitest + 10 motion tests, types/lint/format/build pass. Four-player anti-chain,
  payouts, ordering, duplicates, invalid choices, refresh, solo eligibility and restart covered.
  No dependencies or external assets added. Existing 3D bundle warning remains. Review/next steps in
  `docs/PLAYTEST_REVIEW.md`: overall match objective, human balance/device playtest and measured FPS.
  Saved locally; no main push/deploy requested. Production needs coordinated client refresh/new room.

- Animated-instruction/Balance pass on `feat/animated-game-guides`. All six round games plus duels
  have lightweight phone-to-game SVG/CSS demonstrations, steps, goal and touch alternative.
  Four-second setup + automatic 3–2–1 now applies consistently to Hot Potato and duels too.
- Balance tumbles the actual character off the log (flailing limbs, water droplets/ripples).
  Server timestamps make the 1.4s trajectory snapshot/reconnect-safe and frame-independent.
  Winner card waits 1.1s so the fall is visible; server result/payout happens immediately.
- Server ends with one survivor: a two-player first fall decides the game, while four players
  continue after earlier falls. Same-tick survival scores no longer incorrectly tie the winner.
  Simultaneous final falls, time-up ties, forfeits, duplicate payouts and board return are tested.
- Browser checked all seven tutorials and replayed fall/splash frames; fixed Archery labels
  bleeding through instructions and tutorial overflow during the countdown. Two live two-phone
  rounds automatically started, ended early, awarded Ryan +8 / Jack +2 and resumed the board.
  One controller used the real 390px iframe. Test host error log empty; physical motion untested.
- Full checks pass: 141 Vitest + 10 motion tests, types/lint/format/production build. No added
  dependencies, external assets or wire fields. Work remains local; this request did not ask
  for a main push. Production rollout and physical phone testing are separate.

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
