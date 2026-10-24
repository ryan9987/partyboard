import { randomInt, randomUUID } from "node:crypto"

import { defaultBoard, getMovementPath } from "@party-board/board"
import {
  CLIENT_EVENTS,
  diceRolledEventSchema,
  gameErrorEventSchema,
  gameStateSchema,
  hostCommandSchema,
  joinRoomRequestSchema,
  playerMovingEventSchema,
  playerReadyRequestSchema,
  publicPlayerSchema,
  rollRequestSchema,
  roomCreatedEventSchema,
  roomCreateRequestSchema,
  roomJoinedEventSchema,
  turnEndedEventSchema,
  turnStartedEventSchema,
  type GameState,
  type PublicPlayer,
  type ServerToClientEvents,
} from "@party-board/protocol"

const outputSchemas = {
  "room.created": roomCreatedEventSchema,
  "room.joined": roomJoinedEventSchema,
  "room.snapshot": gameStateSchema,
  "player.joined": publicPlayerSchema,
  "player.updated": publicPlayerSchema,
  "game.started": gameStateSchema,
  "turn.started": turnStartedEventSchema,
  "dice.rolled": diceRolledEventSchema,
  "player.moving": playerMovingEventSchema,
  "turn.ended": turnEndedEventSchema,
  "game.error": gameErrorEventSchema,
}

type EventName = keyof ServerToClientEvents
export type Deliver = (connectionId: string, event: EventName, payload: unknown) => void

type Session = { playerId: string; connectionId: string | null }
type Room = {
  state: GameState
  hostToken: string
  sessions: Map<string, Session>
  connections: Set<string>
  acceptedRequests: Set<string>
  timer: ReturnType<typeof setTimeout> | null
}
type Binding = { room: Room; sessionId: string | null }

export type GameServerOptions = {
  deliver: Deliver
  dice?: () => number
  rollDurationMs?: number
  millisecondsPerTile?: number
  turnEndMs?: number
  rollTimeoutMs?: number
  disconnectTimeoutMs?: number
}

class CommandError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Transport-independent authority. Connection IDs are attachments, never player identities. */
export class GameServer {
  private readonly rooms = new Map<string, Room>()
  private readonly bindings = new Map<string, Binding>()
  private readonly dice: () => number
  private readonly timing: {
    rollDurationMs: number
    millisecondsPerTile: number
    turnEndMs: number
    rollTimeoutMs: number
    disconnectTimeoutMs: number
  }

  constructor(private readonly options: GameServerOptions) {
    this.dice = options.dice ?? (() => randomInt(1, 7))
    this.timing = {
      rollDurationMs: options.rollDurationMs ?? 900,
      millisecondsPerTile: options.millisecondsPerTile ?? 300,
      turnEndMs: options.turnEndMs ?? 500,
      rollTimeoutMs: options.rollTimeoutMs ?? 30_000,
      disconnectTimeoutMs: options.disconnectTimeoutMs ?? 60_000,
    }
    if (Object.values(this.timing).some((value) => !Number.isInteger(value) || value <= 0)) {
      throw new RangeError("Server durations must be positive integer milliseconds")
    }
  }

  /** All untrusted input enters here and is checked using the shared schemas. */
  handle(connectionId: string, event: string, payload: unknown): void {
    let requestId: string | undefined
    try {
      switch (event) {
        case CLIENT_EVENTS.ROOM_CREATE: {
          const parsed = roomCreateRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid create request")
          if (this.bindings.has(connectionId))
            throw new CommandError("ALREADY_JOINED", "Leave the current room first")
          let code: string
          do {
            code = Array.from(
              { length: 4 },
              () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)],
            ).join("")
          } while (this.rooms.has(code))
          const room: Room = {
            state: {
              roomCode: code,
              phase: "LOBBY",
              players: [],
              currentPlayerId: null,
              turnNumber: 0,
              lastRoll: null,
            },
            hostToken: randomUUID(),
            sessions: new Map(),
            connections: new Set([connectionId]),
            acceptedRequests: new Set(),
            timer: null,
          }
          this.rooms.set(code, room)
          this.bindings.set(connectionId, { room, sessionId: null })
          this.send(connectionId, "room.created", {
            roomCode: code,
            hostToken: room.hostToken,
            state: room.state,
          })
          break
        }
        case CLIENT_EVENTS.ROOM_JOIN: {
          const parsed = joinRoomRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid join request")
          const { roomCode, name, color, existingSessionId } = parsed.data
          const room = this.room(roomCode)
          const binding = this.bindings.get(connectionId)
          if (binding && (binding.room !== room || binding.sessionId !== existingSessionId)) {
            throw new CommandError("ALREADY_JOINED", "Leave the current room first")
          }
          let sessionId = existingSessionId
          let session: Session
          if (sessionId) {
            const existing = room.sessions.get(sessionId)
            if (!existing)
              throw new CommandError("SESSION_NOT_FOUND", "This session is no longer available")
            session = existing
            if (existing.connectionId && existing.connectionId !== connectionId) {
              room.connections.delete(existing.connectionId)
              this.bindings.delete(existing.connectionId)
            }
          } else {
            if (room.state.phase !== "LOBBY")
              throw new CommandError("GAME_IN_PROGRESS", "The game has already started")
            if (room.state.players.length >= 4)
              throw new CommandError("ROOM_FULL", "All four controller slots are taken")
            if (room.state.players.some((player) => player.color === color))
              throw new CommandError("COLOR_TAKEN", "Choose another color")
            sessionId = randomUUID()
            const player: PublicPlayer = {
              id: randomUUID(),
              name,
              color,
              connected: true,
              ready: false,
              tileId: defaultBoard.startingTileId,
            }
            room.state.players.push(player)
            session = { playerId: player.id, connectionId }
            room.sessions.set(sessionId, session)
          }
          session.connectionId = connectionId
          const player = this.player(room, session.playerId)
          player.connected = true
          room.connections.add(connectionId)
          this.bindings.set(connectionId, { room, sessionId })
          this.send(connectionId, "room.joined", {
            playerSessionId: sessionId,
            playerId: player.id,
            state: room.state,
          })
          if (room.state.phase === "TURN_END" && room.state.currentPlayerId === null) {
            this.beginTurn(room, player.id)
          } else if (
            room.state.phase === "AWAITING_ROLL" &&
            room.state.currentPlayerId === player.id
          ) {
            this.armRollDeadline(room)
          }
          this.snapshot(room)
          break
        }
        case CLIENT_EVENTS.PLAYER_READY: {
          const parsed = playerReadyRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid ready request")
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          player.ready = true
          this.snapshot(room)
          break
        }
        case CLIENT_EVENTS.GAME_START:
        case CLIENT_EVENTS.GAME_RESTART: {
          const parsed = hostCommandSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid host command")
          const room = this.room(parsed.data.roomCode)
          if (room.hostToken !== parsed.data.hostToken)
            throw new CommandError("UNAUTHORIZED", "Invalid host credentials")
          const binding = this.bindings.get(connectionId)
          if (binding && (binding.room !== room || binding.sessionId !== null))
            throw new CommandError("UNAUTHORIZED", "This connection is a controller")
          if (event === CLIENT_EVENTS.GAME_START && room.state.phase !== "LOBBY")
            throw new CommandError("INVALID_PHASE", "The game has already started")
          const first = room.state.players.find((player) => player.connected)
          if (!first)
            throw new CommandError("NO_PLAYERS", "At least one connected player is required")
          room.connections.add(connectionId)
          this.bindings.set(connectionId, { room, sessionId: null })
          this.clearTimer(room)
          for (const player of room.state.players) player.tileId = defaultBoard.startingTileId
          // Turn numbers remain monotonic across restarts to distinguish delayed UI events.
          room.state.lastRoll = null
          this.beginTurn(room, first.id)
          this.broadcast(room, "game.started", room.state)
          break
        }
        case CLIENT_EVENTS.DICE_ROLL_REQUEST: {
          const parsed = rollRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid roll request")
          requestId = parsed.data.requestId
          const { roomCode, playerSessionId } = parsed.data
          const room = this.room(roomCode)
          const player = this.authorizePlayer(room, connectionId, playerSessionId)
          const key = `${playerSessionId}:${requestId}`
          if (room.acceptedRequests.has(key)) return
          if (room.state.currentPlayerId !== player.id)
            throw new CommandError("NOT_YOUR_TURN", "Wait for your turn")
          if (room.state.phase !== "AWAITING_ROLL")
            throw new CommandError("INVALID_PHASE", "A roll is already in progress")
          const value = this.dice()
          if (!Number.isInteger(value) || value < 1 || value > 6)
            throw new Error("Invalid server dice source")
          const fromTileId = player.tileId
          const path = getMovementPath(defaultBoard, fromTileId, value)
          const toTileId = path[path.length - 1]!
          room.acceptedRequests.add(key)
          this.clearTimer(room)
          room.state.phase = "ROLLING"
          room.state.lastRoll = value
          this.broadcast(room, "dice.rolled", {
            playerId: player.id,
            value,
            turnNumber: room.state.turnNumber,
            rollDurationMs: this.timing.rollDurationMs,
          })
          this.snapshot(room)
          this.schedule(room, this.timing.rollDurationMs, () => {
            room.state.phase = "MOVING"
            // Reconnecting displays can immediately render the authoritative destination.
            player.tileId = toTileId
            this.broadcast(room, "player.moving", {
              playerId: player.id,
              fromTileId,
              toTileId,
              path,
              millisecondsPerTile: this.timing.millisecondsPerTile,
              turnNumber: room.state.turnNumber,
            })
            this.snapshot(room)
            this.schedule(room, value * this.timing.millisecondsPerTile, () => {
              room.state.phase = "TURN_END"
              this.snapshot(room)
              this.schedule(room, this.timing.turnEndMs, () => this.advance(room))
            })
          })
          break
        }
        default:
          throw new CommandError("UNKNOWN_EVENT", "Unsupported game event")
      }
    } catch (error) {
      if (!(error instanceof CommandError)) throw error
      this.send(connectionId, "game.error", {
        code: error.code,
        message: error.message,
        ...(requestId ? { requestId } : {}),
      })
    }
  }

  disconnect(connectionId: string): void {
    const binding = this.bindings.get(connectionId)
    if (!binding) return
    this.bindings.delete(connectionId)
    const { room, sessionId } = binding
    room.connections.delete(connectionId)
    if (!sessionId) return
    const session = room.sessions.get(sessionId)!
    session.connectionId = null
    this.player(room, session.playerId).connected = false
    if (room.state.phase === "AWAITING_ROLL" && room.state.currentPlayerId === session.playerId) {
      this.schedule(room, this.timing.disconnectTimeoutMs, () => this.advance(room))
    }
    this.snapshot(room)
  }

  dispose(): void {
    for (const room of this.rooms.values()) this.clearTimer(room)
    this.rooms.clear()
    this.bindings.clear()
  }

  private room(code: string): Room {
    const room = this.rooms.get(code)
    if (!room) throw new CommandError("ROOM_NOT_FOUND", "This room no longer exists")
    return room
  }

  private player(room: Room, playerId: string): PublicPlayer {
    return room.state.players.find((player) => player.id === playerId)!
  }

  private authorizePlayer(room: Room, connectionId: string, sessionId: string): PublicPlayer {
    const session = room.sessions.get(sessionId)
    const binding = this.bindings.get(connectionId)
    if (
      !session ||
      session.connectionId !== connectionId ||
      binding?.room !== room ||
      binding.sessionId !== sessionId
    ) {
      throw new CommandError("UNAUTHORIZED", "Rejoin with your controller session first")
    }
    return this.player(room, session.playerId)
  }

  private beginTurn(room: Room, playerId: string): void {
    room.state.currentPlayerId = playerId
    room.state.turnNumber += 1
    room.state.phase = "AWAITING_ROLL"
    this.armRollDeadline(room)
    this.snapshot(room)
  }

  private armRollDeadline(room: Room): void {
    const playerId = room.state.currentPlayerId!
    this.broadcast(room, "turn.started", {
      playerId,
      turnNumber: room.state.turnNumber,
      timeoutAt: Date.now() + this.timing.rollTimeoutMs,
    })
    this.schedule(room, this.timing.rollTimeoutMs, () => this.advance(room))
  }

  private advance(room: Room): void {
    const completedPlayerId = room.state.currentPlayerId!
    const index = room.state.players.findIndex((player) => player.id === completedPlayerId)
    let next: PublicPlayer | undefined
    for (let step = 1; step <= room.state.players.length; step++) {
      const candidate = room.state.players[(index + step) % room.state.players.length]!
      if (candidate.connected) {
        next = candidate
        break
      }
    }
    if (!next) {
      room.state.phase = "TURN_END"
      room.state.currentPlayerId = null
      this.snapshot(room)
      return
    }
    this.broadcast(room, "turn.ended", {
      completedPlayerId,
      nextPlayerId: next.id,
      turnNumber: room.state.turnNumber,
    })
    this.beginTurn(room, next.id)
  }

  private clearTimer(room: Room): void {
    if (room.timer !== null) clearTimeout(room.timer)
    room.timer = null
  }

  private schedule(room: Room, delay: number, task: () => void): void {
    this.clearTimer(room)
    room.timer = setTimeout(() => {
      room.timer = null
      task()
    }, delay)
  }

  private send<K extends EventName>(
    connectionId: string,
    event: K,
    payload: Parameters<ServerToClientEvents[K]>[0],
  ): void {
    this.options.deliver(connectionId, event, outputSchemas[event].parse(payload))
  }

  private broadcast<K extends EventName>(
    room: Room,
    event: K,
    payload: Parameters<ServerToClientEvents[K]>[0],
  ): void {
    for (const connectionId of room.connections) this.send(connectionId, event, payload)
  }

  private snapshot(room: Room): void {
    this.broadcast(room, "room.snapshot", room.state)
  }
}
