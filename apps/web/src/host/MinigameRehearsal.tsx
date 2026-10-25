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
import { DuelOverlay } from "./DuelOverlay"

// Development-only art inspection. This never connects to or changes a live room.
export default function MinigameRehearsal() {
  const [selection, setKind] = useState<MinigameKind | "potato" | "duel" | "characters" | "shop">(
    "fishing",
  )
  const kind =
    selection === "characters" || selection === "shop" || selection === "duel"
      ? "fishing"
      : selection
  const [previewStage, setPreviewStage] = useState<"intro" | "active" | "fall" | "result">("active")
  const [started, setStarted] = useState(Date.now)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [])
  const fixture = createFixtureState()
  const elapsed = Math.max(0, now - started)
  const cycle = Math.floor(elapsed / 4000)
  const age = elapsed % 4000
  const stage = previewStage === "fall" ? "result" : previewStage
  const introEndsAt = started + (Math.floor(elapsed / 7000) + 1) * 7000
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
            holderId: fixture.players[Math.floor(elapsed / 2500) % 4]!.id,
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
            winnerIds: stage === "result" ? [fixture.players[3]!.id] : [],
            revision: 0,
            players: fixture.players.map((p, i) => ({
              playerId: p.id,
              score:
                stage === "intro"
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
    selection === "duel"
      ? {
          ...fixture,
          serverTime: now,
          phase: "DUEL",
          duel: {
            id: "00000000-0000-4000-8000-000000000001",
            tileId: "tile-1",
            stage,
            fighters: [
              {
                playerId: fixture.players[0]!.id,
                score: 0,
                action: "swing",
                actionAt: started + cycle * 4000,
              },
              {
                playerId: fixture.players[1]!.id,
                score: 0,
                action: "guard",
                actionAt: started + cycle * 4000,
              },
            ],
            stageEndsAt: stage === "intro" ? introEndsAt : now + 10000,
            winnerId: stage === "result" ? fixture.players[0]!.id : null,
            loserId: stage === "result" ? fixture.players[1]!.id : null,
            outcome: stage === "result" ? "victory" : "pending",
            revision: 0,
            penaltySpaces: 3,
          },
        }
      : selection === "shop"
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
              value === "characters" || value === "potato" || value === "shop" || value === "duel"
                ? value
                : minigameKindSchema.parse(value),
            )
            setPreviewStage("active")
            setStarted(Date.now())
          }}
        >
          <option value="potato">Hot Potato</option>
          <option value="duel">Sword duel</option>
          <option value="characters">Character study</option>
          <option value="shop">Wildwood Market</option>
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
            if (value === "intro" || value === "active" || value === "fall" || value === "result") {
              setPreviewStage(value)
              setStarted(Date.now())
            }
          }}
        >
          <option value="intro">Instructions + countdown</option>
          <option value="active">Playing</option>
          {selection === "balance" && <option value="fall">Fall + winner reveal</option>}
          <option value="result">Result</option>
        </select>
        <button type="button" onClick={() => setStarted(Date.now())}>
          Replay preview
        </button>
      </header>
      {selection === "duel" ? (
        <DuelOverlay state={displayState} />
      ) : selection === "shop" || selection === "potato" ? (
        <PartyOverlay state={displayState} />
      ) : (
        selection !== "characters" &&
        kind !== "potato" && <MinigameOverlay key={kind} state={state} />
      )}
    </main>
  )
}
