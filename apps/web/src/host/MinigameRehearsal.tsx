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

// Development-only art inspection. This never connects to or changes a live room.
export default function MinigameRehearsal() {
  const [selection, setKind] = useState<MinigameKind | "potato" | "characters" | "shop">("fishing")
  const kind = selection === "characters" || selection === "shop" ? "fishing" : selection
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
  const state: GameState = {
    ...fixture,
    phase: kind === "potato" ? "POTATO" : "MINIGAME",
    roundNumber: 1,
    ...(kind === "potato"
      ? {
          potato: {
            id: "00000000-0000-4000-8000-000000000001",
            stage: "active" as const,
            participantIds: fixture.players.map((p) => p.id),
            aliveIds: fixture.players.map((p) => p.id),
            holderId: fixture.players[Math.floor(elapsed / 2500) % 4]!.id,
            winnerId: null,
            eliminatedId: null,
            endsAt: now + 10000,
            fuseAt: now + 10000,
            revision: 0,
          },
        }
      : {
          minigame: {
            id: "00000000-0000-4000-8000-000000000001",
            kind,
            stage: "active" as const,
            startsAt: started,
            endsAt: now + 20000,
            durationMs: 10000000,
            winnerIds: [],
            revision: 0,
            players: fixture.players.map((p, i) => ({
              playerId: p.id,
              score:
                kind === "archery" ? 100 : kind === "rhythm" ? 200 : kind === "fishing" ? 100 : 4,
              alive: true,
              axis: Math.sin(elapsed / 1000 + i) * 0.4,
              position: Math.sin(elapsed / 1000 + i) * 0.35,
              actionAt:
                kind === "rhythm"
                  ? started + Math.floor(elapsed / 750) * 750
                  : started + cycle * 4000 + (kind === "fishing" && age >= 3000 ? 3000 : 0),
              attempts: 1,
              status:
                kind === "fishing"
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
      : state
  return (
    <main className="host-shell">
      {selection === "characters" ? (
        <CharacterStudy />
      ) : (
        <BoardScene state={displayState} movingPlayerId={null} />
      )}
      <header className="topbar">
        <div className="brand">Art rehearsal · simulated inputs</div>
        <select
          aria-label="Preview game"
          value={selection}
          onChange={(event) => {
            const value = event.target.value
            setKind(
              value === "characters" || value === "potato" || value === "shop"
                ? value
                : minigameKindSchema.parse(value),
            )
            setStarted(Date.now())
          }}
        >
          <option value="potato">Hot Potato</option>
          <option value="characters">Character study</option>
          <option value="shop">Wildwood Market</option>
          {Object.entries(MINIGAMES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name}
            </option>
          ))}
        </select>
      </header>
      {selection === "shop" ? (
        <PartyOverlay state={displayState} />
      ) : (
        selection !== "characters" &&
        kind !== "potato" && <MinigameOverlay key={kind} state={state} />
      )}
    </main>
  )
}
