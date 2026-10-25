import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { randomUUID } from "node:crypto"

import { GameServer } from "../../apps/server/src/game/game-server"
import {
  ControllerClient,
  createRollRequestId,
} from "../../apps/web/src/controller/controller-client"
import type { GameSocket } from "../../apps/web/src/networking/socket"
import { gameStateSchema, roomCreatedEventSchema } from "../../packages/protocol/src/index"

class FakeSocket {
  holdItem = false
  holdShop = false
  connected = false
  dropNextRoll = false
  sent: Array<{ event: string; payload: unknown }> = []
  handlers = new Map<string, Set<(payload?: unknown) => void>>()
  constructor(
    readonly id: string,
    private readonly server: GameServer,
  ) {}
  on(event: string, handler: (payload?: unknown) => void) {
    const set = this.handlers.get(event) ?? new Set()
    set.add(handler)
    this.handlers.set(event, set)
  }
  off(event: string, handler: (payload?: unknown) => void) {
    this.handlers.get(event)?.delete(handler)
  }
  emit(event: string, payload: unknown) {
    this.sent.push({ event, payload })
    if (event === "shop.choice" && this.holdShop) return
    if (event === "item.use" && this.holdItem) return
    if (event === "dice.roll.request" && this.dropNextRoll) {
      this.dropNextRoll = false
      return
    }
    this.server.handle(this.id, event, payload)
  }
  receive(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(payload))
  }
  connect() {
    this.connected = true
    this.receive("connect")
  }
  disconnect() {
    this.connected = false
    this.server.disconnect(this.id)
    this.receive("disconnect")
  }
}
let server: GameServer
let sockets: Map<string, FakeSocket>
let hostMessages: Array<{ event: string; payload: unknown }>
let storage: Map<string, string>
const clients: ControllerClient[] = []

beforeEach(() => {
  vi.useFakeTimers()
  sockets = new Map()
  hostMessages = []
  storage = new Map()
  server = new GameServer({
    manualStageAdvance: false,
    millisecondsPerTile: 300,
    dice: () => 1,
    deliver: (id, event, payload) => {
      if (id === "host") hostMessages.push({ event, payload })
      sockets.get(id)?.receive(event, payload)
    },
  })
})
afterEach(() => {
  clients.splice(0).forEach((client) => client.stop())
  server.dispose()
  vi.useRealTimers()
})
function host() {
  server.handle("host", "room.create", {})
  return roomCreatedEventSchema.parse(
    hostMessages.find((message) => message.event === "room.created")!.payload,
  )
}
function controller(roomCode: string, id = randomUUID()) {
  const socket = new FakeSocket(id, server)
  sockets.set(id, socket)
  const client = new ControllerClient(
    socket as unknown as GameSocket,
    {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value)
      },
    },
    roomCode,
  )
  clients.push(client)
  client.start()
  return { client, socket }
}
function start(room: ReturnType<typeof host>) {
  server.handle("host", "game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
}

it("blocks double-tap shop purchases while waiting for a server response", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  start(room)
  for (let i = 0; i < 2; i++) {
    expect(client.requestRoll()).toBe(true)
    vi.advanceTimersByTime(1800)
  }
  expect(client.requestRoll()).toBe(true)
  vi.advanceTimersByTime(1200)
  expect(client.getSnapshot().state?.phase).toBe("SHOP")
  socket.holdShop = true
  expect(client.chooseShop("boots")).toBe(true)
  expect(client.chooseShop("freeze")).toBe(false)
  const requests = socket.sent.filter((entry) => entry.event === "shop.choice")
  expect(requests).toHaveLength(1)
  server.handle(socket.id, "shop.choice", requests[0]!.payload)
  expect(client.getSnapshot().state?.players[0]?.inventory).toEqual(["boots"])
  expect(client.getSnapshot().error).toBeNull()
  expect(client.minigameInput(NaN)).toBe(false)
})

it("pauses roll and shake input while choosing/activating a power-up and prevents duplicate use", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  start(room)
  for (let i = 0; i < 2; i++) {
    client.requestRoll()
    vi.advanceTimersByTime(1800)
  }
  client.requestRoll()
  vi.advanceTimersByTime(1200)
  client.chooseShop("boots")
  vi.advanceTimersByTime(500)
  expect(client.canRoll()).toBe(true)
  client.setChoosingItem(true)
  expect(client.requestRoll()).toBe(false)
  expect(client.canUseItem()).toBe(true)
  socket.holdItem = true
  expect(client.useItem("boots")).toBe(true)
  expect(client.useItem("boots")).toBe(false)
  expect(client.requestRoll()).toBe(false)
  client.setChoosingItem(false)
  expect(client.getSnapshot().choosingItem).toBe(true)
  const requests = socket.sent.filter((entry) => entry.event === "item.use")
  expect(requests).toHaveLength(1)
  server.handle(socket.id, "item.use", requests[0]!.payload)
  expect(client.getSnapshot()).toMatchObject({ pendingItem: null, choosingItem: false })
  expect(client.getSnapshot().state?.itemEffect?.item).toBe("boots")
  expect(client.canRoll()).toBe(true)
  client.requestRoll()
  expect(client.useItem("boots")).toBe(false)
})

it("retries an undelivered item with the same ID on reconnect without getting stuck", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  start(room)
  for (let i = 0; i < 2; i++) {
    client.requestRoll()
    vi.advanceTimersByTime(1800)
  }
  client.requestRoll()
  vi.advanceTimersByTime(1200)
  client.chooseShop("boots")
  vi.advanceTimersByTime(500)
  socket.holdItem = true
  client.useItem("boots")
  const original = client.getSnapshot().pendingItem!.requestId
  socket.disconnect()
  socket.holdItem = false
  socket.connect()
  expect(client.getSnapshot().pendingItem).toBeNull()
  expect(client.getSnapshot().state?.players[0]?.boosted).toBe(true)
  expect(client.canRoll()).toBe(true)
  expect(
    socket.sent
      .filter((entry) => entry.event === "item.use")
      .map((entry) => (entry.payload as { requestId: string }).requestId),
  ).toEqual([original, original])
})

it("joins, saves a private session, marks ready, and shares one latch for touch and motion", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  expect(client.getSnapshot().state?.players[0]?.ready).toBe(true)
  expect(client.canRoll()).toBe(false)
  start(room)
  expect(client.canRoll()).toBe(true)
  expect(client.requestRoll()).toBe(true)
  expect(client.requestRoll()).toBe(false)
  expect(socket.sent.filter((message) => message.event === "dice.roll.request")).toHaveLength(1)
  vi.advanceTimersByTime(1700)
  expect(client.canRoll()).toBe(true)
  expect(client.getSnapshot().state?.players[0]?.tileId).toBe("tile-1")
})

it("restores identity after refresh, including joining from a manually entered room", () => {
  const room = host()
  const first = controller("")
  first.client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  const playerId = first.client.getSnapshot().playerId
  first.client.stop()
  const second = controller("")
  expect(second.client.getSnapshot().playerId).toBe(playerId)
  expect(second.client.getSnapshot().state?.players).toHaveLength(1)
  expect(second.client.getSnapshot().state?.players[0]?.connected).toBe(true)
})

it("disables rolls while disconnected and automatically reattaches on reconnect", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  start(room)
  const playerId = client.getSnapshot().playerId
  socket.disconnect()
  expect(client.canRoll()).toBe(false)
  expect(client.requestRoll()).toBe(false)
  socket.connect()
  expect(client.getSnapshot().playerId).toBe(playerId)
  expect(client.canRoll()).toBe(true)
})

it("rejects malformed network updates and keeps a rejected roll locked for its turn", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  start(room)
  const state = client.getSnapshot().state
  socket.receive("room.snapshot", { phase: "AWAITING_ROLL" })
  expect(client.getSnapshot().state).toBeNull()
  expect(client.canRoll()).toBe(false)
  expect(client.getSnapshot().error).toContain("invalid game update")
  socket.receive("room.snapshot", state)
  client.requestRoll()
  const pending = client.getSnapshot().pending!
  socket.receive("game.error", {
    code: "INVALID_PHASE",
    message: "Already rolling",
    requestId: pending.requestId,
  })
  socket.receive("room.snapshot", state)
  expect(client.canRoll()).toBe(false)
  expect(client.getSnapshot().pending).toEqual(pending)
})

it("survives unavailable storage and cleans up all socket handlers", () => {
  const room = host()
  const socket = new FakeSocket("blocked-storage", server)
  sockets.set(socket.id, socket)
  const client = new ControllerClient(
    socket as unknown as GameSocket,
    {
      getItem: () => {
        throw Error("blocked")
      },
      setItem: () => {
        throw Error("blocked")
      },
    },
    room.roomCode,
  )
  clients.push(client)
  client.start()
  client.start()
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  expect(client.getSnapshot().playerId).toBeTruthy()
  expect(client.getSnapshot().error).toContain("cannot save your session")
  client.stop()
  expect([...socket.handlers.values()].every((set) => set.size === 0)).toBe(true)
})

it("invalid saved sessions are ignored and another room's updates are rejected", () => {
  const room = host()
  storage.set(
    `party-board:controller:${room.roomCode}`,
    JSON.stringify({ existingSessionId: "fake" }),
  )
  const { client, socket } = controller(room.roomCode)
  expect(client.getSnapshot().playerId).toBeNull()
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  const state = gameStateSchema.parse(client.getSnapshot().state)
  socket.receive("room.snapshot", {
    ...state,
    roomCode: state.roomCode === "ABCD" ? "EFGH" : "ABCD",
  })
  expect(client.getSnapshot().state).toBeNull()
})

it("returns to the join screen when the server loses its in-memory room", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  start(room)
  socket.receive("game.error", { code: "ROOM_NOT_FOUND", message: "This room no longer exists" })
  expect(client.getSnapshot().state).toBeNull()
  expect(client.getSnapshot().playerId).toBeNull()
  expect(client.canRoll()).toBe(false)
  expect(storage.get(`party-board:controller:${room.roomCode}`)).toBe("")
})

it("reattaches after an unauthorized action without erasing the saved player session", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  start(room)
  const saved = storage.get(`party-board:controller:${room.roomCode}`)
  const id = client.getSnapshot().playerId
  socket.receive("game.error", { code: "UNAUTHORIZED", message: "Rejoin first" })
  expect(client.getSnapshot()).toMatchObject({ playerId: id, joining: false, error: null })
  expect(storage.get(`party-board:controller:${room.roomCode}`)).toBe(saved)
  expect(client.requestRoll()).toBe(true)
})

it("hands a session to a replacement tab without kicking it or creating a rejoin loop", () => {
  const room = host()
  const original = controller(room.roomCode)
  original.client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  start(room)
  const saved = storage.get(`party-board:controller:${room.roomCode}`)
  const id = original.client.getSnapshot().playerId
  const replacement = controller(room.roomCode)
  expect(replacement.client.getSnapshot().playerId).toBe(id)
  expect(original.client.getSnapshot().connection).toBe("disconnected")
  expect(original.client.getSnapshot().error).toContain("another tab")
  expect(storage.get(`party-board:controller:${room.roomCode}`)).toBe(saved)
  expect(original.client.requestRoll()).toBe(false)
  expect(replacement.client.requestRoll()).toBe(true)
})

it("creates valid unique request IDs when randomUUID is unavailable on local HTTP", () => {
  const random = crypto.randomUUID
  Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined })
  try {
    const first = createRollRequestId()
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(createRollRequestId()).not.toBe(first)
  } finally {
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: random })
  }
})

it("retries an undelivered pending roll with its original ID after reconnecting", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  start(room)
  socket.dropNextRoll = true
  expect(client.requestRoll()).toBe(true)
  const original = client.getSnapshot().pending!.requestId
  expect(client.getSnapshot().state?.phase).toBe("AWAITING_ROLL")
  socket.disconnect()
  socket.connect()
  const requests = socket.sent.filter((message) => message.event === "dice.roll.request")
  expect(requests).toHaveLength(2)
  expect(requests.map((message) => (message.payload as { requestId: string }).requestId)).toEqual([
    original,
    original,
  ])
  expect(client.getSnapshot().state?.phase).toBe("ROLLING")
  expect(client.canRoll()).toBe(false)
})

it("enables duel input only for participants, shares a cooldown, and disables board rolls", () => {
  const room = host()
  const first = controller(room.roomCode)
  const second = controller(room.roomCode)
  first.client.join({ roomCode: room.roomCode, name: "Ryan", color: "coral" })
  second.client.join({ roomCode: room.roomCode, name: "Jack", color: "cyan" })
  start(room)
  first.client.requestRoll()
  vi.advanceTimersByTime(1700)
  second.client.requestRoll()
  vi.advanceTimersByTime(1200 + 6999)
  expect(first.client.canDuel()).toBe(false)
  expect(second.client.canDuel()).toBe(false)
  vi.advanceTimersByTime(1)
  expect(first.client.canDuel()).toBe(true)
  expect(second.client.canDuel()).toBe(true)
  expect(first.client.canRoll()).toBe(false)
  expect(first.client.requestDuelAction("swing")).toBe(true)
  expect(first.client.requestDuelAction("guard")).toBe(false)
  expect(second.client.requestDuelAction("guard")).toBe(true)
  vi.advanceTimersByTime(450)
  expect(first.client.getSnapshot().state!.duel!.outcome).toBe("block")
  expect(first.socket.sent.filter((message) => message.event === "duel.action")).toHaveLength(1)
  first.socket.disconnect()
  expect(first.client.canDuel()).toBe(false)
  expect(first.client.requestDuelAction("swing")).toBe(false)
})

it("blocks rolls after stopping and restores the same player when restarted", () => {
  const room = host()
  const { client, socket } = controller(room.roomCode)
  client.join({ roomCode: room.roomCode, name: "Jack", color: "coral" })
  start(room)
  const playerId = client.getSnapshot().playerId
  client.stop()
  expect(client.getSnapshot().connection).toBe("disconnected")
  expect(client.requestRoll()).toBe(false)
  expect(socket.sent.some((message) => message.event === "dice.roll.request")).toBe(false)
  client.start()
  expect(client.getSnapshot().playerId).toBe(playerId)
  expect(client.canRoll()).toBe(true)
})
