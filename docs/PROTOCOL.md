# Protocol contract

The five-game extension is documented in [MINIGAMES.md](./MINIGAMES.md): `MINIGAME`,
validated per-player snapshots, and authenticated `minigame.input` commands with monotonic sequences.

The round-game/economy extension in [PARTY_ECONOMY.md](./PARTY_ECONOMY.md) adds `SHOP`, `POTATO`,
optional public economy state, and validated `shop.choice`, `item.use`, and `potato.pass` commands.

The combat extension is documented in [SWORD_DUEL.md](./SWORD_DUEL.md): `DUEL`, validated snapshot
combat state, and the authenticated `duel.action` command.

This is the initial contract to implement in `packages/protocol`. Change it deliberately and update every affected consumer in the same integration cycle.

## Shared state

```ts
type GamePhase = "LOBBY" | "AWAITING_ROLL" | "ROLLING" | "MOVING" | "TURN_END" | "FINISHED" | "DUEL"

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
}
```

Private session IDs are omitted from public room snapshots. Controllers receive their own private session token only in the `room.joined` response. The shared `PublicPlayer` schema contains no session field.

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

Host-only, connected/attached host required. Payload is `{ roomCode, hostToken, continueId }`.
The UUID must equal the current `waitingForHost.id`; it consumes exactly one paused intro/result.
Stale, duplicate and controller commands cannot advance another screen. See `PARTY_ECONOMY.md`
for untimed board/shop behavior and additive `itemEffect` feedback.

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

## Validation rules

- Define each payload as a Zod schema and infer its TypeScript type.
- Trim and limit player names.
- Normalize room codes to uppercase.
- Validate colors against an allowed list.
- Treat session and host tokens as private values.
- Require the host token for host resume, start, and restart commands.
- Reject unknown event payload fields where practical.
- Never trust a client-provided player ID, dice value, tile ID, or turn number as authority.
