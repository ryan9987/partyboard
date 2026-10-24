import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GameServer } from "../../apps/server/src/game/game-server"
import {
  gameErrorEventSchema,
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  PLAYER_COLORS,
  type ServerToClientEvents,
} from "../../packages/protocol/src/index"

type Message = { connection: string; event: keyof ServerToClientEvents; payload: unknown }
let server: GameServer
let messages: Message[]
const last = (connection: string, event: keyof ServerToClientEvents) => {
  const found = messages
    .filter((message) => message.connection === connection && message.event === event)
    .at(-1)
  expect(found, `${event} for ${connection}`).toBeDefined()
  return found!.payload
}
function create() {
  server.handle("host", "room.create", {})
  return roomCreatedEventSchema.parse(last("host", "room.created"))
}
function join(roomCode: string, index: number) {
  const connection = `phone-${index}`
  server.handle(connection, "room.join", {
    roomCode,
    name: `Player ${index}`,
    color: PLAYER_COLORS[index],
  })
  const joined = roomJoinedEventSchema.parse(last(connection, "room.joined"))
  return { ...joined, connection }
}
function setup(count = 4) {
  const created = create()
  const players = Array.from({ length: count }, (_, index) => join(created.roomCode, index))
  server.handle("host", "game.start", { roomCode: created.roomCode, hostToken: created.hostToken })
  return { ...created, players }
}
function snapshot() {
  return gameStateSchema.parse(last("host", "room.snapshot"))
}
function roll(roomCode: string, player: ReturnType<typeof join>, requestId = randomUUID()) {
  server.handle(player.connection, "dice.roll.request", {
    roomCode,
    playerSessionId: player.playerSessionId,
    requestId,
  })
  return requestId
}

beforeEach(() => {
  vi.useFakeTimers()
  messages = []
  server = new GameServer({
    dice: () => 6,
    deliver: (connection, event, payload) => messages.push({ connection, event, payload }),
  })
})
afterEach(() => {
  server.dispose()
  vi.useRealTimers()
})

describe("authoritative room and turn loop", () => {
  it("reattaches an authenticated host without creating or resetting a room", () => {
    const created = create()
    const player = join(created.roomCode, 0)
    server.handle("host", "game.start", {
      roomCode: created.roomCode,
      hostToken: created.hostToken,
    })
    roll(created.roomCode, player)
    server.disconnect("host")

    server.handle("replacement-host", "room.host.resume", {
      roomCode: created.roomCode,
      hostToken: created.hostToken,
    })

    expect(gameStateSchema.parse(last("replacement-host", "room.snapshot"))).toMatchObject({
      roomCode: created.roomCode,
      phase: "ROLLING",
      lastRoll: 6,
    })
    expect(
      messages.filter(
        (message) => message.connection === "replacement-host" && message.event === "room.created",
      ),
    ).toHaveLength(0)

    server.handle("intruder-host", "room.host.resume", {
      roomCode: created.roomCode,
      hostToken: randomUUID(),
    })
    expect(gameErrorEventSchema.parse(last("intruder-host", "game.error")).code).toBe(
      "UNAUTHORIZED",
    )
  })

  it("joins four players privately, normalizes input, rejects full rooms and taken colors", () => {
    const created = create()
    server.handle("phone-0", "room.join", {
      roomCode: created.roomCode.toLowerCase(),
      name: " Jack ",
      color: "coral",
    })
    const joined = roomJoinedEventSchema.parse(last("phone-0", "room.joined"))
    expect(joined.state.players[0]?.name).toBe("Jack")
    expect(joined.playerId).not.toBe("phone-0")
    expect(joined.playerSessionId).not.toBe(joined.playerId)
    server.handle("other", "room.join", {
      roomCode: created.roomCode,
      name: "Other",
      color: "coral",
    })
    expect(gameErrorEventSchema.parse(last("other", "game.error")).code).toBe("COLOR_TAKEN")
    for (let index = 1; index < 4; index++) join(created.roomCode, index)
    server.handle("fifth", "room.join", {
      roomCode: created.roomCode,
      name: "Fifth",
      color: "coral",
    })
    expect(gameErrorEventSchema.parse(last("fifth", "game.error")).code).toBe("ROOM_FULL")
    const publicMessages = messages.filter((message) => message.event === "room.snapshot")
    expect(JSON.stringify(publicMessages)).not.toContain(joined.playerSessionId)
    expect(JSON.stringify(publicMessages)).not.toContain(created.hostToken)
  })

  it("completes five four-player rotations with one result per turn and correct wraparound", () => {
    const { roomCode, players } = setup()
    for (let turn = 0; turn < 20; turn++) {
      const player = players[turn % 4]!
      expect(snapshot().currentPlayerId).toBe(player.playerId)
      const id = roll(roomCode, player)
      roll(roomCode, player, id)
      expect(snapshot().phase).toBe("ROLLING")
      vi.advanceTimersByTime(900)
      expect(snapshot().phase).toBe("MOVING")
      vi.advanceTimersByTime(1800 + 500)
      expect(snapshot().turnNumber).toBe(turn + 2)
      // Old retries remain harmless even when this player becomes active again.
      roll(roomCode, player, id)
    }
    expect(
      messages.filter(
        (message) => message.connection === "host" && message.event === "dice.rolled",
      ),
    ).toHaveLength(20)
    expect(snapshot().players.map((player) => player.tileId)).toEqual(Array(4).fill("tile-30"))
    expect(snapshot().currentPlayerId).toBe(players[0]!.playerId)
  })

  it("wraps the 32-tile board on the sixth six-space roll", () => {
    const { roomCode, players } = setup(1)
    for (let turn = 0; turn < 6; turn++) {
      roll(roomCode, players[0]!)
      vi.advanceTimersByTime(3200)
    }
    expect(last("host", "player.moving")).toMatchObject({
      fromTileId: "tile-30",
      toTileId: "tile-4",
      path: ["tile-31", "tile-0", "tile-1", "tile-2", "tile-3", "tile-4"],
    })
    expect(snapshot().players[0]?.tileId).toBe("tile-4")
    expect(snapshot().turnNumber).toBe(7)
  })

  it("rejects wrong players, forged tokens, duplicate new requests, and invalid payloads", () => {
    const { roomCode, players } = setup(2)
    roll(roomCode, players[1]!)
    expect(gameErrorEventSchema.parse(last(players[1]!.connection, "game.error")).code).toBe(
      "NOT_YOUR_TURN",
    )
    server.handle("intruder", "dice.roll.request", {
      roomCode,
      playerSessionId: players[0]!.playerSessionId,
      requestId: randomUUID(),
    })
    expect(gameErrorEventSchema.parse(last("intruder", "game.error")).code).toBe("UNAUTHORIZED")
    server.handle(players[0]!.connection, "dice.roll.request", {
      roomCode,
      playerSessionId: players[0]!.playerSessionId,
      requestId: randomUUID(),
      value: 6,
    })
    expect(gameErrorEventSchema.parse(last(players[0]!.connection, "game.error")).code).toBe(
      "INVALID_PAYLOAD",
    )
    roll(roomCode, players[0]!)
    roll(roomCode, players[0]!)
    expect(gameErrorEventSchema.parse(last(players[0]!.connection, "game.error")).code).toBe(
      "INVALID_PHASE",
    )
    expect(
      messages.filter(
        (message) => message.connection === "host" && message.event === "dice.rolled",
      ),
    ).toHaveLength(1)
  })

  it("reattaches a session while invalidating the old connection and retaining identity", () => {
    const { roomCode, players } = setup(1)
    const player = players[0]!
    server.handle("replacement", "room.join", {
      roomCode,
      name: "Ignored",
      color: "gold",
      existingSessionId: player.playerSessionId,
    })
    const restored = roomJoinedEventSchema.parse(last("replacement", "room.joined"))
    expect(restored.playerId).toBe(player.playerId)
    expect(restored.state.players[0]?.name).toBe("Player 0")
    server.disconnect(player.connection)
    expect(snapshot().players[0]?.connected).toBe(true)
    roll(roomCode, player)
    expect(gameErrorEventSchema.parse(last(player.connection, "game.error")).code).toBe(
      "UNAUTHORIZED",
    )
    roll(roomCode, { ...player, connection: "replacement" })
    expect(snapshot().phase).toBe("ROLLING")
  })

  it("skips a disconnected active player after grace and resumes when everyone returns", () => {
    const { roomCode, players } = setup(2)
    server.disconnect(players[0]!.connection)
    vi.advanceTimersByTime(59_999)
    expect(snapshot().currentPlayerId).toBe(players[0]!.playerId)
    vi.advanceTimersByTime(1)
    expect(snapshot().currentPlayerId).toBe(players[1]!.playerId)
    server.disconnect(players[1]!.connection)
    vi.advanceTimersByTime(60_000)
    expect(snapshot().currentPlayerId).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    server.handle("back", "room.join", {
      roomCode,
      name: "Player 0",
      color: "coral",
      existingSessionId: players[0]!.playerSessionId,
    })
    expect(snapshot().currentPlayerId).toBe(players[0]!.playerId)
    expect(snapshot().phase).toBe("AWAITING_ROLL")
  })

  it("allows reconnect during movement without duplicate movement or a stuck turn", () => {
    const { roomCode, players } = setup(2)
    const player = players[0]!
    roll(roomCode, player)
    server.disconnect(player.connection)
    vi.advanceTimersByTime(900)
    server.handle("back", "room.join", {
      roomCode,
      name: "Player 0",
      color: "coral",
      existingSessionId: player.playerSessionId,
    })
    const state = roomJoinedEventSchema.parse(last("back", "room.joined")).state
    expect(state.phase).toBe("MOVING")
    expect(state.players[0]?.tileId).toBe("tile-6")
    vi.advanceTimersByTime(2300)
    expect(snapshot().currentPlayerId).toBe(players[1]!.playerId)
  })

  it("enforces host authentication and cancels old animation timers on restart", () => {
    const { roomCode, hostToken, players } = setup(2)
    roll(roomCode, players[0]!)
    server.handle("intruder", "game.restart", { roomCode, hostToken: randomUUID() })
    expect(gameErrorEventSchema.parse(last("intruder", "game.error")).code).toBe("UNAUTHORIZED")
    server.handle("host", "game.restart", { roomCode, hostToken })
    vi.advanceTimersByTime(3200)
    expect(snapshot().phase).toBe("AWAITING_ROLL")
    expect(snapshot().players.every((player) => player.tileId === "tile-0")).toBe(true)
    expect(snapshot().turnNumber).toBe(2)
    expect(messages.filter((message) => message.event === "player.moving")).toHaveLength(0)
  })

  it("times out unsubmitted turns, keeps rooms isolated, and validates readiness", () => {
    const first = setup(1)
    server.handle("host-2", "room.create", {})
    const second = roomCreatedEventSchema.parse(last("host-2", "room.created"))
    expect(second.roomCode).not.toBe(first.roomCode)
    server.handle(first.players[0]!.connection, "player.ready", {
      roomCode: first.roomCode,
      playerSessionId: first.players[0]!.playerSessionId,
    })
    expect(snapshot().players[0]?.ready).toBe(true)
    server.handle(first.players[0]!.connection, "player.ready", {
      roomCode: second.roomCode,
      playerSessionId: first.players[0]!.playerSessionId,
    })
    expect(gameErrorEventSchema.parse(last(first.players[0]!.connection, "game.error")).code).toBe(
      "UNAUTHORIZED",
    )
    vi.advanceTimersByTime(30_000)
    expect(snapshot().turnNumber).toBe(2)
    expect(
      messages.some(
        (message) => message.connection === "host-2" && message.event === "turn.started",
      ),
    ).toBe(false)
  })
})
