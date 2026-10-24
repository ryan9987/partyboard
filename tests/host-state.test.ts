import type {
  DiceRolledEvent,
  GameState,
  PlayerMovingEvent,
  PublicPlayer,
  TurnEndedEvent,
  TurnStartedEvent,
} from "@party-board/protocol"
import { describe, expect, it } from "vitest"

import {
  applyDiceRolled,
  applyMovementStarted,
  applyMovementStep,
  applyPlayerUpdate,
  applyTurnEnded,
  applyTurnStarted,
} from "../apps/web/src/host/hostState"

const initialState: GameState = {
  roomCode: "PLAY",
  phase: "AWAITING_ROLL",
  players: [
    {
      id: "player-1",
      name: "Ryan",
      color: "cyan",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
    {
      id: "player-2",
      name: "Jack",
      color: "coral",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
  ],
  currentPlayerId: "player-1",
  turnNumber: 1,
  lastRoll: null,
}

describe("host authoritative event projection", () => {
  it("projects a server dice result without generating a value locally", () => {
    const event: DiceRolledEvent = {
      playerId: "player-1",
      value: 5,
      turnNumber: 1,
      rollDurationMs: 900,
    }

    expect(applyDiceRolled(initialState, event)).toMatchObject({
      phase: "ROLLING",
      currentPlayerId: "player-1",
      lastRoll: 5,
    })
  })

  it("projects each authoritative movement step", () => {
    const event: PlayerMovingEvent = {
      playerId: "player-1",
      fromTileId: "tile-0",
      toTileId: "tile-2",
      path: ["tile-1", "tile-2"],
      millisecondsPerTile: 300,
      turnNumber: 1,
    }

    const moving = applyMovementStarted(initialState, event)
    const firstStep = applyMovementStep(moving, event.playerId, event.path[0]!)
    const finalStep = applyMovementStep(firstStep, event.playerId, event.path[1]!)

    expect(moving.phase).toBe("MOVING")
    expect(firstStep.players[0]?.tileId).toBe("tile-1")
    expect(finalStep.players[0]?.tileId).toBe("tile-2")
  })

  it("moves the display to turn end and ignores stale events", () => {
    const event: TurnEndedEvent = {
      completedPlayerId: "player-1",
      nextPlayerId: "player-2",
      turnNumber: 1,
    }
    const ended = applyTurnEnded(initialState, event)
    const staleRoll: DiceRolledEvent = {
      playerId: "player-1",
      value: 6,
      turnNumber: 0,
      rollDurationMs: 900,
    }

    expect(ended).toMatchObject({ phase: "TURN_END", currentPlayerId: "player-2" })
    expect(applyDiceRolled(ended, staleRoll)).toBe(ended)
  })

  it("projects incremental lobby updates and authoritative turn starts", () => {
    const joinedPlayer: PublicPlayer = {
      id: "player-3",
      name: "Player 3",
      color: "gold",
      connected: true,
      ready: false,
      tileId: "tile-0",
    }
    const turn: TurnStartedEvent = {
      playerId: "player-2",
      turnNumber: 2,
      timeoutAt: Date.now() + 30_000,
    }

    const withPlayer = applyPlayerUpdate(initialState, joinedPlayer)
    const updated = applyPlayerUpdate(withPlayer, { ...joinedPlayer, ready: true })
    const started = applyTurnStarted(updated, turn)

    expect(withPlayer.players).toHaveLength(3)
    expect(updated.players[2]?.ready).toBe(true)
    expect(started).toMatchObject({
      phase: "AWAITING_ROLL",
      currentPlayerId: "player-2",
      turnNumber: 2,
    })
  })
})
