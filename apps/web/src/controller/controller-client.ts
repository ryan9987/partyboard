import {
  gameErrorEventSchema,
  gameStateSchema,
  joinRoomRequestSchema,
  roomJoinedEventSchema,
  playerReadyRequestSchema,
  rollRequestSchema,
  duelActionRequestSchema,
  shopChoiceRequestSchema,
  itemUseRequestSchema,
  potatoPassRequestSchema,
  minigameInputRequestSchema,
  type Item,
  type GameState,
  type JoinRoomRequest,
} from "@party-board/protocol"

import type { GameSocket } from "../networking/socket"

export type ControllerView = {
  connection: "connecting" | "connected" | "disconnected"
  state: GameState | null
  playerId: string | null
  joining: boolean
  pending: { requestId: string; turnNumber: number } | null
  pendingItem: { requestId: string; turnNumber: number; item: Item; targetId?: string } | null
  choosingItem: boolean
  error: string | null
}
export type SessionStorage = Pick<Storage, "getItem" | "setItem">

/** randomUUID needs HTTPS in browsers; getRandomValues also supports local HTTP touch demos. */
export function createRollRequestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** One shared request latch protects both touch and motion, including synchronous callbacks. */
export class ControllerClient {
  private pendingShop: { visitId: string; requestId: string } | null = null
  private lastItemInputAt = 0
  private minigameSequence = 0
  private lastPartyInputAt = 0
  private lastDuelActionAt = 0
  private view: ControllerView = {
    connection: "connecting",
    state: null,
    playerId: null,
    joining: false,
    pending: null,
    pendingItem: null,
    choosingItem: false,
    error: null,
  }
  private session: JoinRoomRequest | null = null
  private readonly listeners = new Set<() => void>()
  private readonly cleanups: Array<() => void> = []

  constructor(
    private readonly socket: GameSocket,
    private readonly storage: SessionStorage,
    readonly roomCode: string,
    private readonly newRequestId: () => string = createRollRequestId,
  ) {
    try {
      const restoredRoom =
        roomCode.trim().toUpperCase() || storage.getItem("party-board:controller:last-room") || ""
      const stored = storage.getItem(`party-board:controller:${restoredRoom}`)
      if (stored) {
        const parsed = joinRoomRequestSchema.safeParse(JSON.parse(stored))
        if (
          parsed.success &&
          parsed.data.existingSessionId &&
          parsed.data.roomCode === restoredRoom
        )
          this.session = parsed.data
      }
    } catch {
      /* Storage may be unavailable; joining remains possible for this page session. */
    }
  }

  getSnapshot = (): ControllerView => this.view
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  start(): void {
    if (this.cleanups.length) return
    const connect = () => {
      this.update({ connection: "connected", error: null })
      if (this.session) this.join(this.session)
    }
    const disconnect = () => this.update({ connection: "disconnected", joining: false })
    const connectError = () =>
      this.update({
        connection: "disconnected",
        joining: false,
        error: "Cannot reach the game. Reconnecting…",
      })
    const snapshot = (payload: unknown) => {
      const parsed = gameStateSchema.safeParse(payload)
      if (!parsed.success) {
        this.invalidMessage()
        return
      }
      if (this.session && parsed.data.roomCode !== this.session.roomCode) {
        this.invalidMessage()
        return
      }
      const pending =
        this.view.pending?.turnNumber === parsed.data.turnNumber ? this.view.pending : null
      const sameTurn = parsed.data.turnNumber === this.view.state?.turnNumber
      const itemConfirmed = parsed.data.itemEffect?.id !== this.view.state?.itemEffect?.id
      const pendingItem =
        sameTurn && parsed.data.phase === "AWAITING_ROLL" && !itemConfirmed
          ? this.view.pendingItem
          : null
      const choosingItem =
        sameTurn && parsed.data.phase === "AWAITING_ROLL" && !itemConfirmed
          ? this.view.choosingItem
          : false
      this.update({ state: parsed.data, pending, pendingItem, choosingItem })
    }
    const joined = (payload: unknown) => {
      const parsed = roomJoinedEventSchema.safeParse(payload)
      if (
        !parsed.success ||
        !this.session ||
        parsed.data.state.roomCode !== this.session.roomCode
      ) {
        this.invalidMessage()
        return
      }
      const player = parsed.data.state.players.find((player) => player.id === parsed.data.playerId)
      if (!player) {
        this.invalidMessage()
        return
      }
      this.session = {
        roomCode: parsed.data.state.roomCode,
        name: player.name,
        color: player.color,
        existingSessionId: parsed.data.playerSessionId,
      }
      let storageError: string | null = null
      try {
        this.storage.setItem(
          `party-board:controller:${this.session.roomCode}`,
          JSON.stringify(this.session),
        )
        this.storage.setItem("party-board:controller:last-room", this.session.roomCode)
      } catch {
        storageError = "This browser cannot save your session. Keep this page open to stay joined."
      }
      this.update({ playerId: player.id, joining: false, error: storageError })
      snapshot(parsed.data.state)
      this.socket.emit(
        "player.ready",
        playerReadyRequestSchema.parse({
          roomCode: this.session.roomCode,
          playerSessionId: parsed.data.playerSessionId,
        }),
      )
      // A disconnected request can be retried with its original ID after reattachment.
      if (
        this.view.pending &&
        parsed.data.state.phase === "AWAITING_ROLL" &&
        parsed.data.state.currentPlayerId === player.id
      ) {
        this.emitRoll(this.view.pending.requestId)
      }
      if (
        this.view.pendingItem &&
        parsed.data.state.phase === "AWAITING_ROLL" &&
        parsed.data.state.currentPlayerId === player.id
      )
        this.emitItem()
    }
    const error = (payload: unknown) => {
      const parsed = gameErrorEventSchema.safeParse(payload)
      if (!parsed.success) {
        this.invalidMessage()
        return
      }
      if (["ROOM_NOT_FOUND", "SESSION_NOT_FOUND", "UNAUTHORIZED"].includes(parsed.data.code)) {
        if (this.session) {
          try {
            this.storage.setItem(`party-board:controller:${this.session.roomCode}`, "")
          } catch {
            /* Optional storage. */
          }
        }
        this.session = null
        this.update({
          state: null,
          playerId: null,
          pending: null,
          pendingItem: null,
          choosingItem: false,
        })
      }
      if (parsed.data.requestId === this.pendingShop?.requestId) this.pendingShop = null
      if (parsed.data.requestId === this.view.pendingItem?.requestId)
        this.update({ pendingItem: null })
      this.update({ joining: false, error: parsed.data.message })
      // No retryable error contract exists yet. Keep submitted turns locked.
    }
    this.socket.on("connect", connect)
    this.socket.on("disconnect", disconnect)
    this.socket.on("connect_error", connectError)
    this.socket.on("room.snapshot", snapshot)
    this.socket.on("room.joined", joined)
    this.socket.on("game.error", error)
    this.cleanups.push(
      () => this.socket.off("connect", connect),
      () => this.socket.off("disconnect", disconnect),
      () => this.socket.off("connect_error", connectError),
      () => this.socket.off("room.snapshot", snapshot),
      () => this.socket.off("room.joined", joined),
      () => this.socket.off("game.error", error),
    )
    if (this.socket.connected) connect()
    else this.socket.connect()
  }

  stop(): void {
    this.cleanups.splice(0).forEach((cleanup) => cleanup())
    this.socket.disconnect()
    this.update({ connection: "disconnected", joining: false })
  }

  join(payload: unknown): void {
    const parsed = joinRoomRequestSchema.safeParse(payload)
    if (!parsed.success) {
      this.update({ error: "Enter a four-character room code, name, and color." })
      return
    }
    if (this.view.connection !== "connected") {
      this.update({ error: "Wait for the connection before joining." })
      return
    }
    if (this.view.joining || this.view.playerId) {
      // Automatic reconnect may reattach an existing player; a live player cannot change rooms.
      if (
        !parsed.data.existingSessionId ||
        parsed.data.existingSessionId !== this.session?.existingSessionId
      )
        return
    }
    this.session = parsed.data
    this.update({ joining: true, error: null })
    this.socket.emit("room.join", parsed.data)
  }

  canRoll(): boolean {
    const { state, playerId, connection, pending, joining } = this.view
    return (
      connection === "connected" &&
      !joining &&
      !pending &&
      !this.view.pendingItem &&
      !this.view.choosingItem &&
      !!playerId &&
      state?.phase === "AWAITING_ROLL" &&
      state.currentPlayerId === playerId
    )
  }

  requestRoll(): boolean {
    if (!this.canRoll() || !this.session?.existingSessionId) return false
    let requestId: string
    try {
      requestId = this.newRequestId()
    } catch {
      this.update({ error: "Cannot create a secure roll request in this browser." })
      return false
    }
    this.update({ pending: { requestId, turnNumber: this.view.state!.turnNumber }, error: null })
    this.emitRoll(requestId)
    return true
  }

  canUseItem(): boolean {
    const { state, playerId, connection, pending, pendingItem, joining } = this.view
    return (
      connection === "connected" &&
      !joining &&
      !pending &&
      !pendingItem &&
      !!playerId &&
      state?.phase === "AWAITING_ROLL" &&
      state.currentPlayerId === playerId
    )
  }

  setChoosingItem(choosingItem: boolean): void {
    if (this.view.pendingItem || (choosingItem && !this.canUseItem())) return
    this.update({ choosingItem })
  }

  canDuel(): boolean {
    return (
      this.view.connection === "connected" &&
      !this.view.joining &&
      this.view.state?.phase === "DUEL" &&
      this.view.state.duel?.stage === "active" &&
      this.view.state.duel.fighters.some((fighter) => fighter.playerId === this.view.playerId)
    )
  }

  chooseShop(item: Item | "skip"): boolean {
    const { state, playerId, connection } = this.view
    if (
      connection !== "connected" ||
      state?.phase !== "SHOP" ||
      state.shop?.playerId !== playerId ||
      !this.session?.existingSessionId ||
      this.pendingShop?.visitId === state.shop.id
    )
      return false
    this.pendingShop = { visitId: state.shop.id, requestId: this.newRequestId() }
    this.socket.emit(
      "shop.choice",
      shopChoiceRequestSchema.parse({
        roomCode: this.session.roomCode,
        playerSessionId: this.session.existingSessionId,
        requestId: this.pendingShop.requestId,
        visitId: state.shop.id,
        item,
      }),
    )
    return true
  }

  useItem(item: Item, targetId?: string): boolean {
    const { state, playerId, connection } = this.view
    if (
      connection !== "connected" ||
      !this.canUseItem() ||
      state?.phase !== "AWAITING_ROLL" ||
      state.currentPlayerId !== playerId ||
      !this.session?.existingSessionId ||
      Date.now() - this.lastItemInputAt < 350 ||
      !state.players.find((player) => player.id === playerId)?.inventory?.includes(item)
    )
      return false
    this.lastItemInputAt = Date.now()
    const requestId = this.newRequestId()
    this.update({
      pendingItem: {
        requestId,
        turnNumber: state.turnNumber,
        item,
        ...(targetId ? { targetId } : {}),
      },
      error: null,
    })
    this.emitItem()
    return true
  }

  private emitItem(): void {
    const pending = this.view.pendingItem
    if (!pending || !this.session?.existingSessionId) return
    this.socket.emit(
      "item.use",
      itemUseRequestSchema.parse({
        roomCode: this.session.roomCode,
        playerSessionId: this.session.existingSessionId,
        ...pending,
      }),
    )
  }

  canPass(): boolean {
    const { state, playerId, connection } = this.view
    return (
      connection === "connected" &&
      state?.phase === "POTATO" &&
      state.potato?.stage === "active" &&
      state.potato.holderId === playerId
    )
  }

  minigameInput(axis: number, action = false): boolean {
    if (!Number.isFinite(axis)) return false
    const { state, playerId, connection } = this.view
    if (
      connection !== "connected" ||
      state?.phase !== "MINIGAME" ||
      state.minigame?.stage !== "active" ||
      !state.minigame.players.some((entry) => entry.playerId === playerId && entry.alive) ||
      !this.session?.existingSessionId
    )
      return false
    this.socket.emit(
      "minigame.input",
      minigameInputRequestSchema.parse({
        roomCode: this.session.roomCode,
        playerSessionId: this.session.existingSessionId,
        requestId: this.newRequestId(),
        gameId: state.minigame.id,
        sequence: this.minigameSequence++,
        axis: Math.max(-1, Math.min(1, axis)),
        action,
      }),
    )
    return true
  }

  passPotato(): boolean {
    if (
      !this.canPass() ||
      !this.session?.existingSessionId ||
      Date.now() - this.lastPartyInputAt < 400
    )
      return false
    const game = this.view.state!.potato!
    this.lastPartyInputAt = Date.now()
    this.socket.emit(
      "potato.pass",
      potatoPassRequestSchema.parse({
        roomCode: this.session.roomCode,
        playerSessionId: this.session.existingSessionId,
        requestId: this.newRequestId(),
        gameId: game.id,
        revision: game.revision,
      }),
    )
    return true
  }

  requestDuelAction(action: "swing" | "guard"): boolean {
    if (
      !this.canDuel() ||
      !this.session?.existingSessionId ||
      Date.now() - this.lastDuelActionAt < 900
    )
      return false
    const payload = duelActionRequestSchema.parse({
      roomCode: this.session.roomCode,
      playerSessionId: this.session.existingSessionId,
      requestId: this.newRequestId(),
      duelId: this.view.state!.duel!.id,
      action,
    })
    this.lastDuelActionAt = Date.now()
    this.socket.emit("duel.action", payload)
    return true
  }

  private emitRoll(requestId: string): void {
    const parsed = rollRequestSchema.safeParse({
      roomCode: this.session?.roomCode,
      playerSessionId: this.session?.existingSessionId,
      requestId,
    })
    if (!parsed.success) {
      this.update({ error: "Cannot create a roll request. Reload in a supported browser." })
      return
    }
    this.socket.emit("dice.roll.request", parsed.data)
  }

  private invalidMessage(): void {
    this.update({
      state: null,
      error: "Received an invalid game update. Reconnect before continuing.",
    })
  }
  private update(patch: Partial<ControllerView>): void {
    this.view = { ...this.view, ...patch }
    for (const listener of this.listeners) listener()
  }
}
