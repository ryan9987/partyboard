import { defaultBoard, getMovementPath } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { useCallback, useMemo, useState } from "react"

import { BoardScene } from "./BoardScene"
import { createFixtureState } from "./fixture"
import { GameOverlay } from "./GameOverlay"
import { LobbyOverlay } from "./LobbyOverlay"
import { usePieceAnimation } from "./usePieceAnimation"

const DICE_DURATION_MS = 900
const MOVEMENT_DURATION_MS = 300
const TURN_END_DURATION_MS = 500

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function getPreviewDiceValue(): number {
  const sample = new Uint32Array(1)
  window.crypto.getRandomValues(sample)
  return ((sample[0] ?? 0) % 6) + 1
}

function getControllerUrl(roomCode: string): string {
  const configuredBase = import.meta.env.VITE_CONTROLLER_URL as string | undefined
  const base = configuredBase?.trim() || `${window.location.origin}/controller`
  return `${base.replace(/\/+$/, "")}/${roomCode}`
}

export default function HostPage() {
  const [state, setState] = useState<GameState>(() => createFixtureState())
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const controllerUrl = useMemo(() => getControllerUrl(state.roomCode), [state.roomCode])

  const { animatePath, cancel } = usePieceAnimation()

  const startPreview = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: "AWAITING_ROLL",
      currentPlayerId: current.players[0]?.id ?? null,
      turnNumber: 1,
    }))
  }, [])

  const resetPreview = useCallback(() => {
    cancel()
    setBusy(false)
    setMovingPlayerId(null)
    setState(createFixtureState())
  }, [cancel])

  const previewRoll = useCallback(async () => {
    if (busy || state.phase !== "AWAITING_ROLL" || !state.currentPlayerId) return

    const activePlayerId = state.currentPlayerId
    const activePlayer = state.players.find((player) => player.id === activePlayerId)
    if (!activePlayer) return

    setBusy(true)
    const diceValue = getPreviewDiceValue()
    setState((current) => ({ ...current, phase: "ROLLING", lastRoll: diceValue }))
    await wait(DICE_DURATION_MS)

    const path = getMovementPath(defaultBoard, activePlayer.tileId, diceValue)
    setMovingPlayerId(activePlayerId)
    setState((current) => ({ ...current, phase: "MOVING" }))
    const completed = await animatePath(path, MOVEMENT_DURATION_MS, (tileId) => {
      setState((current) => ({
        ...current,
        players: current.players.map((player) =>
          player.id === activePlayerId ? { ...player, tileId } : player,
        ),
      }))
    })
    if (!completed) return

    setMovingPlayerId(null)
    setState((current) => ({ ...current, phase: "TURN_END" }))
    await wait(TURN_END_DURATION_MS)

    setState((current) => {
      const connectedPlayers = current.players.filter((player) => player.connected)
      const currentIndex = connectedPlayers.findIndex((player) => player.id === activePlayerId)
      const nextPlayer = connectedPlayers[(currentIndex + 1) % connectedPlayers.length]

      return {
        ...current,
        phase: "AWAITING_ROLL",
        currentPlayerId: nextPlayer?.id ?? null,
        turnNumber: current.turnNumber + 1,
      }
    })
    setBusy(false)
  }, [animatePath, busy, state])

  return (
    <main className="host-shell">
      <BoardScene movingPlayerId={movingPlayerId} state={state} />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">PB</span>
          Party Board
        </div>
        <span className="fixture-badge">Ryan lane · fixture preview</span>
      </header>

      {state.phase === "LOBBY" ? (
        <LobbyOverlay controllerUrl={controllerUrl} onStart={startPreview} state={state} />
      ) : (
        <GameOverlay busy={busy} onPreviewRoll={previewRoll} onReset={resetPreview} state={state} />
      )}
    </main>
  )
}
