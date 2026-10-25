import {
  diceRolledEventSchema,
  gameErrorEventSchema,
  gameStateSchema,
  hostCommandSchema,
  continueGameRequestSchema,
  playerMovingEventSchema,
  publicPlayerSchema,
  roomCreatedEventSchema,
  turnEndedEventSchema,
  turnStartedEventSchema,
  type GameState,
  type HostCommand,
} from "@party-board/protocol"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createGameSocket, type GameSocket } from "../networking/socket"
import {
  applyDiceRolled,
  applyMovementStarted,
  applyMovementStep,
  applyPlayerUpdate,
  applyTurnEnded,
  applyTurnStarted,
} from "./hostState"
import { usePieceAnimation } from "./usePieceAnimation"
import type { TrailMotion } from "./trailMotion"

export type HostConnectionState = "idle" | "connecting" | "connected" | "disconnected"

type LiveHostGame = {
  busy: boolean
  connectionState: HostConnectionState
  error: string | null
  movingPlayerId: string | null
  motion: TrailMotion | null
  restart: () => void
  start: () => void
  toggleDemo: () => void
  continueGame: () => void
  state: GameState | null
}

const HOST_SESSION_KEY = "party-board.host-session"

function loadHostCredentials(): HostCommand | null {
  try {
    const stored = window.sessionStorage.getItem(HOST_SESSION_KEY)
    if (!stored) return null
    const parsed = hostCommandSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function storeHostCredentials(credentials: HostCommand | null): void {
  if (credentials) {
    window.sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(credentials))
  } else {
    window.sessionStorage.removeItem(HOST_SESSION_KEY)
  }
}

function describeInvalidEvent(eventName: string): string {
  return `The server sent an invalid ${eventName} event.`
}

export function useLiveHostGame(enabled: boolean, serverUrl?: string): LiveHostGame {
  const socket = useMemo<GameSocket | null>(
    () => (enabled && serverUrl ? createGameSocket(serverUrl) : null),
    [enabled, serverUrl],
  )
  const [state, setState] = useState<GameState | null>(null)
  const [hostCredentials, setHostCredentials] = useState<HostCommand | null>(loadHostCredentials)
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<HostConnectionState>(
    socket ? "connecting" : "idle",
  )
  const [error, setError] = useState<string | null>(null)
  const hostCredentialsRef = useRef(hostCredentials)
  const movingPlayerIdRef = useRef<string | null>(null)
  const roomRequestPendingRef = useRef(false)
  const continuePendingRef = useRef<string | null>(null)
  const { animatePath, cancel, motion } = usePieceAnimation()

  useEffect(() => {
    if (!socket) return
    roomRequestPendingRef.current = false

    const handleConnect = () => {
      continuePendingRef.current = null
      setConnectionState("connected")
      setError(null)
      const credentials = hostCredentialsRef.current
      if (credentials) {
        socket.emit("room.host.resume", credentials)
      } else if (!roomRequestPendingRef.current) {
        roomRequestPendingRef.current = true
        socket.emit("room.create", {})
      }
    }
    const handleDisconnect = () => setConnectionState("disconnected")
    const handleConnectError = () => {
      setConnectionState("disconnected")
      setError("The game server is unavailable. Check VITE_SOCKET_URL and start the server.")
    }
    const handleRoomCreated = (payload: unknown) => {
      const result = roomCreatedEventSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("room.created"))
        return
      }

      roomRequestPendingRef.current = false
      const credentials = {
        hostToken: result.data.hostToken,
        roomCode: result.data.roomCode,
      }
      hostCredentialsRef.current = credentials
      setHostCredentials(credentials)
      storeHostCredentials(credentials)
      setError(null)
      setState(result.data.state)
    }
    const handleSnapshot = (payload: unknown) => {
      const result = gameStateSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("room.snapshot"))
        return
      }

      if (continuePendingRef.current !== result.data.waitingForHost?.id)
        continuePendingRef.current = null
      setError(null)
      const movingId = movingPlayerIdRef.current
      if (
        ["LOBBY", "AWAITING_ROLL", "TURN_END", "FINISHED", "SHOP", "POTATO", "MINIGAME"].includes(
          result.data.phase,
        )
      ) {
        cancel()
        movingPlayerIdRef.current = null
        setMovingPlayerId(null)
      }
      setState((current) => {
        if (!current || result.data.phase !== "MOVING" || !movingId) return result.data
        const displayedPlayer = current.players.find((player) => player.id === movingId)
        if (!displayedPlayer) return result.data
        return {
          ...result.data,
          players: result.data.players.map((player) =>
            player.id === movingId ? { ...player, tileId: displayedPlayer.tileId } : player,
          ),
        }
      })
    }
    const handleGameStarted = (payload: unknown) => {
      const result = gameStateSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("game.started"))
        return
      }
      setState(result.data)
    }
    const handlePlayerUpdate = (payload: unknown) => {
      const result = publicPlayerSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("player update"))
        return
      }
      setState((current) => (current ? applyPlayerUpdate(current, result.data) : current))
    }
    const handleDiceRolled = (payload: unknown) => {
      const result = diceRolledEventSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("dice.rolled"))
        return
      }
      setState((current) => (current ? applyDiceRolled(current, result.data) : current))
    }
    const handlePlayerMoving = (payload: unknown) => {
      const result = playerMovingEventSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("player.moving"))
        return
      }

      const event = result.data
      movingPlayerIdRef.current = event.playerId
      setMovingPlayerId(event.playerId)
      setState((current) => (current ? applyMovementStarted(current, event) : current))
      void animatePath(
        event.path,
        event.millisecondsPerTile,
        (tileId) => {
          setState((current) =>
            current ? applyMovementStep(current, event.playerId, tileId) : current,
          )
        },
        event,
      ).then((completed) => {
        if (completed) {
          movingPlayerIdRef.current = null
          setMovingPlayerId(null)
        }
      })
    }
    const handleTurnEnded = (payload: unknown) => {
      const result = turnEndedEventSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("turn.ended"))
        return
      }

      cancel()
      movingPlayerIdRef.current = null
      setMovingPlayerId(null)
      setState((current) => (current ? applyTurnEnded(current, result.data) : current))
    }
    const handleTurnStarted = (payload: unknown) => {
      const result = turnStartedEventSchema.safeParse(payload)
      if (!result.success) {
        setError(describeInvalidEvent("turn.started"))
        return
      }

      cancel()
      movingPlayerIdRef.current = null
      setMovingPlayerId(null)
      setState((current) => (current ? applyTurnStarted(current, result.data) : current))
    }
    const handleGameError = (payload: unknown) => {
      continuePendingRef.current = null
      const result = gameErrorEventSchema.safeParse(payload)
      setError(result.success ? result.data.message : describeInvalidEvent("game.error"))
      if (
        result.success &&
        hostCredentialsRef.current &&
        ["ROOM_NOT_FOUND", "UNAUTHORIZED"].includes(result.data.code)
      ) {
        hostCredentialsRef.current = null
        setHostCredentials(null)
        storeHostCredentials(null)
        roomRequestPendingRef.current = true
        socket.emit("room.create", {})
      }
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("room.created", handleRoomCreated)
    socket.on("room.snapshot", handleSnapshot)
    socket.on("player.joined", handlePlayerUpdate)
    socket.on("player.updated", handlePlayerUpdate)
    socket.on("game.started", handleGameStarted)
    socket.on("turn.started", handleTurnStarted)
    socket.on("dice.rolled", handleDiceRolled)
    socket.on("player.moving", handlePlayerMoving)
    socket.on("turn.ended", handleTurnEnded)
    socket.on("game.error", handleGameError)
    socket.connect()

    return () => {
      cancel()
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [animatePath, cancel, socket])

  const start = useCallback(() => {
    if (!socket || !state || !hostCredentials) return
    socket.emit("game.start", hostCredentials)
  }, [hostCredentials, socket, state])

  const toggleDemo = useCallback(() => {
    if (!socket || !hostCredentials || state?.phase !== "LOBBY" || connectionState !== "connected")
      return
    socket.emit("room.demo", { ...hostCredentials, enabled: !state.demoMode })
  }, [connectionState, hostCredentials, socket, state])

  const restart = useCallback(() => {
    if (!socket || !state || !hostCredentials) return
    cancel()
    movingPlayerIdRef.current = null
    setMovingPlayerId(null)
    socket.emit("game.restart", hostCredentials)
  }, [cancel, hostCredentials, socket, state])

  const continueGame = useCallback(() => {
    if (!socket || !hostCredentials || !state?.waitingForHost || connectionState !== "connected")
      return
    if (continuePendingRef.current === state.waitingForHost.id) return
    continuePendingRef.current = state.waitingForHost.id
    socket.emit(
      "game.continue",
      continueGameRequestSchema.parse({
        ...hostCredentials,
        continueId: state.waitingForHost.id,
      }),
    )
  }, [connectionState, hostCredentials, socket, state])

  return {
    busy: state
      ? ["ROLLING", "MOVING", "TURN_END", "SHOP", "POTATO", "MINIGAME"].includes(state.phase)
      : true,
    connectionState,
    error,
    movingPlayerId,
    motion,
    restart,
    continueGame,
    start,
    toggleDemo,
    state,
  }
}
