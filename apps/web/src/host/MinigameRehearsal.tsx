import {
  MINIGAMES,
  minigameKindSchema,
  type GameState,
  type MinigameKind,
} from "@party-board/protocol"
import { useEffect, useState } from "react"
import { BoardScene } from "./BoardScene"
import { MinigameOverlay } from "./MinigameOverlay"
import { createFixtureState } from "./fixture"
import { CharacterStudy } from "./CharacterStudy"
import { PartyOverlay } from "./PartyOverlay"
import { GameOverlay } from "./GameOverlay"
import { LobbyOverlay } from "./LobbyOverlay"
import { PlayerBalances } from "../app/PlayerBalances"
import "./hud.css"
import { MatchResult } from "./MatchResult"

type PreviewSelection =
  MinigameKind | "potato" | "characters" | "shop" | "board" | "lobby" | "finish"

// Development-only art inspection. This never connects to or changes a live room.
export default function MinigameRehearsal() {
  const [selection, setKind] = useState<PreviewSelection>("fishing")
  const [playerCount, setPlayerCount] = useState(4)
  const kind =
    selection === "characters" ||
    selection === "shop" ||
    selection === "board" ||
    selection === "lobby" ||
    selection === "finish"
      ? "fishing"
      : selection
  const [previewStage, setPreviewStage] = useState<"intro" | "active" | "fall" | "result" | "tie">(
    "active",
  )
  const [started, setStarted] = useState(Date.now)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [])
  const fixture = createFixtureState(playerCount)
  const stressLabels = new URLSearchParams(window.location.search).get("stress") === "1"
  if (stressLabels) {
    fixture.players = fixture.players.map((player) => ({
      ...player,
      name: "AlexandertheExplorer",
      coins: 999,
    }))
  }
  const elapsed = Math.max(0, now - started)
  const cycle = Math.floor(elapsed / 4000)
  const age = elapsed % 4000
  const stage = previewStage === "fall" || previewStage === "tie" ? "result" : previewStage
  const introEndsAt = started + (Math.floor(elapsed / 10000) + 1) * 10000
  const state: GameState = {
    ...fixture,
    serverTime: now,
    phase: kind === "potato" ? "POTATO" : "MINIGAME",
    roundNumber: 1,
    ...(kind === "potato"
      ? {
          potato: {
            id: "00000000-0000-4000-8000-000000000001",
            stage,
            participantIds: fixture.players.map((p) => p.id),
            aliveIds: fixture.players.map((p) => p.id),
            holderId: fixture.players[Math.floor(elapsed / 2500) % fixture.players.length]!.id,
            winnerId: stage === "result" ? fixture.players[0]!.id : null,
            eliminatedId: null,
            endsAt: stage === "intro" ? introEndsAt : now + 10000,
            fuseAt: now + 10000,
            revision: 0,
          },
        }
      : {
          minigame: {
            id: "00000000-0000-4000-8000-000000000001",
            kind,
            stage,
            startsAt: stage === "intro" ? introEndsAt : started,
            endsAt: now + 20000,
            durationMs: 10000000,
            winnerIds:
              previewStage === "tie"
                ? fixture.players.map((p) => p.id)
                : stage === "result"
                  ? [fixture.players[3]!.id]
                  : [],
            revision: 0,
            players: fixture.players.map((p, i) => ({
              playerId: p.id,
              score:
                stressLabels && stage !== "intro"
                  ? 10000
                  : stage === "intro"
                    ? 0
                    : kind === "archery"
                      ? 100
                      : kind === "rhythm"
                        ? 200
                        : kind === "fishing"
                          ? 100
                          : 4,
              alive: !(kind === "balance" && previewStage === "fall" && i < 3),
              axis: Math.sin(elapsed / 1000 + i) * 0.4,
              position:
                kind === "balance" && previewStage === "fall" && i < 3
                  ? i % 2
                    ? -1.15
                    : 1.15
                  : Math.sin(elapsed / 1000 + i) * 0.35,
              actionAt:
                kind === "balance" && previewStage === "fall" && i < 3
                  ? started + 700
                  : kind === "rhythm"
                    ? started + Math.floor(elapsed / 750) * 750
                    : started + cycle * 4000 + (kind === "fishing" && age >= 3000 ? 3000 : 0),
              attempts: stage === "intro" ? 0 : 1,
              status:
                stage === "intro"
                  ? "ready"
                  : kind === "balance" && previewStage === "fall" && i < 3
                    ? "out"
                    : kind === "fishing"
                      ? age < 800
                        ? "casting"
                        : age < 1800
                          ? "waiting"
                          : age < 3000
                            ? "bite"
                            : "caught"
                      : "hit",
            })),
          },
        }),
  }
  const displayState: GameState =
    selection === "shop"
      ? {
          ...fixture,
          phase: "SHOP",
          currentPlayerId: fixture.players[0]!.id,
          players: fixture.players.map((player, i) => ({
            ...player,
            tileId: i === 0 ? "tile-3" : "tile-0",
            coins: 6,
          })),
          shop: {
            id: "00000000-0000-4000-8000-000000000001",
            playerId: fixture.players[0]!.id,
            tileId: "tile-3",
            endsAt: now + 8000,
          },
        }
      : selection === "board" || selection === "lobby" || selection === "finish"
        ? {
            ...fixture,
            phase:
              selection === "finish"
                ? "FINISHED"
                : selection === "board"
                  ? "AWAITING_ROLL"
                  : "LOBBY",
            winnerId: selection === "finish" ? fixture.players[0]!.id : null,
            currentPlayerId: selection === "lobby" ? null : fixture.players[0]!.id,
            turnNumber: 7,
            lastRoll: 5,
            players: fixture.players.map((player, index) => ({
              ...player,
              tileId:
                selection === "finish"
                  ? `tile-${47 - index * 3}`
                  : selection === "board"
                    ? `tile-${4 + index}`
                    : "tile-0",
              coins: 12 + index * 7,
            })),
          }
        : state
  return (
    <main className="host-shell">
      {selection === "characters" ? (
        <CharacterStudy />
      ) : (
        <BoardScene state={displayState} movingPlayerId={null} />
      )}
      <header className="topbar rehearsal-controls">
        <div className="brand">Art rehearsal · simulated inputs</div>
        <select
          aria-label="Preview game"
          value={selection}
          onChange={(event) => {
            const value = event.target.value
            setKind(
              value === "characters" ||
                value === "potato" ||
                value === "shop" ||
                value === "board" ||
                value === "lobby" ||
                value === "finish"
                ? value
                : minigameKindSchema.parse(value),
            )
            setPreviewStage("active")
            setStarted(Date.now())
          }}
        >
          <option value="potato">Hot Potato</option>
          <option value="characters">Character study</option>
          <option value="shop">Wildwood Market</option>
          <option value="board">Board HUD</option>
          <option value="finish">Trail victory</option>
          <option value="lobby">Lobby</option>
          {Object.entries(MINIGAMES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Preview stage"
          value={previewStage}
          onChange={(event) => {
            const value = event.target.value
            if (
              value === "intro" ||
              value === "active" ||
              value === "fall" ||
              value === "result" ||
              value === "tie"
            ) {
              setPreviewStage(value)
              setStarted(Date.now())
            }
          }}
        >
          <option value="intro">Instructions + countdown</option>
          <option value="active">Playing</option>
          {selection === "balance" && <option value="fall">Fall + winner reveal</option>}
          <option value="result">Result</option>
          <option value="tie">Shared victory</option>
        </select>
        <button type="button" onClick={() => setStarted(Date.now())}>
          Replay preview
        </button>
        <select
          aria-label="Preview players"
          value={playerCount}
          onChange={(event) => setPlayerCount(Number(event.target.value))}
        >
          <option value={4}>4 players</option>
          <option value={8}>8 players</option>
        </select>
      </header>
      {selection === "finish" ? (
        <MatchResult state={displayState} onRestart={() => setKind("board")} />
      ) : selection === "board" ? (
        <GameOverlay
          state={displayState}
          busy={false}
          live={false}
          onPreviewRoll={undefined}
          onReset={() => setKind("lobby")}
        />
      ) : selection === "lobby" ? (
        <LobbyOverlay
          state={displayState}
          controllerUrl={null}
          actionLabel="Preview board"
          description="Art rehearsal: simulated players, no live room."
          disabled={false}
          onStart={() => setKind("board")}
        />
      ) : selection === "shop" || selection === "potato" ? (
        <PartyOverlay state={displayState} />
      ) : (
        selection !== "characters" &&
        kind !== "potato" && <MinigameOverlay key={kind} state={state} />
      )}
      {selection !== "characters" && selection !== "lobby" && (
        <PlayerBalances state={displayState} host />
      )}
    </main>
  )
}
