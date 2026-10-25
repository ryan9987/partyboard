# Game review — 2026-10-24

Ryan requested a full pass, prioritizing weak coin spending and repeated Frost attacks.
This is a desktop/code review and automated regression pass, not physical-phone certification.

## Fixed in this pass

| Finding | Change |
| --- | --- |
| Cheap Frost removed an entire turn and could lock one player out repeatedly. | 10 coins, −2 next move with a minimum of one, plus shared thaw protection guaranteeing an unhindered roll between slowdowns. |
| Multiple items could be chained on one turn. | One successful power-up per turn; authenticated server marker survives refresh and cannot be bypassed by another request UUID. |
| Only three market choices, with no precise movement option. | Lucky Clover (3) and Trail Compass (10), keeping Boots (4), Shield (4) and premium Frost (10). |
| Empty pack hid an equipped effect from the phone. | Shared effect labels remain in player identity/host ledger independently of inventory. |
| Solo markets sold sabotage with no possible target. | Server/phone prevent that purchase; readable explanation and no lost coins. |
| More stock overfilled the narrow host shop. | Wider, compact woodland panel, explicit prices, no desktop scrolling at the tested viewport. |
| Disabled phone stock was difficult to read. | Readable unavailable cards with missing-coin / full-pack / opponent explanations. |
| Die and Frost-adjusted travel could be confusing. | Host explicitly announces rolled number versus moved spaces; Compass previews the adjusted landing. |

## Coverage and scope

- Board: pass-by markets, exact travel rewards, Boots, wrap, cap, duplicate requests, restart,
  disconnect recovery and current-turn authorization remain covered by the full suite.
- Mini-games: Balance last-survivor/ties/falls, Fishing casts/early reels/bites/tension, Dodge
  warning/collision rules, Archery arrows/cooldowns/early finish, Rhythm timing, Hot Potato
  passing/revisions/payout, and sword hit/block/draw/penalty remain in regression coverage.
- Cross-system: all round-game payouts/resumption, six-game non-repeating rotation, automatic
  instructions/countdowns and restart cancellation. Existing detailed scenes/held props preserved.
- Economy: four-player anti-chain attacks, shield protection, real purchases at earned prices,
  one-item allowance, invalid choices, exact path/coins, duplicates, refresh and restart.
- UI: expanded modeled market and live mobile purchase/activation, Clover's displayed minimum,
  Compass landing selector/prepared-choice refresh at 320/390px. Desktop checks do not validate
  permission prompts, real sensors, venue network timing or laptop frame rate.
- Fresh visual inspection of all seven active scenes (six round games plus duel) preserved held
  acorn/rod/bow/sticks, named targets, readable scores and detailed arena props. Live Frost retained
  Jack's turn and moved space 2→3 with 12→13 coins. Protection remained through automatic Balance
  and board return at turn 7. Fresh host/controller console error lists were empty.
- Final `pnpm check`: 151 Vitest tests plus 10 motion tests, type checking, lint, formatting and
  production build all pass. The existing large 3D chunk warning is still reported by Vite.

## Recommended next work (not silently added to this change)

1. Define a short match objective/end condition. The current board is intentionally endless;
   richer shops help moment-to-moment choices but do not create an overall match winner.
2. Run a four-human, physical iPhone/Android playtest and adjust prices/gesture sensitivity from
   actual behavior. Automated outcomes are not proof of fun or competitive balance.
3. Profile the presentation laptop. The existing large 3D bundle warning remains; any rigged-model
   migration or further asset splitting should be measured separately, not mixed into economy rules.
4. Production rollout is separate. Rooms are in memory; deployment requires a fresh room and all
   controllers/host must refresh together for the expanded strict protocol. This pass is local.
