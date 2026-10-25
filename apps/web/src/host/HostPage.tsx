import { defaultBoard, getMovementPath } from "@party-board/board"
import { GAME_REWARDS, type GameState } from "@party-board/protocol"
import { useCallback, useMemo, useRef, useState } from "react"

import { buildControllerUrl, createRuntimeConfig } from "../app/runtimeConfig"
import { BoardScene } from "./BoardScene"
import { DemoPreflight } from "./DemoPreflight"
import { DuelOverlay } from "./DuelOverlay"
import { PartyOverlay } from "./PartyOverlay"
import { MinigameOverlay } from "./MinigameOverlay"
import { createFixtureState } from "./fixture"
import { GameOverlay } from "./GameOverlay"
import { LobbyOverlay } from "./LobbyOverlay"
import { useLiveHostGame } from "./useLiveHostGame"
import { usePieceAnimation } from "./usePieceAnimation"
import { PlayerBalances } from "../app/PlayerBalances"
import { PowerupNotice } from "../app/PowerupNotice"
import "./hud.css"
import { MatchResult } from "./MatchResult"

const DICE_DURATION_MS = 900
const MOVEMENT_DURATION_MS = 420
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
  const wrapFade = useRef<HTMLDivElement>(null)
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
  // The demo preflight checklist is an operator tool; it only appears with ?preflight=1.
  const [preflightEnabled] = useState(
    () => new URLSearchParams(window.location.search).get("preflight") === "1",
  )
  const [preflightOpen, setPreflightOpen] = useState(preflightEnabled)
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

  const { animatePath, cancel, motion: fixtureMotion } = usePieceAnimation()

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
    const completed = await animatePath(
      path,
      MOVEMENT_DURATION_MS,
      (tileId) => {
        setFixtureState((current) => ({
          ...current,
          players: current.players.map((player) =>
            player.id === activePlayerId ? { ...player, tileId } : player,
          ),
        }))
      },
      {
        playerId: activePlayerId,
        turnNumber: fixtureState.turnNumber,
        fromTileId: activePlayer.tileId,
      },
    )
    if (!completed) return

    setFixtureMovingPlayerId(null)
    const finished = path.at(-1) === defaultBoard.finishTileId
    setFixtureState((current) => ({
      ...current,
      phase: finished ? "FINISHED" : "TURN_END",
      winnerId: finished ? activePlayerId : null,
      players: current.players.map((p) =>
        p.id === activePlayerId
          ? {
              ...p,
              coins: Math.min(
                999,
                (p.coins ?? GAME_REWARDS.startingCoins) + GAME_REWARDS.completedTurn,
              ),
            }
          : p,
      ),
    }))
    if (finished) {
      setFixtureBusy(false)
      return
    }
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
        ? "Join on your phone. Start when your party is ready."
        : "Connecting to the authoritative game server and creating a room…"))
    : "Scan to join from a phone. Four fixture players are shown for Ryan's host preview."
  const sceneKey = state.minigame?.id ?? state.duel?.id ?? state.potato?.id ?? "trail"

  return (
    <main className="host-shell">
      <BoardScene
        movingPlayerId={movingPlayerId}
        state={state}
        motion={liveMode ? live.motion : fixtureMotion}
        wrapFade={wrapFade}
      />
      <div key={sceneKey} className="world-reveal" aria-hidden="true" />
      <div ref={wrapFade} className="world-wrap" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          Partyboard
        </div>
        <div className="topbar__actions">
          {state.roomCode !== "WAIT" && (
            <span className="host-room">
              <span>Room</span>
              {state.roomCode}
            </span>
          )}
          {liveMode && live.connectionState !== "connected" && (
            <span className="connection-notice" role="status">
              {live.connectionState === "disconnected" ? "Reconnecting to server…" : "Connecting…"}
            </span>
          )}
          {preflightEnabled && (
            <DemoPreflight
              config={runtimeConfig}
              connectionState={liveMode ? live.connectionState : "idle"}
              liveMode={liveMode}
              onToggle={() => setPreflightOpen((current) => !current)}
              open={preflightOpen}
              state={state}
            />
          )}
        </div>
      </header>

      {state.phase === "FINISHED" ? (
        <MatchResult state={state} onRestart={reset} />
      ) : state.phase === "MINIGAME" && state.minigame ? (
        <MinigameOverlay state={state} />
      ) : state.phase === "SHOP" || state.phase === "POTATO" ? (
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
          onDemo={liveMode ? live.toggleDemo : undefined}
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
      {state.phase !== "LOBBY" && <PlayerBalances state={state} host />}
      <PowerupNotice state={state} host />
      {state.waitingForHost && (
        <section className="host-continue" aria-label="Continue when ready">
          <span>No rush. Continue when everyone is ready.</span>
          <button
            className="button button--primary"
            type="button"
            disabled={live.connectionState !== "connected"}
            onClick={live.continueGame}
          >
            {state.waitingForHost.label}
          </button>
        </section>
      )}
      {state.phase !== "LOBBY" && live.error && (
        <p className="host-game-error" role="alert">
          {live.error}
        </p>
      )}
    </main>
  )
}
