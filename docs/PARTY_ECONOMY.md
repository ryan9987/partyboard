# Round games, shops, and power-ups

Ryan approved this extension on October 24, 2026, including cross-lane integration. The route now
has 48 spaces. Shops sit at spaces 3, 11, 19, 27, 35, and 43 so content appears early and regularly.

## Demo pacing

- A roll travels its exact server-generated path. Passing a market pauses at its tile with
  no deadline; buying or choosing Keep walking resumes the unused portion of that same roll.
- Connected players have no roll deadline. A disconnected active player is still skipped after
  60 seconds; rejoining before then cancels recovery. A disconnected shopper gets eight seconds
  to rejoin before the route resumes without a purchase.
- Round games/duels automatically start after a server-timed three-second countdown. Named
  results/rewards show for 3–3.5 seconds, then return to the board without host clicks.
- Active competitive rounds retain their gameplay clocks (including the acorn fuse and combat
  cooldowns). Shopping, board turns and choosing power-ups remain untimed.
- The host shows the stall and stock; only the current player's phone can purchase.
- After every connected player completes or skips one board turn, everyone enters Hot Potato.
- Mini-games do not wait for a lap. A longer route therefore does not delay the first shop or game.
- Six round games rotate without repetition per bag; see `MINIGAMES.md`.

## Economy

Each player starts with 6 coins and a three-item pack. Every forward space crossed gives 1 coin,
at that space's arrival time. A six-space roll therefore earns 6 coins, not one. Passing a market
earns its coin before shopping; resuming the unused path cannot pay for earlier spaces twice.
Boots bonus spaces and crossing Start also pay. Skipped turns, backwards duel penalties, and
duplicate requests do not. There is no additional landing/turn-end bonus. Hot Potato's
last survivor receives 8 coins; each other participant receives 2. Payouts happen exactly once.
Balances are capped at 999; restart resets coins, packs, effects, and round progress.

Travel defaults to 420 ms per space. The host follows a continuous curve through the same
server-approved tile path; animation never decides the route, reward, or dice value.

| Item        | Price | Effect                                                                            |
| ----------- | ----: | --------------------------------------------------------------------------------- |
| Trail Boots |     4 | Add two spaces to the next roll; consumed when equipped. Maximum move is eight.   |
| Lucky Clover |    3 | Next die is at least four; Frost is applied afterward to movement.                |
| Trail Compass |  10 | Choose the next die value from 1–6, with a phone landing-space preview.           |
| Leaf Shield |     4 | Block one incoming Frost Charm, then disappear.                                   |
| Frost Charm |    10 | Next move −2, minimum one space. The victim still rolls and plays.               |

### Balance pass: keep everyone playing

- Frost no longer skips turns. It cannot stack or target someone with thaw protection. On a
  slowed roll, protection stays active until that player completes their following unhindered
  roll. A shield block grants protection until the next unhindered roll too. Different attackers
  cannot bypass it, and refresh/disconnect does not reset it. This guarantees an actual normal
  roll between slowdowns. A 10-coin price also prevents the old 5-coin first-market Frost spam.
- One power-up per player's turn, enforced on the server and restored after controller refresh.
  Failed/invalid uses do not consume that allowance or an item. Duplicate accepted requests remain
  idempotent. Shield can remain active across turns; one purchase per shop and three pack slots
  are unchanged. Solo rooms do not sell unusable Frost, with a visible Needs an opponent label.
- Clover upgrades the actual displayed die: raw 1/2/3 become four; 4/5/6 stay unchanged. Compass
  chooses one legal die value, not a destination or client-submitted reward. Roll buffs do not
  stack; the server applies Boots +2 or Frost −2 to movement with a one-space minimum. The die,
  path and per-space coins agree. The host announces rolled value versus movement explicitly.
- The catalogue offers low-cost movement, safe rolls, precise landings, defense and premium
  sabotage. Regular travel averages 3.5 coins before mini-game rewards; prices range 3–10, with
  no price inflation or changes to the existing 8/2 coin payouts. These are initial tuning values,
  not a claim of competitive balance proven by human playtests.
- Phone shopping remains untimed and scrollable. Unaffordable choices stay readable and show
  the missing coin amount. Compass previews Start/space numbers, including Frost's reduction.
  Active effects stay visible even after the pack becomes empty. Host ledger shows protection
  and prepared rolls, with shared textual labels so color is never the only cue.
- Hand-authored Clover/Compass symbols match the woodland UI. A small potted clover and brass
  compass join the existing modeled stall stock; no new assets, packages or physics engine.

Use items before rolling on your own turn: open Use a power-up, select an item (and an opponent
for Frost, or a die value for Compass), then activate it. Back to roll cancels selection without spending anything.
Shake-to-roll and touch Roll are disabled while choosing or awaiting item confirmation. A named
effect announcement appears on the host and phones until the next roll. Every player's live
coin balance remains visible on the host through shops, duels, and mini-games. Phones show only
their owner's balance. Symbols are reusable code-native SVGs: blue snowflake, amber boot and green
leaf shield, always accompanied by names/effect text rather than relying on color alone.

A Frost Charm consumes itself even if a shield blocks
it. Boots and shields cannot stack. One purchase per shop stop; unaffordable/full-pack purchases
do not spend coins. Target selection and effects are validated by the server.

## Hot Potato

The woodland version passes a glowing hot acorn clockwise among two to four players. A small
phone flick or Pass button sends it to the next surviving player. The fuse continues through
passes; it does not reset. At roughly five seconds (randomized by under one second either way),
the holder is out. A fresh fuse begins for survivors. The last survivor wins. Disconnected players
get an eight-second reconnect grace, but the fuse still runs and can eliminate them normally.
After a gameplay elimination or grace expiry, rejoining cannot reenter that game.
Eliminations do not move board pieces.

The host shows instructions/countdown and automatically returns after displaying the winner.
A four-player active game needs at most three fuses. Frost does not skip any board turns.
A one-player room keeps the board loop and shops, without a group mini-game.

## Wire and recovery

Snapshots add optional player coins/inventory/effects, roundNumber, notice, shop, and potato state.
Balance-pass player fields are `lucky`, `plannedRoll` (nullable 1–6), `frostWard`, and
`itemUsedTurn` (the authoritative turn number of the last successful item use). Existing `frozen`
now means a pending slowdown, not a skipped turn. All reset on host restart. The item enum adds
`clover` and `compass`. Only Compass requires the optional `item.use.dieValue`; other items must
omit it. Strict schemas reject unknown fields and out-of-range/fractional choices. Refresh all
host/controller tabs when deploying this contract; old clients cannot parse the new item IDs.
New phases are `SHOP` and `POTATO`. Commands include `shop.choice`, `item.use`, and `potato.pass`,
each with private session authorization, UUID request deduplication, and shared-schema validation.
Shop commands bind to a visit UUID, items to a turn number, and passes to a game UUID plus holder
revision. Old/replayed commands cannot buy twice, duplicate an effect, or pass a future catch.

`shop.endsAt` and `turn.started.timeoutAt` are nullable: null means untimed, never zero or a fake
far-future date. `waitingForHost: { id, label }` identifies a paused intro/result. `game.continue`
requires the connected host's room/token and that exact `continueId`; stale screens and controller
requests cannot advance the game. Active mini-game time is rebased when the host actually starts.
`itemEffect: { id, playerId, targetId, item, blocked, message }` is server-authored feedback, cleared
on roll/restart/next turn. No inventory or coin mutation occurs on the client.

Production defaults are untimed shops/connected turns and automatic round stages. An optional
`manualStageAdvance: true` preserves authenticated operator Start/Continue behavior; positive
`shopDurationMs` / `rollTimeoutMs` are only explicit rehearsal overrides. Tests cover both modes.

No client supplies balances, prices, destinations, or rewards. Host/controller refresh reads the
current authoritative stop/game. Restart cancels pending shop, movement, duel, and mini-game timers.

## Manual rehearsal

Use the same isolated Vite setup described in `SWORD_DUEL.md`, but start this server instead:

```powershell
pnpm --filter @party-board/server exec tsx ../../tests/manual-party-server.ts
```

It uses a six-space first roll (shop at three), then a one-space second roll (no collision), longer
rehearsal deadlines, and the separate local port. Two players can exercise a purchase, unused-move
resumption, full-round Hot Potato, and a coin payout. Production timings and random rolls are unchanged.

Automated checks cover pass-by purchase/skip, optional timed rehearsals, stale visits, duplicates, inventory limits,
exact Boots/Clover/Compass movement, Frost minimum movement and anti-chain protection,
one-item-per-turn across refresh, shield consumption, four-player game cadence, pass
revisions, payouts, disconnects, and restart. Physical iPhone/Android gestures still need testing.
