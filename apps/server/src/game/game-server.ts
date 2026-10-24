import { randomInt, randomUUID } from "node:crypto"
import { MinigameRound } from "./minigames"

import { defaultBoard, getMovementPath, SHOP_TILE_IDS } from "@party-board/board"
import {
  CLIENT_EVENTS,
  duelActionRequestSchema,
  shopChoiceRequestSchema,
  itemUseRequestSchema,
  potatoPassRequestSchema,
  minigameInputRequestSchema,
  MINIGAMES,
  type MinigameKind,
  SHOP_ITEMS,
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
  duelRuntime: Map<
    string,
    { nextInputAt: number; guardUntil: number; attackAt: number | null }
  > | null
  remainingPath: string[] | null
  roundCompleted: Set<string>
  nextPassAt: number
  minigameRuntime: MinigameRound | null
  gameBag: Array<MinigameKind | "potato">
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
  duelIntroMs?: number
  duelDurationMs?: number
  duelResultMs?: number
  shopDurationMs?: number
  potatoIntroMs?: number
  potatoFuseMs?: number
  potatoResultMs?: number
  minigameIntroMs?: number
  minigameDurationMs?: number
  minigameResultMs?: number
  roundGame?: MinigameKind | "potato" | ((round: number) => MinigameKind | "potato")
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
    duelIntroMs: number
    duelDurationMs: number
    duelResultMs: number
    shopDurationMs: number
    potatoIntroMs: number
    potatoFuseMs: number
    potatoResultMs: number
    minigameIntroMs: number
    minigameDurationMs: number
    minigameResultMs: number
  }

  constructor(private readonly options: GameServerOptions) {
    this.dice = options.dice ?? (() => randomInt(1, 7))
    this.timing = {
      rollDurationMs: options.rollDurationMs ?? 900,
      millisecondsPerTile: options.millisecondsPerTile ?? 300,
      turnEndMs: options.turnEndMs ?? 500,
      rollTimeoutMs: options.rollTimeoutMs ?? 30_000,
      disconnectTimeoutMs: options.disconnectTimeoutMs ?? 60_000,
      duelIntroMs: options.duelIntroMs ?? 2400,
      duelDurationMs: options.duelDurationMs ?? 25_000,
      duelResultMs: options.duelResultMs ?? 3200,
      shopDurationMs: options.shopDurationMs ?? 8000,
      potatoIntroMs: options.potatoIntroMs ?? 2200,
      potatoFuseMs: options.potatoFuseMs ?? 5000,
      potatoResultMs: options.potatoResultMs ?? 3000,
      minigameIntroMs: options.minigameIntroMs ?? 3500,
      minigameDurationMs: options.minigameDurationMs ?? 20000,
      minigameResultMs: options.minigameResultMs ?? 3500,
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
              roundNumber: 1,
            },
            hostToken: randomUUID(),
            sessions: new Map(),
            connections: new Set([connectionId]),
            acceptedRequests: new Set(),
            timer: null,
            duelRuntime: null,
            remainingPath: null,
            roundCompleted: new Set(),
            nextPassAt: 0,
            minigameRuntime: null,
            gameBag: [],
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
        case CLIENT_EVENTS.HOST_RESUME: {
          const parsed = hostCommandSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid host credentials")
          const room = this.room(parsed.data.roomCode)
          if (room.hostToken !== parsed.data.hostToken)
            throw new CommandError("UNAUTHORIZED", "Invalid host credentials")
          const binding = this.bindings.get(connectionId)
          if (binding && (binding.room !== room || binding.sessionId !== null))
            throw new CommandError("UNAUTHORIZED", "This connection is a controller")
          room.connections.add(connectionId)
          this.bindings.set(connectionId, { room, sessionId: null })
          this.send(connectionId, "room.snapshot", room.state)
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
              coins: 6,
              inventory: [],
              frozen: false,
              shield: false,
              boosted: false,
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
          for (const player of room.state.players) {
            player.tileId = defaultBoard.startingTileId
            player.coins = 6
            player.inventory = []
            player.frozen = false
            player.shield = false
            player.boosted = false
          }
          // Turn numbers remain monotonic across restarts to distinguish delayed UI events.
          room.state.lastRoll = null
          room.state.duel = null
          room.duelRuntime = null
          room.state.shop = null
          room.state.potato = null
          room.state.minigame = null
          room.minigameRuntime = null
          room.gameBag = []
          room.state.roundNumber = 1
          room.state.notice = "A new adventure · everyone starts with 6 coins."
          room.roundCompleted.clear()
          room.remainingPath = null
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
          const path = getMovementPath(defaultBoard, fromTileId, value + (player.boosted ? 2 : 0))
          player.boosted = false
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
            this.movePath(room, player, path)
          })
          break
        }
        case CLIENT_EVENTS.SHOP_CHOICE: {
          const parsed = shopChoiceRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid shop choice")
          requestId = parsed.data.requestId
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          const key = `${parsed.data.playerSessionId}:${requestId}`
          if (room.acceptedRequests.has(key)) return
          if (
            room.state.phase !== "SHOP" ||
            room.state.shop?.id !== parsed.data.visitId ||
            room.state.shop.playerId !== player.id ||
            Date.now() >= room.state.shop.endsAt
          )
            throw new CommandError("INVALID_SHOP", "This shop visit has ended")
          if (parsed.data.item !== "skip") {
            const item = SHOP_ITEMS[parsed.data.item]
            if ((player.coins ?? 0) < item.price)
              throw new CommandError("NOT_ENOUGH_COINS", "Not enough coins for that item")
            if ((player.inventory?.length ?? 0) >= 3)
              throw new CommandError("INVENTORY_FULL", "Your pack holds three items")
            player.coins = (player.coins ?? 0) - item.price
            player.inventory = [...(player.inventory ?? []), parsed.data.item]
            room.state.notice = `${player.name} bought ${item.name}.`
          }
          room.acceptedRequests.add(key)
          this.closeShop(room)
          break
        }
        case CLIENT_EVENTS.ITEM_USE: {
          const parsed = itemUseRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid item request")
          requestId = parsed.data.requestId
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          const key = `${parsed.data.playerSessionId}:${requestId}`
          if (room.acceptedRequests.has(key)) return
          if (
            room.state.phase !== "AWAITING_ROLL" ||
            room.state.currentPlayerId !== player.id ||
            room.state.turnNumber !== parsed.data.turnNumber
          )
            throw new CommandError("INVALID_PHASE", "Use items before rolling on your turn")
          const inventory = player.inventory ?? []
          const index = inventory.indexOf(parsed.data.item)
          if (index < 0) throw new CommandError("ITEM_NOT_OWNED", "That item is not in your pack")
          if (parsed.data.item === "freeze") {
            const target = room.state.players.find(
              (entry) =>
                entry.id === parsed.data.targetId && entry.id !== player.id && entry.connected,
            )
            if (!target || target.frozen)
              throw new CommandError(
                "INVALID_TARGET",
                "Choose a connected opponent who is not frozen",
              )
            if (target.shield) {
              target.shield = false
              room.state.notice = `${target.name}'s Leaf Shield blocked the frost!`
            } else {
              target.frozen = true
              room.state.notice = `${player.name} froze ${target.name}'s next board turn.`
            }
          } else if (parsed.data.item === "boots") {
            if (player.boosted)
              throw new CommandError("EFFECT_ACTIVE", "Boots are already ready for this roll")
            player.boosted = true
            room.state.notice = `${player.name} equipped Trail Boots · next roll +2 spaces.`
          } else {
            if (player.shield)
              throw new CommandError("EFFECT_ACTIVE", "Your shield is already active")
            player.shield = true
            room.state.notice = `${player.name} raised a Leaf Shield.`
          }
          inventory.splice(index, 1)
          player.inventory = inventory
          room.acceptedRequests.add(key)
          this.snapshot(room)
          break
        }
        case CLIENT_EVENTS.MINIGAME_INPUT: {
          const parsed = minigameInputRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid mini-game input")
          requestId = parsed.data.requestId
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          if (room.state.phase !== "MINIGAME" || !room.minigameRuntime)
            throw new CommandError("INVALID_MINIGAME", "This mini-game is no longer active")
          // Monotonic per-game sequences deduplicate without growing the request-ID set at 10Hz.
          room.minigameRuntime.input(player.id, parsed.data, Date.now())
          break
        }
        case CLIENT_EVENTS.POTATO_PASS: {
          const parsed = potatoPassRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid pass request")
          requestId = parsed.data.requestId
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          const game = room.state.potato
          const key = `${parsed.data.playerSessionId}:${requestId}`
          if (room.acceptedRequests.has(key)) return
          if (
            room.state.phase !== "POTATO" ||
            !game ||
            game.id !== parsed.data.gameId ||
            game.stage !== "active" ||
            game.holderId !== player.id ||
            game.revision !== parsed.data.revision
          )
            throw new CommandError("INVALID_PASS", "Only the current holder can pass this acorn")
          if (Date.now() >= game.fuseAt || Date.now() < room.nextPassAt) return
          room.acceptedRequests.add(key)
          const index = game.aliveIds.indexOf(player.id)
          game.holderId = game.aliveIds[(index + 1) % game.aliveIds.length]!
          game.revision++
          room.nextPassAt = Date.now() + 350
          this.snapshot(room)
          break
        }
        case CLIENT_EVENTS.DUEL_ACTION: {
          const parsed = duelActionRequestSchema.safeParse(payload)
          if (!parsed.success) throw new CommandError("INVALID_PAYLOAD", "Invalid duel action")
          requestId = parsed.data.requestId
          const room = this.room(parsed.data.roomCode)
          const player = this.authorizePlayer(room, connectionId, parsed.data.playerSessionId)
          const duel = room.state.duel
          const key = `${parsed.data.playerSessionId}:${requestId}`
          if (room.acceptedRequests.has(key)) return
          if (
            room.state.phase !== "DUEL" ||
            !duel ||
            duel.id !== parsed.data.duelId ||
            duel.stage !== "active"
          )
            throw new CommandError("INVALID_DUEL", "This duel is not accepting actions")
          const fighter = duel.fighters.find((candidate) => candidate.playerId === player.id)
          const runtime = room.duelRuntime?.get(player.id)
          if (!fighter || !runtime)
            throw new CommandError("NOT_A_DUELIST", "Watch this duel from the sidelines")
          const now = Date.now()
          if (now >= duel.stageEndsAt || now < runtime.nextInputAt) return
          room.acceptedRequests.add(key)
          runtime.nextInputAt = now + 900
          fighter.action = parsed.data.action
          fighter.actionAt = now
          if (parsed.data.action === "guard") runtime.guardUntil = now + 700
          else runtime.attackAt = now + 450
          duel.revision++
          this.snapshot(room)
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
    if (room.state.phase === "SHOP" && room.state.shop?.playerId === session.playerId)
      this.closeShop(room)
    if (room.state.potato && room.state.potato.stage !== "result")
      this.removePotatoPlayer(room, session.playerId)
    room.minigameRuntime?.disconnect(session.playerId)
    if (
      room.state.duel &&
      room.state.duel.stage !== "result" &&
      room.state.duel.fighters.some((fighter) => fighter.playerId === session.playerId)
    ) {
      const opponent = room.state.duel.fighters.find(
        (fighter) => fighter.playerId !== session.playerId,
      )!
      this.finishDuel(room, opponent.playerId, "forfeit")
    }
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
    room.state.duel = null
    room.duelRuntime = null
    room.state.currentPlayerId = playerId
    room.state.turnNumber += 1
    room.state.phase = "AWAITING_ROLL"
    const player = this.player(room, playerId)
    if (player.frozen) {
      player.frozen = false
      room.state.phase = "TURN_END"
      room.state.notice = `${player.name} is thawing out · this board turn is skipped.`
      this.snapshot(room)
      this.schedule(room, this.timing.turnEndMs, () => this.advance(room))
      return
    }
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

  private advance(room: Room, completeTurn = true): void {
    const completedPlayerId = room.state.currentPlayerId!
    if (completeTurn) {
      room.roundCompleted.add(completedPlayerId)
      const connected = room.state.players.filter((player) => player.connected)
      if (
        connected.length >= 2 &&
        connected.every((player) => room.roundCompleted.has(player.id))
      ) {
        this.beginRoundGame(room, connected)
        return
      }
    }
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

  private endBoardTurn(room: Room): void {
    room.state.phase = "TURN_END"
    room.state.duel = null
    room.duelRuntime = null
    const current = this.player(room, room.state.currentPlayerId!)
    current.coins = Math.min(999, (current.coins ?? 0) + 1)
    this.snapshot(room)
    this.schedule(room, this.timing.turnEndMs, () => this.advance(room))
  }

  private movePath(room: Room, player: PublicPlayer, path: string[]): void {
    if (!path.length) {
      this.resolveLanding(room, player)
      return
    }
    const shopIndex = player.connected ? path.findIndex((tile) => SHOP_TILE_IDS.includes(tile)) : -1
    const segment = shopIndex < 0 ? path : path.slice(0, shopIndex + 1)
    const rest = path.slice(segment.length)
    const fromTileId = player.tileId
    const toTileId = segment.at(-1)!
    room.state.phase = "MOVING"
    player.tileId = toTileId
    this.broadcast(room, "player.moving", {
      playerId: player.id,
      fromTileId,
      toTileId,
      path: segment,
      millisecondsPerTile: this.timing.millisecondsPerTile,
      turnNumber: room.state.turnNumber,
    })
    this.snapshot(room)
    this.schedule(room, segment.length * this.timing.millisecondsPerTile, () => {
      if (shopIndex >= 0 && player.connected) {
        room.remainingPath = rest
        room.state.phase = "SHOP"
        room.state.shop = {
          id: randomUUID(),
          playerId: player.id,
          tileId: toTileId,
          endsAt: Date.now() + this.timing.shopDurationMs,
        }
        this.snapshot(room)
        this.schedule(room, this.timing.shopDurationMs, () => this.closeShop(room))
      } else if (rest.length) this.movePath(room, player, rest)
      else this.resolveLanding(room, player)
    })
  }

  private closeShop(room: Room): void {
    const remaining = room.remainingPath ?? []
    room.remainingPath = null
    room.state.shop = null
    this.clearTimer(room)
    this.movePath(room, this.player(room, room.state.currentPlayerId!), remaining)
  }

  private resolveLanding(room: Room, player: PublicPlayer): void {
    const opponent = room.state.players.find(
      (other) => other.id !== player.id && other.connected && other.tileId === player.tileId,
    )
    if (opponent && player.connected && player.tileId !== defaultBoard.startingTileId)
      this.beginDuel(room, player, opponent)
    else this.endBoardTurn(room)
  }

  private fuseDelay(): number {
    return this.timing.potatoFuseMs < 1000
      ? this.timing.potatoFuseMs
      : this.timing.potatoFuseMs + randomInt(-900, 901)
  }

  private beginRoundGame(room: Room, players: PublicPlayer[]): void {
    if (!room.gameBag.length) {
      const kinds: Array<MinigameKind | "potato"> = [
        "balance",
        "fishing",
        "dodge",
        "archery",
        "rhythm",
      ]
      for (let i = kinds.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!]
      }
      room.gameBag = ["potato", ...kinds]
    }
    const configured = this.options.roundGame
    const kind =
      typeof configured === "function"
        ? configured(room.state.roundNumber ?? 1)
        : (configured ?? room.gameBag.shift()!)
    if (kind === "potato") {
      this.beginPotato(room, players)
      return
    }
    room.state.phase = "MINIGAME"
    const runtime = new MinigameRound(
      kind,
      players.map((player) => player.id),
      Date.now(),
      this.timing.minigameIntroMs,
      this.timing.minigameDurationMs,
    )
    room.minigameRuntime = runtime
    room.state.minigame = runtime.state
    this.snapshot(room)
    const tick = () => {
      if (room.minigameRuntime !== runtime) return
      if (runtime.tick(Date.now())) {
        runtime.finish(Date.now(), this.timing.minigameResultMs)
        const winners = runtime.state.winnerIds
        for (const entry of runtime.state.players) {
          const player = this.player(room, entry.playerId)
          player.coins = Math.min(999, (player.coins ?? 0) + (winners.includes(player.id) ? 8 : 2))
        }
        room.state.notice = `${MINIGAMES[kind].name} complete · winners +8 coins, everyone else +2.`
        this.snapshot(room)
        this.schedule(room, this.timing.minigameResultMs, () => {
          room.state.minigame = null
          room.minigameRuntime = null
          this.resumeBoard(room)
        })
      } else {
        this.snapshot(room)
        this.schedule(room, 100, tick)
      }
    }
    this.schedule(room, this.timing.minigameIntroMs, tick)
  }

  private resumeBoard(room: Room): void {
    room.state.phase = "TURN_END"
    room.roundCompleted.clear()
    room.state.roundNumber = (room.state.roundNumber ?? 1) + 1
    this.advance(room, false)
  }

  private beginPotato(room: Room, players: PublicPlayer[]): void {
    room.state.phase = "POTATO"
    const ids = players.map((player) => player.id)
    room.state.potato = {
      id: randomUUID(),
      stage: "intro",
      participantIds: ids,
      aliveIds: [...ids],
      holderId: ids[randomInt(ids.length)]!,
      winnerId: null,
      eliminatedId: null,
      endsAt: Date.now() + this.timing.potatoIntroMs,
      fuseAt: Date.now() + this.timing.potatoIntroMs,
      revision: 0,
    }
    this.snapshot(room)
    this.schedule(room, this.timing.potatoIntroMs, () => {
      const game = room.state.potato!
      game.stage = "active"
      game.fuseAt = Date.now() + this.fuseDelay()
      game.endsAt = game.fuseAt
      game.revision++
      room.nextPassAt = 0
      this.snapshot(room)
      this.schedule(room, 50, () => this.tickPotato(room))
    })
  }

  private tickPotato(room: Room): void {
    const game = room.state.potato
    if (!game || game.stage !== "active") return
    if (Date.now() >= game.fuseAt) this.removePotatoPlayer(room, game.holderId!)
    if (game.stage === "active") this.schedule(room, 50, () => this.tickPotato(room))
  }

  private removePotatoPlayer(room: Room, id: string): void {
    const game = room.state.potato!
    if (!game.aliveIds.includes(id)) return
    game.aliveIds = game.aliveIds.filter((playerId) => playerId !== id)
    game.eliminatedId = id
    game.revision++
    if (game.aliveIds.length <= 1) {
      game.stage = "result"
      game.winnerId = game.aliveIds[0] ?? null
      game.holderId = null
      game.endsAt = Date.now() + this.timing.potatoResultMs
      for (const playerId of game.participantIds) {
        const player = this.player(room, playerId)
        player.coins = Math.min(999, (player.coins ?? 0) + (playerId === game.winnerId ? 8 : 2))
      }
      room.state.notice = game.winnerId
        ? `${this.player(room, game.winnerId).name} wins Hot Potato · +8 coins! Everyone else +2.`
        : "Hot Potato ended · +2 participation coins."
      this.snapshot(room)
      this.schedule(room, this.timing.potatoResultMs, () => {
        room.state.potato = null
        this.resumeBoard(room)
      })
    } else {
      if (game.holderId === id) game.holderId = game.aliveIds[randomInt(game.aliveIds.length)]!
      game.fuseAt = Date.now() + this.fuseDelay()
      game.endsAt = game.fuseAt
      this.snapshot(room)
    }
  }

  private beginDuel(room: Room, challenger: PublicPlayer, defender: PublicPlayer): void {
    room.state.phase = "DUEL"
    room.state.duel = {
      id: randomUUID(),
      tileId: challenger.tileId,
      stage: "intro",
      fighters: [challenger, defender].map((player) => ({
        playerId: player.id,
        score: 0,
        action: "idle" as const,
        actionAt: 0,
      })) as NonNullable<GameState["duel"]>["fighters"],
      stageEndsAt: Date.now() + this.timing.duelIntroMs,
      winnerId: null,
      loserId: null,
      outcome: "pending",
      revision: 0,
      penaltySpaces: 0,
    }
    room.duelRuntime = new Map(
      [challenger, defender].map((player) => [
        player.id,
        { nextInputAt: 0, guardUntil: 0, attackAt: null },
      ]),
    )
    this.snapshot(room)
    this.schedule(room, this.timing.duelIntroMs, () => {
      const duel = room.state.duel!
      duel.stage = "active"
      duel.stageEndsAt = Date.now() + this.timing.duelDurationMs
      duel.revision++
      this.snapshot(room)
      this.schedule(room, 50, () => this.tickDuel(room))
    })
  }

  private tickDuel(room: Room): void {
    const duel = room.state.duel
    const runtimes = room.duelRuntime
    if (!duel || duel.stage !== "active" || !runtimes) return
    const now = Date.now()
    let changed = false
    for (const fighter of duel.fighters) {
      const attacker = runtimes.get(fighter.playerId)!
      if (attacker.attackAt === null || attacker.attackAt > now) continue
      const opponent = duel.fighters.find((other) => other.playerId !== fighter.playerId)!
      const defender = runtimes.get(opponent.playerId)!
      const impactAt = attacker.attackAt
      attacker.attackAt = null
      if (defender.attackAt !== null && Math.abs(defender.attackAt - impactAt) <= 180) {
        defender.attackAt = null
        duel.outcome = "clash"
      } else if (defender.guardUntil >= impactAt) duel.outcome = "block"
      else {
        fighter.score++
        opponent.action = "hit"
        opponent.actionAt = now
        duel.outcome = "hit"
        if (fighter.score >= 2) {
          this.finishDuel(room, fighter.playerId, "victory")
          return
        }
      }
      changed = true
    }
    if (now >= duel.stageEndsAt) {
      const [first, second] = duel.fighters
      this.finishDuel(
        room,
        first.score === second.score
          ? null
          : first.score > second.score
            ? first.playerId
            : second.playerId,
        "victory",
      )
      return
    }
    if (changed) {
      duel.revision++
      this.snapshot(room)
    }
    this.schedule(room, 50, () => this.tickDuel(room))
  }

  private finishDuel(room: Room, winnerId: string | null, outcome: "victory" | "forfeit"): void {
    const duel = room.state.duel!
    duel.stage = "result"
    duel.winnerId = winnerId
    duel.loserId = winnerId
      ? duel.fighters.find((fighter) => fighter.playerId !== winnerId)!.playerId
      : null
    duel.outcome = winnerId ? outcome : "draw"
    duel.stageEndsAt = Date.now() + this.timing.duelResultMs
    duel.revision++
    if (duel.loserId) {
      const loser = this.player(room, duel.loserId)
      const index = defaultBoard.tiles.findIndex((tile) => tile.id === loser.tileId)
      duel.penaltySpaces = Math.min(3, index)
      loser.tileId = defaultBoard.tiles[Math.max(0, index - 3)]!.id
    }
    this.snapshot(room)
    this.schedule(room, this.timing.duelResultMs, () => this.endBoardTurn(room))
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
    room.state.serverTime = Date.now()
    this.broadcast(room, "room.snapshot", room.state)
  }
}
