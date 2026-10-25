# Core milestone scope

This file records the original core milestone. Ryan subsequently approved sword duels and the
round-game/shop economy; see `SWORD_DUEL.md` and `PARTY_ECONOMY.md` for the current extensions.
On October 25 Ryan approved first-to-finish at space 47, retired Dodge, replaced per-space
coins with one completed-turn coin, and reduced round prizes to 4/1. Those supersede the
original indefinite-loop/deferred-win-condition descriptions below. See `BOARD_MODEL.md`.
Ryan also approved eight players, motion-first play and one-phone demo bots on October 25;
see `PRESENTER_DEMO.md` and the updated `PROTOCOL.md`. These supersede the original four-seat limit.

## Goal

Prove the full multiplayer board-game loop before adding content. A laptop hosts a shared 3D board, four phones join as controllers, and each active player shakes their phone to request a server-generated dice roll. The correct piece then moves and the turn advances.

## Required user flow

1. Open `/host` on the laptop.
2. Create a room.
3. Display a four-character room code and controller QR code.
4. Join from up to four phones.
5. Choose a display name and an available color.
6. See all connected players in the host lobby.
7. Start when the room has at least one player.
8. Clearly identify the active player on the host and that player's phone.
9. Request motion access from an explicit button on the phone.
10. Shake the phone or press the fallback Roll button.
11. Receive one server-generated dice value from 1 through 6.
12. Animate the die on the laptop.
13. Animate the active piece one tile at a time.
14. Advance to the next connected player.
15. Repeat indefinitely or until the host restarts.

## Required reliability

- Duplicate roll requests cannot create duplicate movement.
- A non-active player cannot roll.
- Refreshing a phone reclaims the same player session.
- A disconnected active player cannot freeze the game forever.
- A rejected motion permission never blocks play because the Roll button remains available.
- The host can restart the match without creating a new room.
- The deployed controller works over HTTPS.

## Explicitly deferred

- Mini-games and a mini-game framework
- Power-ups, items, shops, or currency
- Special tile effects
- Branching paths or route selection
- Win conditions and final scoring
- Accounts, matchmaking, or persistent storage
- Multiple boards
- Physics-driven player movement
- Production character models and animations
- Spectator features

These deferred items should not influence the first implementation beyond avoiding obviously irreversible design decisions.

## Definition of done

Four controllers can complete five consecutive turn rotations on the actual demo network. Each turn produces exactly one dice result, moves the correct piece the correct number of spaces, and advances to the correct next player. Reloading a controller preserves its identity, and the touch fallback completes a turn when motion is unavailable.
