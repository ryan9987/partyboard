import { describe, expect, it } from "vitest"
import type { GameState, MinigameKind } from "@party-board/protocol"
import { getPlayerHud } from "../apps/web/src/app/playerHud"
import { createFixtureState } from "../apps/web/src/host/fixture"
import { BALANCE_WINNER_REVEAL_MS } from "../apps/web/src/host/balanceFall"

function round(kind: MinigameKind = "fishing"): GameState {
  const fixture = createFixtureState()
  return {
    ...fixture,
    phase: "MINIGAME",
    currentPlayerId: fixture.players[0]!.id,
    minigame: {
      id: "00000000-0000-4000-8000-000000000001",
      kind,
      stage: "active",
      startsAt: 1000,
      endsAt: 21000,
      durationMs: 20000,
      revision: 0,
      winnerIds: [],
      players: fixture.players.map((player) => ({
        playerId: player.id,
        score: 100,
        alive: true,
        axis: 0,
        position: 0,
        actionAt: 2000,
        attempts: 1,
        status: "waiting",
      })),
    },
  }
}

describe("shared host player rail", () => {
  it("shows the authoritative board position and turn without inventing a score", () => {
    const state = createFixtureState()
    state.phase = "AWAITING_ROLL"
    state.currentPlayerId = state.players[0]!.id
    state.players[0]!.tileId = "tile-8"
    expect(getPlayerHud(state, state.players[0]!, 2000)).toEqual({
      label: "Space 08 · your turn",
      score: null,
      unit: "",
      tone: "current",
    })
    expect(getPlayerHud(state, state.players[1]!, 2000).label).toBe("At the start")
  })

  it("keeps coins out of game scores and does not mutate the snapshot", () => {
    const state = round()
    state.players[0]!.coins = 87
    const before = structuredClone(state)
    expect(getPlayerHud(state, state.players[0]!, 2100).score).toBe(100)
    expect(state).toEqual(before)
  })

  it("announces a bite instead of a board turn and clears it on the next snapshot", () => {
    const state = round()
    state.minigame!.players[0]!.status = "bite"
    expect(getPlayerHud(state, state.players[0]!, 2000)).toMatchObject({
      label: "Reel now!",
      tone: "current",
    })
    state.minigame!.players[0]!.status = "caught"
    expect(getPlayerHud(state, state.players[0]!, 2000)).toMatchObject({
      label: "Fish caught!",
      tone: "normal",
    })
  })

  it("does not expose stale intro scores or winner IDs during play", () => {
    const state = round()
    state.minigame!.winnerIds = [state.players[0]!.id]
    expect(getPlayerHud(state, state.players[0]!, 2000).tone).not.toBe("winner")
    state.minigame!.stage = "intro"
    expect(getPlayerHud(state, state.players[0]!, 2000)).toMatchObject({
      label: "Get ready",
      score: null,
    })
  })

  it("shows every tied winner after the result, not just the first ID", () => {
    const state = round("archery")
    state.minigame!.stage = "result"
    state.minigame!.winnerIds = state.players.slice(0, 2).map((player) => player.id)
    expect(state.players.map((player) => getPlayerHud(state, player, 3000).tone)).toEqual([
      "winner",
      "winner",
      "normal",
      "normal",
    ])
  })

  it("preserves the Balance fall reveal before showing a winner badge", () => {
    const state = round("balance")
    state.minigame!.stage = "result"
    state.minigame!.winnerIds = [state.players[0]!.id]
    state.minigame!.players[1]!.alive = false
    state.minigame!.players[1]!.actionAt = 4000
    expect(getPlayerHud(state, state.players[0]!, 4000 + BALANCE_WINNER_REVEAL_MS - 1).tone).toBe(
      "normal",
    )
    expect(getPlayerHud(state, state.players[0]!, 4000 + BALANCE_WINNER_REVEAL_MS).tone).toBe(
      "winner",
    )
    expect(getPlayerHud(state, state.players[1]!, 6000).tone).toBe("out")
  })

  it.each(["balance", "fishing", "archery", "rhythm"] as const)(
    "keeps %s scores available for all four seats",
    (kind) => {
      const state = round(kind)
      expect(state.players.map((player) => getPlayerHud(state, player, 3000).score)).toEqual([
        100, 100, 100, 100,
      ])
    },
  )

  it("reports arrow attempts separately from points", () => {
    const state = round("archery")
    state.minigame!.players[0]!.attempts = 3
    expect(getPlayerHud(state, state.players[0]!, 3000)).toMatchObject({
      label: "3/3 arrows",
      score: 100,
      unit: "points",
    })
  })

  it("clears old mini-game feedback on returning to the board or shop", () => {
    const state = round()
    state.phase = "SHOP"
    expect(getPlayerHud(state, state.players[0]!, 3000)).toMatchObject({
      label: "At the market",
      score: null,
    })
    state.phase = "AWAITING_ROLL"
    expect(getPlayerHud(state, state.players[0]!, 3000).label).toContain("your turn")
  })

  it("shows disconnected players explicitly without a stale action cue", () => {
    const state = round()
    state.players[0]!.connected = false
    state.minigame!.players[0]!.status = "bite"
    expect(getPlayerHud(state, state.players[0]!, 3000)).toEqual({
      label: "Reconnecting",
      score: null,
      unit: "",
      tone: "out",
    })
  })

  it("identifies the acorn holder, elimination and winner without a second roster", () => {
    const state = createFixtureState()
    const ids = state.players.map((player) => player.id)
    state.phase = "POTATO"
    state.potato = {
      id: "00000000-0000-4000-8000-000000000001",
      stage: "active",
      participantIds: ids,
      aliveIds: ids.slice(0, 3),
      holderId: ids[0]!,
      winnerId: null,
      eliminatedId: ids[3]!,
      endsAt: 10000,
      fuseAt: 9000,
      revision: 0,
    }
    expect(getPlayerHud(state, state.players[0]!, 3000)).toMatchObject({
      label: "Holding the acorn",
      tone: "current",
    })
    expect(getPlayerHud(state, state.players[3]!, 3000).tone).toBe("out")
    state.potato.stage = "result"
    state.potato.winnerId = ids[0]!
    expect(getPlayerHud(state, state.players[0]!, 3000).tone).toBe("winner")
  })
})
