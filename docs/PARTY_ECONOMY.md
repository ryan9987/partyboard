# Round games, shops, and power-ups

Ryan approved this extension on October 24, 2026, including cross-lane integration. The route now
has 48 spaces. Shops sit at spaces 3, 11, 19, 27, 35, and 43 so content appears early and regularly.

## Demo pacing

- A roll travels its exact server-generated path. Passing a market pauses at its tile for up to
  eight seconds; buying or skipping resumes the unused portion of that same roll.
- The host shows the stall and stock; only the current player's phone can purchase.
- After every connected player completes or skips one board turn, everyone enters Hot Potato.
- Mini-games do not wait for a lap. A longer route therefore does not delay the first shop or game.
- Hot Potato is currently the one round-end game. Its starting holder and fuse duration vary;
  random selection among additional round-end games can be added when those games exist.

## Economy

Each player starts with 6 coins and a three-item pack. Finishing a move gives 1 coin. Hot Potato's
last survivor receives 8 coins; each other participant receives 2. Payouts happen exactly once.
Balances are capped at 999; restart resets coins, packs, effects, and round progress.

| Item        | Price | Effect                                                                            |
| ----------- | ----: | --------------------------------------------------------------------------------- |
| Frost Charm |     5 | Skip one connected opponent's next board turn. Does not stack on a frozen player. |
| Trail Boots |     4 | Add two spaces to the next roll; consumed when equipped. Maximum move is eight.   |
| Leaf Shield |     4 | Block one incoming Frost Charm, then disappear.                                   |

Use items before rolling on your own turn. A Frost Charm consumes itself even if a shield blocks
it. Boots and shields cannot stack. One purchase per shop stop; unaffordable/full-pack purchases
do not spend coins. Target selection and effects are validated by the server.

## Hot Potato

The woodland version passes a glowing hot acorn clockwise among two to four players. A small
phone flick or Pass button sends it to the next surviving player. The fuse continues through
passes; it does not reset. At roughly five seconds (randomized by under one second either way),
the holder is out. A fresh fuse begins for survivors. The last survivor wins. Disconnected players
are removed; rejoining spectators cannot reenter that game. Eliminations do not move board pieces.

The introductory screen lasts 2.2 seconds; the result lasts 3 seconds. A four-player game needs at
most three fuses, so it normally finishes in under 25 seconds. Freeze skips count as board turns
for round progress. A one-player room keeps the board loop and shops, without a group mini-game.

## Wire and recovery

Snapshots add optional player coins/inventory/effects, roundNumber, notice, shop, and potato state.
New phases are `SHOP` and `POTATO`. New commands are `shop.choice`, `item.use`, and `potato.pass`,
each with private session authorization, UUID request deduplication, and shared-schema validation.
Shop commands bind to a visit UUID, items to a turn number, and passes to a game UUID plus holder
revision. Old/replayed commands cannot buy twice, duplicate an effect, or pass a future catch.

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

Automated checks cover pass-by purchase/skip/timeout, stale visits, duplicates, inventory limits,
exact Boots movement, a single frozen turn, shield consumption, four-player game cadence, pass
revisions, payouts, disconnects, and restart. Physical iPhone/Android gestures still need testing.
