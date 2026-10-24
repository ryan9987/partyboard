import {
  gameErrorEventSchema,
  gameStateSchema,
  joinRoomRequestSchema,
  roomJoinedEventSchema,
  playerReadyRequestSchema,
  rollRequestSchema,
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
  private view: ControllerView = {
    connection: "connecting",
    state: null,
    playerId: null,
    joining: false,
    pending: null,
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
      this.update({ state: parsed.data, pending })
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
        this.update({ state: null, playerId: null, pending: null })
      }
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
