# Protocol contract

This is the initial contract to implement in `packages/protocol`. Change it deliberately and update every affected consumer in the same integration cycle.

## Shared state

```ts
type GamePhase =
  | "LOBBY"
  | "AWAITING_ROLL"
  | "ROLLING"
  | "MOVING"
  | "TURN_END"
  | "FINISHED"

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

Before implementation, decide whether `sessionId` must be omitted from public room snapshots. The likely answer is yes: controllers should receive their own private session token separately, while shared snapshots contain only public player data.

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

### `player.ready`

Marks a joined controller as ready after it reaches the lobby.

### `game.start`

Host-only. Valid only during `LOBBY` with at least one player.

### `game.restart`

Host-only. Returns every player to the starting tile while preserving the room and membership.

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
  timeoutAt: number
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
- Reject unknown event payload fields where practical.
- Never trust a client-provided player ID, dice value, tile ID, or turn number as authority.
