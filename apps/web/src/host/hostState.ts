import type {
  DiceRolledEvent,
  GameState,
  PlayerMovingEvent,
  PublicPlayer,
  TurnEndedEvent,
  TurnStartedEvent,
} from "@party-board/protocol"

function isCurrentOrNewerTurn(state: GameState, turnNumber: number): boolean {
  return turnNumber >= state.turnNumber
}

export function applyDiceRolled(state: GameState, event: DiceRolledEvent): GameState {
  if (!isCurrentOrNewerTurn(state, event.turnNumber)) return state

  return {
    ...state,
    phase: "ROLLING",
    currentPlayerId: event.playerId,
    lastRoll: event.value,
    turnNumber: event.turnNumber,
  }
}

export function applyMovementStarted(state: GameState, event: PlayerMovingEvent): GameState {
  if (!isCurrentOrNewerTurn(state, event.turnNumber)) return state

  return {
    ...state,
    phase: "MOVING",
    currentPlayerId: event.playerId,
    turnNumber: event.turnNumber,
    players: state.players.map((player) =>
      player.id === event.playerId ? { ...player, tileId: event.fromTileId } : player,
    ),
  }
}

export function applyMovementStep(state: GameState, playerId: string, tileId: string): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, tileId } : player,
    ),
  }
}

export function applyPlayerUpdate(state: GameState, player: PublicPlayer): GameState {
  const existingIndex = state.players.findIndex((candidate) => candidate.id === player.id)
  if (existingIndex === -1) {
    return { ...state, players: [...state.players, player] }
  }

  return {
    ...state,
    players: state.players.map((candidate) => (candidate.id === player.id ? player : candidate)),
  }
}

export function applyTurnStarted(state: GameState, event: TurnStartedEvent): GameState {
  if (!isCurrentOrNewerTurn(state, event.turnNumber)) return state

  return {
    ...state,
    phase: "AWAITING_ROLL",
    currentPlayerId: event.playerId,
    turnNumber: event.turnNumber,
  }
}

export function applyTurnEnded(state: GameState, event: TurnEndedEvent): GameState {
  if (!isCurrentOrNewerTurn(state, event.turnNumber)) return state

  return {
    ...state,
    phase: "TURN_END",
    currentPlayerId: event.nextPlayerId,
    turnNumber: event.turnNumber,
  }
}
