import { randomUUID } from "node:crypto"
import { afterEach, expect, it, vi } from "vitest"
import { GameServer } from "../../apps/server/src/game/game-server"
import {
  gameStateSchema,
  minigameKindSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
} from "../../packages/protocol/src"

let server: GameServer
afterEach(() => {
  server?.dispose()
  vi.useRealTimers()
})

function setup(count = 1) {
  vi.useFakeTimers()
  let state: GameState
  let room: ReturnType<typeof roomCreatedEventSchema.parse>
  const players: Array<ReturnType<typeof roomJoinedEventSchema.parse>> = []
  const errors: string[] = []
  let die = 6
  server = new GameServer({
    dice: () => die,
    rollDurationMs: 1,
    millisecondsPerTile: 1,
    turnEndMs: 1,
    shopDurationMs: 1,
    roundGame: "archery",
    minigameIntroMs: 1,
    minigameDurationMs: 1,
    minigameResultMs: 1,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (event === "game.error") errors.push((payload as { code: string }).code)
    },
  })
  server.handle("host", "room.create", {})
  for (const [i, color] of (["coral", "cyan", "gold", "violet"] as const).slice(0, count).entries())
    server.handle(`p${i}`, "room.join", { roomCode: room!.roomCode, name: `Player ${i}`, color })
  const restart = () =>
    server.handle("host", "game.restart", { roomCode: room!.roomCode, hostToken: room!.hostToken })
  restart()
  const command = (i: number, event: string, extra = {}, requestId = randomUUID()) => {
    server.handle(`p${i}`, event, {
      roomCode: room!.roomCode,
      playerSessionId: players[i]!.playerSessionId,
      requestId,
      ...extra,
    })
    return requestId
  }
  const play = (value = 6) => {
    die = value
    const i = players.findIndex((p) => p.playerId === state!.currentPlayerId)
    command(i, "dice.roll.request")
    for (let tick = 0; tick < 1000; tick++) {
      if (state!.phase === "AWAITING_ROLL" || state!.phase === "FINISHED") return
      vi.advanceTimersByTime(1)
    }
    throw new Error("Turn did not settle")
  }
  return { snapshot: () => state!, room: () => room!, players, errors, play, command, restart }
}

it.each([5, 6])(
  "an exact/overshooting %i ends at the finish and persists across reconnect",
  (die) => {
    const game = setup()
    for (let i = 0; i < 7; i++) game.play()
    expect(game.snapshot().players[0]!.tileId).toBe("tile-42")
    game.play(die)
    const finished = game.snapshot()
    expect(finished).toMatchObject({
      phase: "FINISHED",
      winnerId: game.players[0]!.playerId,
      currentPlayerId: game.players[0]!.playerId,
    })
    expect(finished.players[0]).toMatchObject({ tileId: "tile-47", coins: 14 })
    expect(finished.shop).toBeNull()
    game.command(0, "dice.roll.request")
    expect(game.errors.at(-1)).toBe("INVALID_PHASE")
    vi.advanceTimersByTime(60_000)
    expect(game.snapshot()).toEqual(finished)
    server.disconnect("p0")
    server.handle("returning", "room.join", {
      roomCode: game.room().roomCode,
      name: "Ignored",
      color: "gold",
      existingSessionId: game.players[0]!.playerSessionId,
    })
    expect(game.snapshot()).toMatchObject({
      phase: "FINISHED",
      winnerId: game.players[0]!.playerId,
    })
    expect(game.snapshot().players[0]!.coins).toBe(14)
    expect(vi.getTimerCount()).toBe(0)
    game.restart()
    expect(game.snapshot()).toMatchObject({ phase: "AWAITING_ROLL", winnerId: null })
    expect(game.snapshot().players[0]).toMatchObject({ tileId: "tile-0", coins: 6, inventory: [] })
  },
)

it("the first of four players to finish wins before a new round game or next turn", () => {
  const game = setup(4)
  for (let i = 0; i < 28; i++) game.play()
  expect(game.snapshot().players.map((p) => p.tileId)).toEqual(Array(4).fill("tile-42"))
  game.play()
  expect(game.snapshot()).toMatchObject({
    phase: "FINISHED",
    winnerId: game.players[0]!.playerId,
    minigame: null,
    potato: null,
  })
  expect(game.snapshot().players.map((p) => p.tileId)).toEqual([
    "tile-47",
    "tile-42",
    "tile-42",
    "tile-42",
  ])
  const balances = game.snapshot().players.map((p) => p.coins)
  game.command(1, "dice.roll.request")
  vi.advanceTimersByTime(10000)
  expect(game.snapshot().players.map((p) => p.coins)).toEqual(balances)
})

it("rejects the removed Dodge kind and invalid/spurious match winners", () => {
  expect(minigameKindSchema.safeParse("dodge").success).toBe(false)
  const game = setup()
  const state = game.snapshot()
  expect(gameStateSchema.safeParse({ ...state, winnerId: state.players[0]!.id }).success).toBe(
    false,
  )
  expect(gameStateSchema.safeParse({ ...state, phase: "FINISHED" }).success).toBe(false)
  expect(
    gameStateSchema.safeParse({ ...state, phase: "FINISHED", winnerId: "not-a-player" }).success,
  ).toBe(false)
})

it("clamps a Boots-assisted final roll and pays one coin, not one per space", () => {
  const game = setup()
  game.command(0, "dice.roll.request")
  vi.advanceTimersByTime(4)
  expect(game.snapshot().phase).toBe("SHOP")
  game.command(0, "shop.choice", { visitId: game.snapshot().shop!.id, item: "boots" })
  vi.advanceTimersByTime(4)
  for (let i = 0; i < 6; i++) game.play()
  expect(game.snapshot().players[0]!.tileId).toBe("tile-42")
  game.command(0, "item.use", { item: "boots", turnNumber: game.snapshot().turnNumber })
  const coins = game.snapshot().players[0]!.coins!
  game.play(5)
  expect(game.snapshot()).toMatchObject({ phase: "FINISHED", winnerId: game.players[0]!.playerId })
  expect(game.snapshot().players[0]).toMatchObject({
    tileId: "tile-47",
    boosted: false,
    coins: coins + 1,
  })
  expect(game.errors).toEqual([])
})

it("does not pay a completed-turn coin for a disconnected skipped turn", () => {
  const game = setup(2)
  server.disconnect("p0")
  vi.advanceTimersByTime(60_000)
  expect(game.snapshot().currentPlayerId).toBe(game.players[1]!.playerId)
  expect(game.snapshot().players.map((p) => p.coins)).toEqual([6, 6])
})
