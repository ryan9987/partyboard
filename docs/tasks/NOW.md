# Current task board

## Animated mini-game instructions and Balance falls

- [x] Animated phone-to-game demonstrations for all six round games and sword duels.
- [x] Automatic four-second setup + final 3–2–1, with touch instructions and reduced-motion text.
- [x] Log tumble/flailing limbs, splash/ripples and unobstructed fall before the winner reveal.
- [x] Finish Balance with one survivor; preserve four-player play, simultaneous falls and timeout ties.
- [x] Regression coverage for same-tick winner selection, forfeits, refresh, payouts and board return.
- [x] Browser-check all seven lessons, inspect fall frames and complete live two-controller rounds.
- [ ] Physical-device / venue-network rehearsal and production rollout of this change.

## Fishing reliability and phone setup

- [x] Ignore early reels; separate casting from bite actions and prevent backswing repeats.
- [x] Gentle Fishing-specific gestures, setup calibration and wider timing/tilt tolerance.
- [x] Shared authoritative rules, state-specific button labels and visible host/phone bite cues.
- [x] Portrait/front and wrist-lift diagrams in lobby, mini-game setup and expandable phone help.
- [x] Four-second instruction setup followed by automatic 3–2–1; no new host clicks.
- [x] Regression tests for early/late reels, four-player catches, line break and gesture rearming.
- [ ] Physically tune gestures on iPhone/Android and verify the Render deployment.

## Seamless rounds and controller focus (supersedes manual-stage default below)

- [x] Default automatic 3–2–1, named winners and automatic board return; untimed shops/turns retained.
- [x] Session-preserving auth recovery, explicit tab handoff and eight-second activity grace.
- [x] Refresh-safe mini-game sequences without replenishing arrows/score/cooldowns.
- [x] Close Archery camera, named large targets, clear reticles and scoring-aligned target radius.
- [x] Consistent SVG/color power-up symbols, host standings and minimal owner-only phone controls.
- [x] Dismiss join text-field focus; retain touch-only mode and truthful iOS Undo guidance.
- [ ] Physically test Safari/Android reconnection and gestures on the actual demo network.

## Continuous animation and per-space travel rewards

- [x] Replace tile-target jumps with a continuous, timed path and shared camera/die focus.
- [x] Blend walk/idle/action poses and shortest-angle turns; preserve instanced scenery.
- [x] Reuse frame scratch buffers, ease passes/casts, and soften scene/wrap transitions.
- [x] Award exactly one server-owned coin per forward space, including markets and Boots.
- [x] Test movement continuity/frame independence, caps, duplicates, restart and no penalty rewards.
- [ ] Verify presentation-laptop FPS and physical-phone motion on the venue network.

## Relaxed pacing and economy visibility

- [x] Remove default shop and connected-player roll deadlines; keep disconnect recovery.
- [x] Wait for explicit host Start/Continue on duel and mini-game instructions/results.
- [x] Add deliberate on-turn item selection with shake suppression and authoritative effect notices.
- [x] Keep every player's coin count visible on host and phone with a compact matching ledger.
- [x] Cover untimed waits, rebased clocks, stale/unauthorized continues, restart and input latches.
- [ ] Rehearse on physical phones and deploy the new build to partyboard.club after approval.

## Phase 6: woodland mini-game collection

- [x] Add Balance, Fishing, Dodge, Archery and Rhythm with server-owned scoring.
- [x] Rotate the six round games without repeats inside each bag.
- [x] Attach acorn, rod, bow and sticks to animated hands; show casts and arrow flights.
- [x] Add clean matching host and phone game interfaces with touch alternatives.
- [x] Test scoring, cooldowns, duplication, forfeits, tied prizes, restart and board resumption.
- [x] Browser-inspect all art scenes and complete a live two-controller Fishing catch.
- [x] Complete a four-controller six-game rotation and targeted Archery/Balance replays.
- [x] Verify real controller layouts inside 320/390/430px frames; fix horizontal overflow.
- [x] Harden clock alignment, motion/touch behavior, shop double taps and prop placement.
- [ ] Tune gestures and verify small-screen layout on physical iPhone and Android.
- [ ] Rehearse the six-game rotation on the actual venue network.

Occupied-space sword duels and round-end Hot Potato are approved, along with the shop economy.

## Phase 0: joint foundation

- [x] Confirm the project name and GitHub repository destination.
- [x] Assign Ryan as host/board and integration owner.
- [x] Assign Jack as server/controller and motion owner.
- [x] Assign Ryan as the sole editor of shared manifests and `packages/protocol`.
- [x] Review and implement `docs/PROTOCOL.md` for the initial integration contract.
- [x] Keep private session IDs out of public snapshots.
- [x] Scaffold the pnpm packages and lock exact dependency versions.
- [x] Add formatting, linting, test, and type-check configuration.
- [x] Add a CI workflow that runs the full repository check.

## Phase 1: parallel foundations

### Ryan — host/board lane

- [x] Define and validate a winding 32-tile route with safe wraparound.
- [x] Test wraparound traversal.
- [x] Render board tiles from the board definition.
- [x] Render four placeholder player pieces.
- [x] Animate a supplied dice value.
- [x] Animate a supplied movement path.
- [x] Build a host lobby against a typed fixture.
- [x] Render the route as a forward journey with distance fog and a following camera.

### Jack — server/controller lane

- [x] Create and join an in-memory room.
- [x] Issue private player session IDs.
- [x] Store the controller session ID locally.
- [x] Implement the authoritative phase machine.
- [x] Validate and deduplicate roll requests.
- [x] Generate dice values on the server.
- [x] Implement the touch Roll button.
- [x] Build motion permission and shake detection.

## Phase 2: integration

- [x] Replace the host fixture with live room snapshots.
- [x] Connect dice events to the host animation.
- [x] Connect movement events to the correct piece.
- [x] Confirm the controller disables after submission.
- [x] Confirm the server advances turns on its own timers.
- [x] Add reconnection and active-player timeout behavior.

## Phase 3: deployment and proof

- [ ] Deploy an HTTPS build.
- [x] Generate and validate the controller QR code from environment configuration.
- [x] Add an in-app preflight for HTTPS, server connection, and controller readiness.
- [x] Complete the automated and desktop-browser portions of the demo checklist.
- [x] Polish the floating die, start marker, route tiles, and world dressing for presentation.
- [ ] Test iPhone motion permission.
- [ ] Test Android motion behavior.
- [ ] Complete the full demo checklist.
- [ ] Tag a known-good demo version.

## Phase 4: occupied-space sword duel

- [x] Detect completed landings on occupied non-start spaces on the server.
- [x] Play a crossed-swords announcement and transition to a woodland arena.
- [x] Add validated, authenticated, deduplicated swing/guard commands.
- [x] Resolve attacks, parries, clashes, scores, draws, forfeits, and action cooldowns on the server.
- [x] Provide phone motion inputs and equivalent touch buttons.
- [x] Move the loser back up to three spaces and resume the interrupted turn order.
- [x] Test scoring, abuse rejection, timeout, restart, and four-controller rotations.
- [ ] Tune physical-device gesture thresholds on iPhone and Android.

## Phase 5: round games and shops

- [x] Extend the route to 48 spaces with recurring markets.
- [x] Pause movement at a passed market, then resume the same roll.
- [x] Add coins, a three-item inventory, and authoritative purchases.
- [x] Add Frost Charm, Trail Boots, and Leaf Shield with target/effect validation.
- [x] Run Hot Potato after each full round and award coins exactly once.
- [x] Add a woodland acorn arena, motion passing, and touch fallback.
- [x] Verify rules, timers, disconnects, rewards, and browser screens.
- [ ] Verify physical phone motion and venue-network pacing.
