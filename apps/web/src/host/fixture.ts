import type { GameState } from "@party-board/protocol"

export const fixtureGameState: GameState = {
  roomCode: "PLAY",
  phase: "LOBBY",
  currentPlayerId: null,
  turnNumber: 0,
  lastRoll: null,
  players: [
    {
      id: "player-ryan",
      name: "Ryan",
      color: "cyan",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
    {
      id: "player-jack",
      name: "Jack",
      color: "coral",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
    {
      id: "player-three",
      name: "Player 3",
      color: "gold",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
    {
      id: "player-four",
      name: "Player 4",
      color: "violet",
      connected: true,
      ready: true,
      tileId: "tile-0",
    },
  ],
}

export function createFixtureState(): GameState {
  return structuredClone(fixtureGameState)
}
