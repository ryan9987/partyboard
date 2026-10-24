import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { GameServer } from "../../apps/server/src/game/game-server"
import {
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
  type Item,
} from "../../packages/protocol/src"

let server: GameServer
let state: GameState
let room: ReturnType<typeof roomCreatedEventSchema.parse>
let players: Array<ReturnType<typeof roomJoinedEventSchema.parse>>
let errors: string[]
let nextDice: number

beforeEach(() => {
  vi.useFakeTimers()
  players = []
  errors = []
  nextDice = 6
  server = new GameServer({
    roundGame: "potato",
    dice: () => nextDice,
    rollDurationMs: 10,
    millisecondsPerTile: 5,
    turnEndMs: 10,
    duelIntroMs: 10,
    duelDurationMs: 10,
    duelResultMs: 10,
    shopDurationMs: 1000,
    potatoIntroMs: 100,
    potatoFuseMs: 500,
    potatoResultMs: 100,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (event === "game.error") errors.push((payload as { code: string }).code)
    },
  })
  server.handle("host", "room.create", {})
})
afterEach(() => {
  server.dispose()
  vi.useRealTimers()
})
function setup(count = 2) {
  for (const [index, color] of (["coral", "cyan", "gold", "violet"] as const)
    .slice(0, count)
    .entries())
    server.handle(`p${index}`, "room.join", {
      roomCode: room.roomCode,
      name: `Player ${index}`,
      color,
    })
  server.handle("host", "game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
}
function command(
  index: number,
  event: string,
  fields: Record<string, unknown>,
  requestId = randomUUID(),
) {
  server.handle(`p${index}`, event, {
    roomCode: room.roomCode,
    playerSessionId: players[index]!.playerSessionId,
    requestId,
    ...fields,
  })
  return requestId
}
function roll(index: number, value = 6) {
  nextDice = value
  command(index, "dice.roll.request", {})
}
function shop(
  index: number,
  item: Item | "skip",
  requestId = randomUUID(),
  visitId = state.shop!.id,
) {
  return command(index, "shop.choice", { visitId, item }, requestId)
}
function settle(stopAtPotato = false) {
  for (let step = 0; step < 2000; step++) {
    if (state.phase === "AWAITING_ROLL" || (stopAtPotato && state.phase === "POTATO")) return
    if (state.phase === "SHOP")
      shop(
        players.findIndex((player) => player.playerId === state.shop!.playerId),
        "skip",
      )
    else vi.advanceTimersByTime(10)
  }
  throw new Error("Game did not settle")
}
function play(index: number, value = 6, stopAtPotato = false) {
  roll(index, value)
  settle(stopAtPotato)
}
function use(index: number, item: Item, target?: number) {
  command(index, "item.use", {
    item,
    turnNumber: state.turnNumber,
    ...(target !== undefined ? { targetId: players[target]!.playerId } : {}),
  })
}

it("pauses at a passed shop, buys once, and finishes the original path without an extra roll", () => {
  setup()
  roll(0)
  vi.advanceTimersByTime(25)
  expect(state.phase).toBe("SHOP")
  expect(state.players[0]!.tileId).toBe("tile-3")
  shop(1, "boots")
  expect(errors.at(-1)).toBe("INVALID_SHOP")
  const visitId = state.shop!.id
  const id = shop(0, "boots")
  shop(0, "boots", id, visitId)
  expect(state.players[0]).toMatchObject({ coins: 2, inventory: ["boots"] })
  settle()
  expect(state.players[0]).toMatchObject({ tileId: "tile-6", coins: 3 })
  expect(state.currentPlayerId).toBe(players[1]!.playerId)
})

it("auto-skips expired shops and still finishes a disconnected player's movement", () => {
  setup()
  roll(0)
  vi.advanceTimersByTime(25)
  const visitId = state.shop!.id
  vi.advanceTimersByTime(1000)
  settle()
  expect(state.players[0]!.tileId).toBe("tile-6")
  shop(0, "freeze", randomUUID(), visitId)
  expect(errors.at(-1)).toBe("INVALID_SHOP")
  play(1, 1)
  roll(0)
  vi.advanceTimersByTime(10)
  server.disconnect("p0")
  settle()
  expect(state.players[0]!.tileId).toBe("tile-12")
})

it("consumes Boots once and applies exactly two additional spaces", () => {
  setup()
  roll(0)
  vi.advanceTimersByTime(25)
  shop(0, "boots")
  settle()
  play(1, 1)
  use(0, "boots")
  expect(state.players[0]).toMatchObject({ inventory: [], boosted: true })
  use(0, "boots")
  expect(errors.at(-1)).toBe("ITEM_NOT_OWNED")
  play(0, 1)
  expect(state.players[0]).toMatchObject({ tileId: "tile-9", boosted: false })
})

it("freezes precisely one board turn and resumes the round without losing turn order", () => {
  setup()
  roll(0)
  vi.advanceTimersByTime(25)
  shop(0, "freeze")
  settle()
  play(1, 1)
  use(0, "freeze", 1)
  expect(state.players[1]!.frozen).toBe(true)
  const before = state.turnNumber
  play(0, 1)
  expect(state.currentPlayerId).toBe(players[0]!.playerId)
  expect(state.turnNumber).toBe(before + 2)
  expect(state.players[1]).toMatchObject({ frozen: false, tileId: "tile-1" })
})

it("consumes a shield when it blocks sabotage and leaves the protected player unfrozen", () => {
  setup()
  roll(0)
  vi.advanceTimersByTime(25)
  shop(0, "freeze")
  settle()
  roll(1)
  vi.advanceTimersByTime(25)
  shop(1, "shield")
  settle()
  play(0, 1)
  use(1, "shield")
  play(1, 1)
  use(0, "freeze", 1)
  expect(state.players[0]!.inventory).toEqual([])
  expect(state.players[1]).toMatchObject({ shield: false, frozen: false })
  expect(state.notice).toContain("blocked")
})

it("limits inventory to three items without charging for a rejected fourth purchase", () => {
  setup()
  for (let turn = 0; turn < 4; turn++) {
    roll(0)
    for (
      let step = 0;
      step < 10 && state.phase !== "SHOP" && state.phase !== "AWAITING_ROLL";
      step++
    )
      vi.advanceTimersByTime(10)
    if (state.phase === "SHOP") shop(0, "boots")
    settle()
    play(1, 1)
  }
  expect(state.players[0]!.inventory).toHaveLength(3)
  roll(0)
  vi.advanceTimersByTime(30)
  expect(state.phase).toBe("SHOP")
  const coins = state.players[0]!.coins
  shop(0, "boots")
  expect(errors.at(-1)).toBe("INVENTORY_FULL")
  expect(state.players[0]!.coins).toBe(coins)
})

it("starts Hot Potato only after all four turns, passes by current revision, and pays rewards once", () => {
  setup(4)
  for (let index = 0; index < 3; index++) {
    play(index, index + 1, true)
    expect(state.phase).toBe("AWAITING_ROLL")
  }
  play(3, 4, true)
  expect(state.potato).toMatchObject({
    stage: "intro",
    participantIds: players.map((player) => player.playerId),
  })
  vi.advanceTimersByTime(100)
  const game = state.potato!
  const holder = players.findIndex((player) => player.playerId === game.holderId)
  const revision = game.revision
  const id = command(holder, "potato.pass", { gameId: game.id, revision })
  expect(state.potato!.holderId).not.toBe(players[holder]!.playerId)
  command(holder, "potato.pass", { gameId: game.id, revision }, id)
  expect(state.potato!.revision).toBe(revision + 1)
  const newHolder = players.findIndex((player) => player.playerId === state.potato!.holderId)
  command(newHolder, "potato.pass", { gameId: game.id, revision })
  expect(errors.at(-1)).toBe("INVALID_PASS")
  const balances = state.players.map((player) => player.coins!)
  vi.advanceTimersByTime(1500)
  expect(state.potato!.stage).toBe("result")
  const winnerId = state.potato!.winnerId
  expect(state.players.map((player, index) => player.coins! - balances[index]!)).toEqual(
    state.players.map((player) => (player.id === winnerId ? 8 : 2)),
  )
  vi.advanceTimersByTime(100)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.roundNumber).toBe(2)
  expect(state.currentPlayerId).toBe(players[0]!.playerId)
})

it("handles a holder disconnect and clears mini-game and shop timers on restart", () => {
  setup()
  play(0, 1)
  play(1, 2, true)
  vi.advanceTimersByTime(100)
  const holder = players.findIndex((player) => player.playerId === state.potato!.holderId)
  server.disconnect(`p${holder}`)
  expect(state.potato!.stage).toBe("result")
  server.handle("host", "game.restart", { roomCode: room.roomCode, hostToken: room.hostToken })
  vi.advanceTimersByTime(2000)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.potato).toBeNull()
  expect(state.shop).toBeNull()
  expect(
    state.players.every((player) => player.coins === 6 && player.inventory?.length === 0),
  ).toBe(true)
})
