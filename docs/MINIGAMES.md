# Woodland mini-games

Ryan approved all five additions and their integrated host/server/controller implementation.
No dependencies or external models were added. These games reuse the detailed local characters
and woodland environment. Hot Potato's acorn now follows the animated wrist and travels in a
short hand-to-hand arc; it no longer floats above players' heads.

## Round flow

After everyone connected completes or skips a board turn, choose from a six-game bag.
Hot Potato opens each bag, then Balance, Fishing, Dodge, Archery and Rhythm are shuffled without
repetition. A new bag starts after all six. Occupied-space sword duels remain separate.

Instructions and results are untimed: the host explicitly starts the game and returns to the trail.
The playing clock (up to 20 seconds) starts fresh only after that click, even after a long pause.
Winners receive 8 coins, other participants receive 2, exactly once. Tied high scores share the
8-coin prize. No board positions change. Resume the player following the round's final mover.

## Games and controls

| Game | Phone / touch | Authoritative rules |
| --- | --- | --- |
| Balance | Counter-tilt / slider | Stay centered on a rolling log. Drift amplifies existing lean. Fall at 1.15 displacement; highest survival time wins. |
| Fishing | Small flick to cast/reel; tilt to steady / button and slider | Cast lasts 0.8s, bite opens 1.8–3s after cast. Reel with axis under 0.55 magnitude for 40–100 catch points. Sustained extreme tilt breaks the line. Highest total wins. |
| Dodge | Tilt / left-center-right buttons or slider | Three lanes per player. Ground marker warns before a falling acorn arrives every 1.8s. Collision evaluated after 1.45s. Highest survival time wins. |
| Archery | Tilt to aim, tap release / slider and release | Three arrows, 900ms cooldown. Shared deterministic sway; 0–100 points per shot depending on horizontal accuracy. Highest total wins. |
| Rhythm | Small wrist flick / Strike button | Beats every 750ms. Server receipt within 180ms of a beat earns up to 100 points; one attempt per beat. Highest total wins. |

The phone calibrates neutral sideways gravity when motion starts. Recenter resets it.
An explicit touch/motion selector prevents sensors from overriding slider or lane-button input.
Touch controls remain available without granting sensor permission. Keep phones held securely.

## Art and interface

- Fishing rods, bows and drumsticks attach to animated wrist nodes; no independent floating props.
- Fishing has raised wooden docks, a visible pond, rod-tip-to-float line, visible cast arc,
  dipping bobber, ripples and fish retrieval.
- Archery has wooden target stands, concentric scoring faces, aim marker and a visible arrow flight.
- Balance uses bark-textured floating logs with exposed end-grain rings and outstretched arms.
- Dodge uses separated lane pads, warning rings and falling acorns.
- Rhythm uses rope-laced drums, metal rims, animated sticks and beat-lit heads.
- Compact ivory/forest-green HUD, countdown, per-player scores and matching clean controller cards.
- No gradients, stock hero pictures or network asset downloads.
- A separate compact coin ledger stays visible across all game phases, distinct from round scores.
- Rule/result screens use host Start / Back to the trail controls; phones explain who continues.

## Protocol and recovery

`MINIGAME` phase and optional `minigame` snapshot contain kind, UUID, stage, startsAt, endsAt,
durationMs, players, winnerIds and revision. Player entries expose score, alive, axis, position,
actionAt, attempts and status. Zod checks distinct room participants and valid winner references.

`minigame.input` carries roomCode, private playerSessionId, requestId, gameId, sequence,
axis (-1…1), action (boolean). Unknown fields are rejected. Clients never submit scores or times.
The bound session must own the connection. Per-game monotonic sequences discard duplicates and
stale packets; periodic inputs are rate limited, actions have independent cooldowns. Snapshots
are emitted at 10Hz. Stale held axes return to neutral after 700ms without an input.

Disconnect forfeits the current mini-game without erasing the participant's earned score;
forfeited players cannot win. Reconnect watches until the next board turn. Result participants
still receive the participation payout. The host restart clears the room's game timer and bag.
Every game is bounded, including when no one sends input. No new room timers run alongside the
existing board/shop/duel timer.

Snapshots include optional `serverTime`; host and controller cues advance from this server anchor
using the browser's monotonic timer. Device wall-clock differences no longer shift the beat,
countdown, or animations. Scoring still uses server receipt time, never a client timestamp.
Archery snapshots also retain up to three `{offset, at}` shots so arrows remain in the target;
misses settle on the ground instead of hanging in midair. Test venue Wi-Fi latency before the demo.
Physical iPhone/Android thresholds and latency tuning are still a required rehearsal, not proven
by desktop tests. No audio playback is currently provided; Rhythm uses visual beat cues.

## Reproduce checks

- `pnpm check`: types, lint, formatting, automated rules/network tests and production build.
- Dev-only `/rehearsal`: select all six art scenes; prominently marked simulated inputs.
  It does not connect to a room and is not available as a production route.
- `tests/manual-minigame-server.ts`: isolated port 3003; set `MINIGAME=fishing` (or another kind).
  Run a separate Vite on 5175 with `VITE_SOCKET_URL=http://localhost:3003` and
  `VITE_CONTROLLER_URL=http://localhost:5175/controller`. Join 2–4 controllers and complete a round.
  This rehearsal extends play to 60s, not production's 20s, to inspect animations.

Verified in browser: four controllers completed the six-game round rotation (through board turn 25),
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
