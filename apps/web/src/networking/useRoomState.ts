import type { GameErrorEvent, GameState } from "@party-board/protocol"
import { useEffect, useState } from "react"

import type { GameSocket } from "./socket"

type ConnectionState = "idle" | "connecting" | "connected" | "disconnected"

export function useRoomState(socket: GameSocket | null) {
  const [roomState, setRoomState] = useState<GameState | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    socket ? (socket.connected ? "connected" : "connecting") : "idle",
  )
  const [error, setError] = useState<GameErrorEvent | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setConnectionState("connected")
    const handleDisconnect = () => setConnectionState("disconnected")
    const handleSnapshot = (snapshot: GameState) => setRoomState(snapshot)
    const handleError = (nextError: GameErrorEvent) => setError(nextError)

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("room.snapshot", handleSnapshot)
    socket.on("game.error", handleError)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("room.snapshot", handleSnapshot)
      socket.off("game.error", handleError)
    }
  }, [socket])

  return { connectionState, error, roomState }
}
