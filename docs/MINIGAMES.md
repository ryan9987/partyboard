# Woodland mini-games

Ryan approved the integrated host/server/controller implementation. Dodge was removed on October 25;
the active round games are Hot Potato, Balance, Fishing, Archery and Rhythm.
No dependencies or external models were added. These games reuse the detailed local characters
and woodland environment. Hot Potato's acorn now follows the animated wrist and travels in a
short hand-to-hand arc; it no longer floats above players' heads.

## Round flow

After everyone connected completes or skips a board turn, choose from a five-game bag.
Hot Potato opens each bag, then Balance, Fishing, Archery and Rhythm are shuffled without
repetition. A new bag starts after all five. Occupied-space sword duels remain separate.

Instructions show seven seconds of illustrated phone setup followed by an automatic, server-timed
3–2–1 countdown. No extra click is required. The playing clock (up to 20
seconds) then starts fresh. Named winners/rewards display for 3–3.5 seconds and the board resumes
automatically, with no Start/Continue clicks. Optional `manualStageAdvance: true` remains available
for an operator/rehearsal, but is not the production default. Shops and board turns stay untimed.
Winners receive 4 coins, other participants receive 1, exactly once. Tied high scores each receive
4 coins. No board positions change. Resume the player following the round's final mover.

All five round games and sword duels include a short animated how-to-play splash. It shows
the portrait phone input alongside the corresponding game action, three concise steps, the
goal, and a touch alternative. The ten-second intro includes seven seconds of setup followed
by the final 3–2–1; Hot Potato and duels now have that same setup allowance. No extra Start
button and no playing time consumed. The SVG/CSS lessons add no downloads, dependencies or
second WebGL canvas. Reduced-motion preferences show a static diagram with the same text.

## Games and controls

| Game | Phone / touch | Authoritative rules |
| --- | --- | --- |
| Balance | Counter-tilt / slider | Stay centered on a rolling log. Drift amplifies existing lean. Fall at 1.15 displacement. End immediately with one survivor; simultaneous final falls share the highest survival time. Survivors at time-up share the win. |
| Fishing | Small forward wrist flick to cast, lift once to reel; tilt to steady / button and slider | Cast lasts 0.8s, bite opens 1.8–4.2s after cast (2.4s reaction window). Reel at axis magnitude ≤0.75 for 55–100 catch points. Sustained extreme tilt breaks the line. Highest total wins. |
| Archery | Tilt to aim, tap release / slider and release | Three arrows, 900ms cooldown. Shared deterministic sway; 0–100 points per shot depending on horizontal accuracy. Highest total wins. |
| Rhythm | Small wrist flick / Strike button | Beats every 750ms. Server receipt within 180ms of a beat earns up to 100 points; one attempt per beat. Highest total wins. |

The phone calibrates neutral sideways gravity when motion starts. Recenter resets it.
An explicit touch/motion selector prevents sensors from overriding slider input.
Touch controls remain available without granting sensor permission. Keep phones held securely.

### Fishing reliability and orientation

- Reusable code-native diagrams show portrait orientation, screen facing the player, and a side
  view of the small wrist lift. Visible in the phone lobby and five mini-game setup screens on
  host/phone, and available in expandable in-game help. Active phone controls remain compact.
- Motion calibration listens during setup, not just after play starts. Recenter is still available.
- Fishing uses a gentler threshold (110°/s rotation or 6m/s² gravity-free acceleration), separate
  from sword/rhythm gestures. One motion requires 180ms of settled wrist before rearming and at
  least 600ms between flicks. A 250ms tilt hold keeps the gesture from injecting line tension.
- Casting/return motions cannot reel early: phone actions are stage-gated, and the server ignores
  early reels rather than consuming a fish. The button reads Wait for a bite until REEL NOW.
- Host scorecards, an enlarged bobber and the phone action highlight the bite. The displayed
  green meter band matches the shared catch tolerance. Players can recenter an over-tilted phone
  and retry within the bite window instead of instantly losing a fish.
- Holding absolute tilt over 0.9 for 1.2 seconds breaks the line. Completed/expired casts retain
  feedback for 1.2 seconds before a new cast. One catch per cast; no implicit time-based recast.
- `FISHING_RULES` shares timing/tolerance values between host, controller and server. Score,
  game ID/sequence checks and payouts stay server-owned. Device thresholds require real-phone
  rehearsal; desktop/synthetic sensor tests are not a substitute for iPhone/Android testing.

## Art and interface

- October 25 clarity pass: all lessons use shared `gameLessons.ts` copy, explicit winning rules,
  and real button names. Phone lessons and in-game help follow Touch/Motion selection; touch
  players see tap/slide steps and a stationary phone diagram with a tap cue.
- Desktop lesson steps/goals are 16px, touch guidance 14px, with wider 760px cards and integrated
  game titles. All six lessons fit without scrolling at 1280x720. Active hints are enlarged too.
- `/phone-preview?view=lessons` embeds dev-only `/lesson-preview` for six games/two modes at
  320/390/430px. These fixtures never connect to rooms, request permissions or send commands.
- Automated copy checks reject motion-only touch steps and preserve three-arrow totals, the
  center-line beat cue, named buttons, elimination and duel consequences.

- Fishing rods, bows and drumsticks attach to animated wrist nodes; no independent floating props.
- Fishing has raised wooden docks, a visible pond, rod-tip-to-float line, visible cast arc,
  dipping bobber, ripples and fish retrieval.
- Archery uses a close, frontal camera fitted to the number of players and viewport. Large named
  targets, high-contrast reticles and retained arrow flights make aiming readable. Target face
  radius is 1.02 world units: exactly the server's 0.6 hit threshold times the 1.7 aim scale.
  Once all players finish their arrows (or are out), wait 650ms for the final flights, then score
  immediately instead of waiting out the remaining clock.
- Balance uses bark-textured floating logs with exposed end-grain rings and outstretched arms.
- Balance falls now tumble from the log with flailing arms/legs, water droplets and expanding
  ripples, not an instant relocation. Existing server-owned `actionAt` timestamps the fall and
  signed `position` determines its direction. Timestamp-based sampling reuses frame storage;
  late snapshots/reloads show the current point in the fall, never restart the whole animation.
  The server freezes the round and pays immediately when one survivor remains. The host waits
  1.1s before its large winner card so the fall/splash remains visible; normal automatic return
  timing is unchanged. With four players, the first fall alone does not end the round. A final
  faller's same-tick score cannot tie a player who is still on the log. Forfeits cannot win.
- Rhythm uses rope-laced drums, metal rims, animated sticks and beat-lit heads.
- Compact ivory/forest-green HUD, countdown, per-player scores and matching clean controller cards.
- No gradients, stock hero pictures or network asset downloads.
- The host retains the full coin ledger. The phone shows only its owner's compact balance,
  current controls and necessary feedback. Lessons appear during setup; full standings stay on
  the shared screen and instructions collapse into optional help during play.
- Touch/Motion setup is visible in the lobby and intros; detailed sensor help stays expandable.
- Mobile board turns put Roll before the optional pack. Numbered lesson cards, readable Phone/TV
  labels and a separate goal line replace cramped diagrams and unstructured instruction text.
- Intro scenes are already in the arena, so the countdown does not trigger another world change.

## Protocol and recovery

`MINIGAME` phase and optional `minigame` snapshot contain kind, UUID, stage, startsAt, endsAt,
durationMs, players, winnerIds and revision. Player entries expose score, alive, axis, position,
actionAt, attempts and status. Zod checks distinct room participants and valid winner references.

`minigame.input` carries roomCode, private playerSessionId, requestId, gameId, sequence,
axis (-1…1), action (boolean). Unknown fields are rejected. Clients never submit scores or times.
The bound session must own the connection. Per-game monotonic sequences discard duplicates and
stale packets; periodic inputs are rate limited, actions have independent cooldowns. Snapshots
are emitted at 10Hz. Stale held axes return to neutral after 700ms without an input.

Brief disconnections get an eight-second grace before forfeiting the current mini-game. Rejoining
cancels that player's grace timer and resets only the input sequence (refresh starts at zero),
not arrows, action cooldown, score or survival state. A gameplay elimination remains final and
clocks/fuses continue during recovery. After grace, forfeited players cannot win. Restart/dispose
cancel grace timers; a callback is also bound to the original activity UUID, never a later game.
Result participants still receive the participation payout. Every game remains bounded.

A command-level UNAUTHORIZED error no longer deletes the saved session; the controller attempts
a bounded reattachment. Opening the same controller session in another tab sends SESSION_REPLACED
to the older tab, which stops input without deleting credentials or stealing the session back.
Actual ROOM_NOT_FOUND/SESSION_NOT_FOUND clears obsolete credentials with an actionable error.
Rooms are still in-memory: a process restart/deploy requires a new room. No durable storage added.

Snapshots include optional `serverTime`; host and controller cues advance from this server anchor
using the browser's monotonic timer. Device wall-clock differences no longer shift the beat,
countdown, or animations. Scoring still uses server receipt time, never a client timestamp.
Archery snapshots also retain up to three `{offset, at}` shots so arrows remain in the target;
misses settle on the ground instead of hanging in midair. Test venue Wi-Fi latency before the demo.
Safari cannot reliably disable the iOS Shake to Undo prompt. Joining dismisses input focus, but
this is not a guaranteed suppression. Touch controls avoid shaking without any Settings change;
the platform's supported setting is Accessibility → Touch → Shake to Undo.
Physical iPhone/Android thresholds and latency tuning are still a required rehearsal, not proven
by desktop tests. No audio playback is currently provided; Rhythm uses visual beat cues.

## Reproduce checks

- `pnpm check`: types, lint, formatting, automated rules/network tests and production build.
- Dev-only `/rehearsal`: select five round games, the duel or Trail victory; prominently marked simulated inputs.
  It does not connect to a room and is not available as a production route.
- The rehearsal now includes the duel scene, an instruction/playing/result selector and a
  replayable Balance fall/winner sequence. These are visual fixtures, not live-game proof.
- `tests/manual-minigame-server.ts`: isolated port 3003; set `MINIGAME=fishing` (or another kind).
  Run a separate Vite on 5175 with `VITE_SOCKET_URL=http://localhost:3003` and
  `VITE_CONTROLLER_URL=http://localhost:5175/controller`. Join 2–4 controllers and complete a round.
  This rehearsal extends play to 60s, not production's 20s, to inspect animations.

Historical verification before Dodge retirement: four controllers completed the former six-game round rotation (through board turn 25),
including pass-by purchases, Boots use, active Shield, targeted Frost, Hot Potato passing,
scored sword duels and knockback, Fishing cast/bite/reel (100 points), and Rhythm hits (105 points).
Targeted replays exercised all three Archery arrows (157 total including a miss) and Balance tilt.
All games completed their result/payout and resumed the board. Fresh host/controller error logs
were empty after the fixes. Rules tests independently exercise four-player scoring and recovery.

The browser viewport override was ineffective. `/phone-preview?room=CODE&slot=1` instead embeds
the real live controller in a 320, 390 or 430px iframe, exercising actual media queries. All three
widths were inspected and horizontal overflow corrected. Slots 1–4 isolate browser rehearsal
sessions only in development. Physical Safari/Chrome, permission prompts and sensors remain
untested; an iframe layout check is not a substitute for physical device rehearsal.

## Demo hardening pass

- More natural character proportions, shaped jacket/pelvis, smaller inset eyes, complete hair
  caps, visible thumbs/knuckles, neck, fabric weave, pockets, seams and shoe panels.
- Detailed market merchant, labeled wood sign, real Boots/Shield/vial display, crate bracing,
  barrel hoops, lantern and coins. Market camera favors the stall; distant vendors are culled.
- Shop touch submissions latch until the response; item inputs are debounced.
- Motion flicks preserve the last steady tilt reading instead of injecting acceleration into
  Fishing tension. New casts reset accumulated strain.
- Visible action cooldowns, retained arrows, grounded misses and bounded countdown displays.
- Compact mobile activity headers and no off-screen horizontal content at the checked widths.
- `pnpm check`: 78 Vitest tests and 10 motion tests (88 total), plus types/lint/format/build.
