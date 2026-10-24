import { defaultBoard, getMovementPath } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { useCallback, useMemo, useState } from "react"

import { buildControllerUrl, createRuntimeConfig } from "../app/runtimeConfig"
import { BoardScene } from "./BoardScene"
import { DemoPreflight } from "./DemoPreflight"
import { DuelOverlay } from "./DuelOverlay"
import { PartyOverlay } from "./PartyOverlay"
import { createFixtureState } from "./fixture"
import { GameOverlay } from "./GameOverlay"
import { LobbyOverlay } from "./LobbyOverlay"
import { useLiveHostGame } from "./useLiveHostGame"
import { usePieceAnimation } from "./usePieceAnimation"

const DICE_DURATION_MS = 900
const MOVEMENT_DURATION_MS = 300
const TURN_END_DURATION_MS = 500
const PENDING_LIVE_STATE: GameState = {
  roomCode: "WAIT",
  phase: "LOBBY",
  players: [],
  currentPlayerId: null,
  turnNumber: 0,
  lastRoll: null,
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function getPreviewDiceValue(): number {
  const sample = new Uint32Array(1)
  window.crypto.getRandomValues(sample)
  return ((sample[0] ?? 0) % 6) + 1
}

export default function HostPage() {
  const runtimeConfig = useMemo(
    () =>
      createRuntimeConfig({
        controllerBaseUrl: import.meta.env.VITE_CONTROLLER_URL as string | undefined,
        isSecureContext: window.isSecureContext,
        origin: window.location.origin,
        socketUrl: import.meta.env.VITE_SOCKET_URL as string | undefined,
      }),
    [],
  )
  const liveMode = Boolean(runtimeConfig.socketUrl)
  const live = useLiveHostGame(liveMode, runtimeConfig.socketUrl ?? undefined)
  const [fixtureState, setFixtureState] = useState<GameState>(() => createFixtureState())
  const [fixtureMovingPlayerId, setFixtureMovingPlayerId] = useState<string | null>(null)
  const [fixtureBusy, setFixtureBusy] = useState(false)
  const [preflightOpen, setPreflightOpen] = useState(
    () => new URLSearchParams(window.location.search).get("preflight") === "1",
  )
  const state = liveMode ? (live.state ?? PENDING_LIVE_STATE) : fixtureState
  const movingPlayerId = liveMode ? live.movingPlayerId : fixtureMovingPlayerId
  const busy = liveMode ? live.busy : fixtureBusy

  const controllerUrl = useMemo(
    () =>
      liveMode && !live.state
        ? null
        : buildControllerUrl(runtimeConfig.controllerBaseUrl, state.roomCode),
    [live.state, liveMode, runtimeConfig.controllerBaseUrl, state.roomCode],
  )

  const { animatePath, cancel } = usePieceAnimation()

  const startPreview = useCallback(() => {
    setFixtureState((current) => ({
      ...current,
      phase: "AWAITING_ROLL",
      currentPlayerId: current.players[0]?.id ?? null,
      turnNumber: 1,
    }))
  }, [])

  const resetPreview = useCallback(() => {
    cancel()
    setFixtureBusy(false)
    setFixtureMovingPlayerId(null)
    setFixtureState(createFixtureState())
  }, [cancel])

  const previewRoll = useCallback(async () => {
    if (fixtureBusy || fixtureState.phase !== "AWAITING_ROLL" || !fixtureState.currentPlayerId)
      return

    const activePlayerId = fixtureState.currentPlayerId
    const activePlayer = fixtureState.players.find((player) => player.id === activePlayerId)
    if (!activePlayer) return

    setFixtureBusy(true)
    const diceValue = getPreviewDiceValue()
    setFixtureState((current) => ({ ...current, phase: "ROLLING", lastRoll: diceValue }))
    await wait(DICE_DURATION_MS)

    const path = getMovementPath(defaultBoard, activePlayer.tileId, diceValue)
    setFixtureMovingPlayerId(activePlayerId)
    setFixtureState((current) => ({ ...current, phase: "MOVING" }))
    const completed = await animatePath(path, MOVEMENT_DURATION_MS, (tileId) => {
      setFixtureState((current) => ({
        ...current,
        players: current.players.map((player) =>
          player.id === activePlayerId ? { ...player, tileId } : player,
        ),
      }))
    })
    if (!completed) return

    setFixtureMovingPlayerId(null)
    setFixtureState((current) => ({ ...current, phase: "TURN_END" }))
    await wait(TURN_END_DURATION_MS)

    setFixtureState((current) => {
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
    setFixtureBusy(false)
  }, [animatePath, fixtureBusy, fixtureState])

  const start = liveMode ? live.start : startPreview
  const reset = liveMode ? live.restart : resetPreview
  const canStart = liveMode
    ? live.connectionState === "connected" &&
      Boolean(live.state) &&
      state.players.some((player) => player.ready)
    : true
  const lobbyDescription = liveMode
    ? (live.error ??
      (live.state
        ? "Scan to join from a phone. Start once at least one connected player is ready."
        : "Connecting to the authoritative game server and creating a room…"))
    : "Scan to join from a phone. Four fixture players are shown for Ryan's host preview."

  return (
    <main className="host-shell">
      <BoardScene movingPlayerId={movingPlayerId} state={state} />

      <header className="topbar">
        <div className="brand">
          <img className="brand__mark" src="/favicon.svg" alt="" width="36" height="36" />
          Party Board
        </div>
        <div className="topbar__actions">
          <span className="fixture-badge">
            <span
              className={`connection-dot connection-dot--${liveMode ? live.connectionState : "preview"}`}
            />
            {liveMode ? live.connectionState : "Preview"}
          </span>
          <DemoPreflight
            config={runtimeConfig}
            connectionState={liveMode ? live.connectionState : "idle"}
            liveMode={liveMode}
            onToggle={() => setPreflightOpen((current) => !current)}
            open={preflightOpen}
            state={state}
          />
        </div>
      </header>

      {state.phase === "SHOP" || state.phase === "POTATO" ? (
        <PartyOverlay state={state} />
      ) : state.phase === "DUEL" && state.duel ? (
        <DuelOverlay state={state} />
      ) : state.phase === "LOBBY" ? (
        <LobbyOverlay
          actionLabel={liveMode ? "Start game" : "Start host preview"}
          controllerUrl={controllerUrl}
          description={lobbyDescription}
          disabled={!canStart}
          onStart={start}
          state={state}
        />
      ) : (
        <GameOverlay
          busy={busy}
          live={liveMode}
          onPreviewRoll={liveMode ? undefined : previewRoll}
          onReset={reset}
          state={state}
        />
      )}
    </main>
  )
}
