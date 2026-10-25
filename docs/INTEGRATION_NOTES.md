# Integration notes

### 2026-10-25 — Instruction review follow-through and requested main release

- Ryan requested applying the review improvements and pushing the complete pending work to main.
  This includes the existing overlay/terminal-trail/economy work and the necessary phone-control
  presentation changes in Jack's lane; no unrelated changes or edits to Jack's status.
- Increase essential host lesson text from 12px to 16px and improve helper text. Replace gaming
  jargon, state every winning rule, match action labels and show mode-specific phone lessons/help.
- Touch diagrams show taps rather than motion. Active Balance direction follows actual lean;
  Fishing feedback no longer asks touch players to move their phones. No scoring/timing changes.
- Shared lessons have automated content coverage; dev-only phone fixtures inspect every mode
  without room commands or permission prompts. Preserve four-player, touch and motion behavior.
- New lobby objective states first-to-finish. No dependencies or external assets added.

### 2026-10-25 — Ryan-approved terminal trail, economy and phone clarity

- Ryan requested complete Dodge removal, a first-to-finish match, reduced travel income and
  clearer phone/instruction UI. This authorizes necessary server/controller/tests in Jack's
  lane alongside host, board and protocol changes. No unrelated work or Jack status edits.
- Default trail terminates at tile-47; overshoots clamp, first arrival wins, no exact roll.
  Add validated snapshot `winnerId`, persistent named results and host-only Play again.
- Retire Dodge across enum, rotation, runtime, controls, arena, lessons and fixtures. Five
  round games remain including Hot Potato; sword duels remain separate.
- Replace per-space income with one completed-turn coin; round prizes 4/1, starting balance 6
  and prices unchanged. Centralize reward values and preserve idempotence/recovery.
- Original woodland phone design uses a primary Roll, optional pack, explicit Touch/Motion
  setup and numbered illustrated lessons. Ten-second intro = seven setup + final 3–2–1.
  No new dependencies, borrowed Nintendo art, production deployment or main push this turn.
- Coordinated release needs refreshed clients/new room. Historical submission video/script
  still show the old activity/economy and must be refreshed before being used as current footage.

### 2026-10-24 — Economy review and anti-freeze balance

- Ryan requested a full game pass, more ways to spend coins, and a fix for repeated shop/freezes.
  This authorizes the required server, controller and test integration in Jack's lane; no unrelated
  work or edits to Jack's status file are included.
- Replace turn-skipping Frost with a -2 next-move slowdown (minimum one space), raise its price,
  grant thaw protection through the victim's next normal roll, and enforce one power-up per turn.
- Add Lucky Clover (roll at least four) and Trail Compass (choose an exact die value). Prices,
  eligibility, purchases, movement, per-space coins and effect use remain server-owned. Update
  strict schemas and all host/phone consumers in the same change. Preserve untimed shopping,
  touch alternatives, locally authored symbols and automatic mini-game transitions.

### 2026-10-24 — Animated instructions and Balance last-survivor finish

- Ryan requested animated how-to-play splashes before each mini-game, visible log falls, and an
  immediate winner when the opponent falls. This explicitly requires the corresponding server
  rules and regression tests in Jack's lane; no unrelated server/controller behavior is in scope.
- Balance ends with one survivor (not the first elimination in a four-player round). Fall times
  use the existing server-owned `actionAt` field; the host animates from snapshots without
  client-side scoring. Simultaneous final falls retain a survival-time draw.
- All seven introductions retain automatic countdowns and touch alternatives. No dependencies,
  external assets, new protocol fields or edits to Jack's status file are needed.

## 2026-10-24 — Ryan-approved Fishing reliability and phone-orientation guide

Ryan requested fixing difficult fishing motion/reeling, clear diagrams explaining phone orientation
before play, verification and a main push. This explicitly authorizes the corresponding server,
controller, shared rules and regression-test integration. Preserve automatic round countdowns,
untimed shops/board turns, touch fallbacks, artwork and Jack's unrelated work. No dependencies added.

## 2026-10-24 — Ryan-approved seamless rounds and controller recovery

Ryan explicitly requested server/controller recovery fixes, automatic three-second mini-game
countdowns/results, clearer Archery framing, consistent power-up symbols/colors, a minimal phone
controller and a verified push to main. This authorizes corresponding cross-lane integration and
tests. Shops/connected board turns remain untimed. Safari cannot reliably suppress iOS Shake to
Undo; dismiss text input focus after joining and retain motion/touch alternatives. No database,
dependency or unrelated Jack-owned work is included.

## 2026-10-24 — Ryan-approved smooth animation and per-space coins

Ryan requested smoother travel/animation while preserving performance, one coin for every space
crossed, and pushing the verified integration to main. This authorizes the corresponding server
economy/test changes alongside Ryan's rendering work. No new dependencies or protocol fields.

## 2026-10-24 — Integrate Jack's visual overhaul into current main

Ryan requested pulling Jack's features and pushing the integrated result to main.
Integrated `origin/feat/server-controller` at `61dd3f1` (verification notes) and
`origin/feat/visual-overhaul` at `aabb83d` (Blender scenery, typography and dice orientation).
The only textual conflict was the independent additions to `docs/status/JACK.md`; both original
sections are preserved. Untimed turns/shops, manual stage continuation, item-use feedback and
the persistent coin ledger are retained. No dependencies or lockfiles changed.

`pnpm check` passes with 100 Vitest + 10 motion tests, typecheck, lint, format and production build.
The fresh local host loads the committed GLB without console errors. Physical-device rendering
and the Render deployment still require verification after release.

## 2026-10-24 — Ryan-approved relaxed pacing and visible economy

Ryan requested removing rushed shop/turn timers, clearer on-turn power-up use and effects,
and a clean coin counter for every player. This explicitly requires coordinated server,
controller, shared protocol, and host integration. Work is isolated on
`feat/relaxed-pacing-and-player-coins`; Jack's unrelated files and status remain untouched.
Shops and connected board turns become untimed. Instruction/result screens wait for an
authenticated host Continue action; active competitive game clocks and disconnect recovery stay.

## 2026-10-24 — Full demo hardening and main integration

Ryan requested the full gameplay/mobile/visual pass, fixes across all game lanes, more natural
character detail, detailed shops, and committing/pushing the integrated result to main.
These are explicitly authorized integration edits, including controller/server tests.
The new snapshot server-time anchor and optional retained Archery shots are additive contracts.
Jack's latest two commits (`6133d4e`, `00fd3f7`) contain verification notes and isolated temporary
demo builds; they are included in this integration. No unrelated work is discarded.

## 2026-10-24 — Ryan-approved five-game integration

Ryan explicitly requested Balance, Fishing, Dodge, Archery and Rhythm, including clean UI,
held equipment, cast animations and the Hot Potato attachment fix. This authorizes the
corresponding server/controller integration and tests across the original ownership split.
Jack's unrelated changes and status file are preserved. See `MINIGAMES.md` for the shared contract.
Work is isolated on `feat/woodland-minigames`.

Use this file for changes one lane needs from another lane or from a shared contract. Resolve entries during an integration checkpoint instead of making surprise cross-ownership edits.

## Open requests

No open cross-lane requests at this checkpoint.

## Resolved requests

### 2026-10-24 — User-approved round games and economy

- Ryan requested round-end Hot Potato, coin rewards, pass-by shops, power-ups, and a longer map.
- Integration touches shared protocol/board, server state machine, phone controller, and host world.
- `docs/PARTY_ECONOMY.md` defines timings and edge cases. Additional round games remain future work;
  the round scheduler currently runs Hot Potato, with randomized holder/fuses.
- Ryan also requested merging all project work, including Jack's latest remote branch, into main.

### 2026-10-24 — User-approved sword duel integration

- Ryan requested occupied-space sword combat, phone motion, an arena, and loser displacement.
  This supersedes the original mini-game scope restriction for this feature.
- The integration pass changed the server game authority, shared protocol, phone controller,
  host arena/characters, and affected tests. Other mini-games remain deferred.
- `DUEL` and `duel.action` add validation, session authorization, duel IDs, deduplication,
  authoritative hit timers, and shared action recovery.
- `docs/SWORD_DUEL.md` records rules, timings, penalties, disconnects, and deterministic rehearsal.
  Jack should review gesture thresholds on real phones. No messages were sent to Jack's agent.

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
- Resolution: Added the validated `room.host.resume` command. The browser stores its private host
  credentials in session storage, and the server authenticates a replacement connection before
  sending the current snapshot. A live browser test preserved room `5XRN`, turn 2, and tile 4 across
  a full host-page reload.

### 2026-10-24 — Connect Ryan's host to Jack's live server

- Requested by: Jack's agent.
- Owning area: Ryan — host, shared networking, protocol, shared configuration.
- Blocking or non-blocking: Blocks the complete visual board demo; the text host and phone controllers can exercise the live server independently.
- Requested contract or behavior change: Replace host fixtures with `room.create`, authenticated start/restart, snapshots, dice, and movement events. Validate all consumed browser payloads in the shared adapter. Add a jointly approved read-only host reattachment command; the current protocol has no way for a refreshed host to subscribe without restarting the game. Consider an explicit turn identity on roll requests to reject an original request delayed into a later turn, and agree on retryable error codes before controllers unlock rejected submissions.
- Reason: Server and controller now implement the committed schemas, without inventing events or fields. Reconnecting movement snapshots contain the destination; live hosts should use movement events for animation and snapshots for recovery. When no connected next player exists, the server pauses in `TURN_END` with null current player and emits no `turn.ended` until a next player exists; the schema requires a non-null next player. Turn numbers remain monotonic across restart. Session memberships remain reserved for the room lifetime.
- Proposed acceptance check: Four real phones complete five rotations on the intended HTTPS demo network, including refresh, motion denial, active-player disconnect, and host recovery. Ensure snapshots do not interrupt event-driven animation. Configure Vite to load root `.env` (currently browser values must be set in `apps/web/.env.local` or exported); extend shared formatting coverage to the new owned paths when integrating.
- Resolution: Jack's server/controller branch is integrated. The live host creates and resumes
  rooms, validates server payloads, starts/restarts games, and protects movement animation from
  destination snapshots. Vite loads browser configuration from the repository root, and formatting
  covers the new server, controller, and motion paths. A browser controller joined, rolled, and
  advanced the authoritative host successfully. The physical-device milestone is not claimed
  complete.

### 2026-10-24 — Shared foundation and explicit integration delegation

- Requested by: Jack's agent.
- Owning area: Ryan — workspace, protocol, board, browser networking.
- Resolution: Merged Ryan's `f6dcafd` (`feat: build host board foundation`) into Jack's branch. It provides shared schemas, private response types, public snapshots without credentials, board traversal, and the browser socket factory.
- Explicit delegation: Jack authorized the requested shared integration edits in this thread: server/motion lockfile entries, web motion dependency, controller route replacement, and root dev/typecheck/test commands. Only those integration files were edited outside Jack's original ownership. No protocol events or fields were changed, and Ryan's host remains his fixture implementation.
- Verification: The frozen lockfile installs, package type checking, lint, formatting, automated tests, and production build are checked on Jack's branch. Details are in `docs/status/JACK.md`.

### 2026-10-24 — Shared foundation and explicit integration delegation

- Requested by: Jack's agent.
- Owning area: Ryan — workspace, protocol, board, browser networking.
- Resolution: Merged Ryan's `f6dcafd` (`feat: build host board foundation`) into Jack's branch. It provides shared schemas, private response types, public snapshots without credentials, board traversal, and the browser socket factory.
- Explicit delegation: Jack authorized the requested shared integration edits in this thread: server/motion lockfile entries, web motion dependency, controller route replacement, and root dev/typecheck/test commands. Only those integration files were edited outside Jack's original ownership. No protocol events or fields were changed, and Ryan's host implementation was merged without local edits to his source files.
- Verification: The frozen lockfile installs, package type checking, lint, formatting, automated tests, and production build are checked on Jack's branch. Details are in `docs/status/JACK.md`.

### 2026-10-24 — HTTPS demo integration

- Jack's single-origin production-build server and Quick Tunnel runner are retained alongside Ryan's host resume, root environment loading, movement snapshot handling, and 32-tile board.
- Earlier host-refresh and movement reports described the previous integration; Ryan's merged changes address those code paths. Physical phone and venue-network checks remain pending.

### 2026-10-24 — Host visual overhaul (Jack-authorized edit of Ryan's area)

- Requested by: Jack, who explicitly authorized his agent to edit Ryan-owned host and app styles on
  branch `feat/visual-overhaul`. Ryan should review before merge. No protocol, board, networking,
  dependency, or lockfile changes.
- Dice mismatch fix: the server roll was always correct; the host die turned its result face to +Z
  regardless of the angled overhead camera and unwound accumulated spin, so players often read a
  different face. `diceOrientation.ts` now aims the rolled face at the real camera with quaternion
  slerp. `tests/dice-orientation.test.ts` covers every value and checks the exported model's pips.
- Assets: static props are generated in Blender (`apps/web/scripts/blender/build-world.py`) into
  `apps/web/public/models/world.glb` and drawn as instanced meshes with one shared material.
  Measured in the fixture lobby: meshes 1,973 → 512, textures 37 → 11, triangles 733k → 196k.
  Blender is a build-time tool only; the glb is committed, so CI and deploys do not need it.
- UI: Calibri/Times New Roman replace Inter/Georgia; the connection pill, header logo mark,
  Preflight button (now `?preflight=1`), eyebrow taglines, room-count chip, and phase badge were
  removed; minimum host text size raised to 0.8rem.
- Remaining: characters are still procedural (~80 meshes each) because their limbs animate for
  minigames; moving them to a rigged Blender model is the next memory win.
