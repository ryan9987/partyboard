# Occupied-space sword duel

Ryan requested the first mini-game on October 24, 2026. This supersedes the original no-mini-games
scope for this feature and authorizes integrated host/server/controller changes. All arena art,
sword geometry, characters, and UI use local assets.

## Rules

- At the end of a move, landing on a connected player's space starts a duel. Start is safe.
- For multiple occupants, the first connected opponent in room join order defends; others watch.
  Penalty movement never triggers another duel.
- The crossed-swords introduction counts down 3–2–1 automatically; then a 25-second fight begins.
- First to two clean hits wins. A swing winds up for 450 ms, allowing a reactive guard.
- Guard covers 700 ms. Both actions share a server-enforced 900 ms recovery.
- Swings with impact times within 180 ms clash. A guarded attack is blocked.
- Timeout awards victory to the higher score; equal scores draw without moving anyone.
- The winner keeps the space. The loser goes back three spaces, capped at Start.
- Disconnecting gives eight seconds to rejoin before forfeiting; the fight clock continues.
  Rejoining receives current state;
  combat actions are never replayed after disconnect.
- The named result displays for 3.2 seconds, then play automatically resumes after the original moving player's turn.
  Host restart cancels duel timers and resets positions.

## Protocol

`GamePhase` includes `DUEL`. Snapshots carry optional nullable `duel` data; `DUEL` requires two distinct
fighter IDs referring to room players. State includes a duel UUID, tile, stage (`intro`, `active`,
`result`), fighter scores/actions, deadline, revision, outcome, winner/loser, and actual penalty.
Credentials and pending hit timers remain private.

`duel.action` requires `{ roomCode, playerSessionId, requestId, duelId, action }`, where action is
`swing` or `guard`. Shared schemas validate browser output and server input. Only attached participant
sessions may act during the active stage. The duel UUID rejects old-fight actions; request IDs
deduplicate accepted inputs. Clients supply no scores, hit decisions, or timestamps.

## Phone controls

Enable motion with the existing permission button. Wrist rotation above 180 degrees/second or
gravity-free acceleration above 12 m/s² requests a swing. Sideways tilt (gravity X magnitude over
6 m/s², or orientation gamma over 40° where available) requests guard. The gravity fallback works
with motion permission alone if the browser separately restricts orientation.

Swing/Guard buttons always remain available. Use small motions with a firm grip. Client and server
cooldowns limit repeated sensor inputs. Gesture classification and touch/network flow have automated
and desktop browser coverage; real iPhone/Android permissions and sensitivity still need testing.

## Rehearsal

`tests/manual-duel-server.ts` runs an isolated localhost server with fixed rolls of three and longer
fight/result deadlines for browser inspection. It is separate from the production entry point.

Run these in two terminals from the repository root:

```powershell
pnpm --filter @party-board/server exec tsx ../../tests/manual-duel-server.ts
```

```powershell
$env:VITE_SOCKET_URL='http://localhost:3002'
$env:VITE_CONTROLLER_URL='http://localhost:5174/controller'
pnpm --filter @party-board/web exec vite --port 5174 --strictPort
```

Open `http://localhost:5174/host`, join two separate controller browsers, start, and roll each once.
Both land on space three. Test a parry, then let one player score twice. The loser returns to Start,
and the board resumes. Use deployed HTTPS for real-phone motion testing.

Automated coverage includes scoring, penalty capping, blocks, clashes, duplicates, rate limiting,
spectator/session/duel rejection, draws, disconnect forfeits, restart cancellation, controller
cooldowns, gesture classification, and five four-controller rotations over real sockets.
