# Round games, shops, and power-ups

Ryan approved this extension on October 24, 2026, including cross-lane integration. The route now
has 48 spaces. Shops sit at spaces 3, 11, 19, 27, 35, and 43 so content appears early and regularly.

## Demo pacing

- A roll travels its exact server-generated path. Passing a market pauses at its tile with
  no deadline; buying or choosing Keep walking resumes the unused portion of that same roll.
- Connected players have no roll deadline. A disconnected active player is still skipped after
  60 seconds; rejoining before then cancels recovery. A disconnected shopper resumes the route.
- Instructions and result screens for every round game and duel wait for the host's explicit
  Start / Back to the trail button. These are untimed, including after host reconnection.
- Active competitive rounds retain their gameplay clocks (including the acorn fuse and combat
  cooldowns). Timers no longer rush shopping, reading instructions, choosing items, or results.
- The host shows the stall and stock; only the current player's phone can purchase.
- After every connected player completes or skips one board turn, everyone enters Hot Potato.
- Mini-games do not wait for a lap. A longer route therefore does not delay the first shop or game.
- Six round games rotate without repetition per bag; see `MINIGAMES.md`.

## Economy

Each player starts with 6 coins and a three-item pack. Finishing a move gives 1 coin. Hot Potato's
last survivor receives 8 coins; each other participant receives 2. Payouts happen exactly once.
Balances are capped at 999; restart resets coins, packs, effects, and round progress.

| Item        | Price | Effect                                                                            |
| ----------- | ----: | --------------------------------------------------------------------------------- |
| Frost Charm |     5 | Skip one connected opponent's next board turn. Does not stack on a frozen player. |
| Trail Boots |     4 | Add two spaces to the next roll; consumed when equipped. Maximum move is eight.   |
| Leaf Shield |     4 | Block one incoming Frost Charm, then disappear.                                   |

Use items before rolling on your own turn: open Use a power-up, select an item (and an opponent
for Frost), then activate it. Back to roll cancels selection without spending anything.
Shake-to-roll and touch Roll are disabled while choosing or awaiting item confirmation. A named
effect announcement appears on the host and phones until the next roll. Every player's live
coin balance remains visible on the host through shops, duels, and mini-games, and on controllers.

A Frost Charm consumes itself even if a shield blocks
it. Boots and shields cannot stack. One purchase per shop stop; unaffordable/full-pack purchases
do not spend coins. Target selection and effects are validated by the server.

## Hot Potato

The woodland version passes a glowing hot acorn clockwise among two to four players. A small
phone flick or Pass button sends it to the next surviving player. The fuse continues through
passes; it does not reset. At roughly five seconds (randomized by under one second either way),
the holder is out. A fresh fuse begins for survivors. The last survivor wins. Disconnected players
are removed; rejoining spectators cannot reenter that game. Eliminations do not move board pieces.

The host starts the game after everyone has read the instructions and returns to the board after
reviewing rewards. A four-player active game needs at most three fuses. Freeze skips count as board turns
for round progress. A one-player room keeps the board loop and shops, without a group mini-game.

## Wire and recovery

Snapshots add optional player coins/inventory/effects, roundNumber, notice, shop, and potato state.
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

Production defaults are untimed/manual. Automated legacy runners can explicitly set positive
`shopDurationMs` / `rollTimeoutMs` and `manualStageAdvance: false`; tests also cover live defaults.

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
exact Boots movement, a single frozen turn, shield consumption, four-player game cadence, pass
revisions, payouts, disconnects, and restart. Physical iPhone/Android gestures still need testing.
