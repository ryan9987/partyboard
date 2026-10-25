# Protocol contract

The four-game extension (plus separate Hot Potato) is documented in [MINIGAMES.md](./MINIGAMES.md): `MINIGAME`,
validated per-player snapshots, and authenticated `minigame.input` commands with monotonic sequences.

The round-game/economy extension in [PARTY_ECONOMY.md](./PARTY_ECONOMY.md) adds `SHOP`, `POTATO`,
optional public economy state, and validated `shop.choice`, `item.use`, and `potato.pass` commands.

Sword fights are retired. `DUEL`, the `duel` snapshot field and `duel.action` are no longer
accepted. Players can share trail spaces without combat or knockback. Refresh host and phones
and create a new room after this coordinated deployment. `SWORD_DUEL.md` is historical only.

This is the initial contract to implement in `packages/protocol`. Change it deliberately and update every affected consumer in the same integration cycle.

## Shared state

### October 25: eight players and presenter demo mode

`MAX_PLAYERS` is 8 across room, Hot Potato, and mini-game schemas. `PLAYER_COLORS`
includes coral, cyan, gold, violet, fern, peach, blue, rose; all have matching 3D outfits,
portraits and HUD accents. The ninth join is rejected, and each seat retains a unique color.

Host-only `room.demo` takes `{ roomCode, hostToken, enabled }`. It requires the authenticated
host connection, the lobby phase, and at least one connected human. Enabling fills to four
players with three or fewer gentle bots; repeating it is idempotent. Disabling removes only
bot players and their private sessions. Larger human parties can still join up to eight seats.
Public snapshots carry optional `demoMode` and player `isBot`; bot session tokens remain private.

Bots issue the same validated commands as controllers. They auto-roll, browse/buy/leave shops,
use defensive items or a short Compass roll, pass and play every round game. Novice
inputs provide approachable rivals, without changing dice sources, points, or winning rules.
Bot turns pause while all human controllers are disconnected. Restart resets their runtime;
finish/dispose cancels their scheduler. Host resume preserves the party.

Controllers guide users through explicit motion permission. Shake rolls; tilt balances/aims;
wrist flicks cast, reel, release arrows, pass and strike. Touch fallbacks remain visible
for accessibility, unsupported sensors and permission denial. Archery flick release preserves
the last settled aim, requires a quiet wrist before the next flick, and respects three arrows
and the server cooldown. Sensor permission is per page session; refresh asks to enable it again.

```ts
type GamePhase = "LOBBY" | "AWAITING_ROLL" | "ROLLING" | "MOVING" | "TURN_END" | "FINISHED" | "SHOP" | "POTATO" | "MINIGAME"

type PlayerState = {
  id: string
  sessionId: string
  name: string
  color: string
  connected: boolean
  tileId: string
}

type GameState = {
  roomCode: string
  phase: GamePhase
  players: PlayerState[]
  currentPlayerId: string | null
  turnNumber: number
  lastRoll: number | null
  winnerId?: string | null
}
```

Private session IDs are omitted from public room snapshots. Controllers receive their own private session token only in the `room.joined` response. The shared `PublicPlayer` schema contains no session field.

### October 25: terminal trail and retired activity

`FINISHED` requires `winnerId` to reference a room player and equal `currentPlayerId`.
Other phases cannot carry a non-null winner. The default board's `finishTileId` is tile-47;
the server clamps overshoots, awards one completed-turn coin, cancels pending activity/recovery
timers and broadcasts the persistent result through `room.snapshot`. No new event is needed.
Further actions are rejected; authenticated `game.restart` clears the winner and resets the match.
Reconnect preserves the champion. This is first-to-finish, not a coin-total victory.

`minigame.kind` now accepts only `balance`, `fishing`, `archery`, `rhythm`; `dodge` is invalid.
Hot Potato remains its own phase. Reward values are shared `GAME_REWARDS` (6 starting,
1 completed forward turn, 4 winner / 1 participation). Refresh host/phone tabs and create a new
room on coordinated deployment; old open clients are incompatible with the retired enum.

## Client-to-server events

### `room.create`

Sent by the host. The server returns a room code and host token.

### `room.join`

```ts
type JoinRoomRequest = {
  roomCode: string
  name: string
  color: string
  existingSessionId?: string
}
```

### `room.host.resume`

Sent by a returning host with its private `roomCode` and `hostToken`. A valid request attaches the
new transport to the existing room and returns the current `room.snapshot`; it never creates or
restarts a room.

### `player.ready`

Marks a joined controller as ready after it reaches the lobby.

### `game.start`

Host-only. Valid only during `LOBBY` with at least one player.

### `game.restart`

Host-only. Returns every player to the starting tile while preserving the room and membership.

### `game.continue`

Optional operator mode only (`manualStageAdvance: true`). Production round stages auto-advance
after the server's countdown/result deadlines; no controller/host command is needed.
All five round games show seven seconds of animated setup before the final
three-second countdown; `startsAt` already represents the authoritative end of that whole intro.
Hot Potato uses `endsAt` for the equivalent intro deadline.
For Balance, existing player `actionAt` records the server's fall timestamp and signed `position`
retains the fall side. One remaining survivor ends the round and wins even if the final faller
has the same survival score on that server tick. No wire fields or event names were added.

Host-only, connected/attached host required. Payload is `{ roomCode, hostToken, continueId }`.
The UUID must equal the current `waitingForHost.id`; it consumes exactly one paused intro/result.
Stale, duplicate and controller commands cannot advance another screen. See `PARTY_ECONOMY.md`
for untimed board/shop behavior and additive `itemEffect` feedback.

The economy balance pass adds `clover` / `compass`, player `lucky`, `plannedRoll`, `frostWard` and
`itemUsedTurn`, and Compass-only `item.use.dieValue` (integer 1–6). Existing `frozen` now denotes
a two-space next-move slowdown, never a skipped turn. See `PARTY_ECONOMY.md` for exact ordering,
protection lifetime, one-item-per-turn enforcement and client refresh requirements.

### `dice.roll.request`

```ts
type RollRequest = {
  roomCode: string
  playerSessionId: string
  requestId: string
}
```

The server accepts this only from the active player during `AWAITING_ROLL`.

## Server-to-client events

### `room.created`

Returns the room code, host token, and initial public snapshot.

### `room.joined`

Returns the private player session ID and public snapshot.

### `room.snapshot`

Provides the complete public state needed to recover after reconnection.

### `player.joined` and `player.updated`

Optional incremental lobby updates. The complete snapshot remains the recovery source of truth.

### `game.started`

Signals that the lobby transitioned into the turn loop.

### `turn.started`

```ts
type TurnStartedEvent = {
  playerId: string
  turnNumber: number
  timeoutAt: number | null // null means there is no connected-player roll deadline
}
```

### `dice.rolled`

```ts
type DiceRolledEvent = {
  playerId: string
  value: number
  turnNumber: number
  rollDurationMs: number
}
```

### `player.moving`

```ts
type PlayerMovingEvent = {
  playerId: string
  fromTileId: string
  toTileId: string
  path: string[]
  millisecondsPerTile: number
  turnNumber: number
}
```

### `turn.ended`

Identifies the completed turn and next active player.

### `game.error`

```ts
type GameErrorEvent = {
  code: string
  message: string
  requestId?: string
}
```

`UNAUTHORIZED` on an action does not invalidate a saved player session. Reattach at most once
per two seconds. `SESSION_REPLACED` means the session was opened on another connection: stop
the old tab's input without clearing its token or automatically stealing back the connection.
`ROOM_NOT_FOUND`/`SESSION_NOT_FOUND` invalidate obsolete room/session credentials. Rooms do not
survive a server-process restart. Transient activity disconnects have an eight-second grace;
authenticated reattachment resets mini-game sequence counters, not game scores or cooldowns.

## Validation rules

- Define each payload as a Zod schema and infer its TypeScript type.
- Trim and limit player names.
- Normalize room codes to uppercase.
- Validate colors against an allowed list.
- Treat session and host tokens as private values.
- Require the host token for host resume, start, and restart commands.
- Reject unknown event payload fields where practical.
- Never trust a client-provided player ID, dice value, tile ID, or turn number as authority.
