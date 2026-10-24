import type { GameState, PlayerColor } from "@party-board/protocol"

const COLOR_VALUES: Record<PlayerColor, string> = {
  coral: "#ff6f7d",
  cyan: "#51e7ee",
  gold: "#f6cc58",
  violet: "#9a72ff",
}

type GameOverlayProps = {
  busy: boolean
  live: boolean
  state: GameState
  onPreviewRoll: (() => void) | undefined
  onReset: () => void
}

export function GameOverlay({ busy, live, state, onPreviewRoll, onReset }: GameOverlayProps) {
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)

  return (
    <aside className="host-panel host-panel--game" aria-label="Game status">
      <div className="game-heading">
        <div>
          <p className="eyebrow">Turn {state.turnNumber}</p>
          <h2>The Winding Trail</h2>
        </div>
        <span className="phase-badge">{state.phase.replaceAll("_", " ")}</span>
      </div>

      <div className="turn-summary">
        <div>
          <span className="summary-label">Current player</span>
          <strong
            className="turn-summary__player"
            style={{ color: activePlayer ? COLOR_VALUES[activePlayer.color] : undefined }}
          >
            {activePlayer?.name ?? "Waiting"}
          </strong>
          <span className="summary-detail">{activePlayer?.tileId ?? "No active tile"}</span>
        </div>
        <div className="roll-summary" aria-label="Last dice result">
          <span className="summary-label">Last roll</span>
          <strong>{state.lastRoll ?? "–"}</strong>
        </div>
      </div>

      <div className="player-list">
        {state.players.map((player) => (
          <div
            className={`player-row ${player.id === state.currentPlayerId ? "player-row--active" : ""}`}
            key={player.id}
          >
            <span className="player-row__identity">
              <span
                className="player-dot"
                style={{
                  background: COLOR_VALUES[player.color],
                  color: COLOR_VALUES[player.color],
                }}
              />
              {player.name}
            </span>
            <span className="player-state">{player.tileId.replace("tile-", "Space ")}</span>
          </div>
        ))}
      </div>

      <div className="button-row">
        <button
          className="button button--secondary"
          disabled={busy}
          onClick={onReset}
          type="button"
        >
          {live ? "Restart game" : "Reset"}
        </button>
        {onPreviewRoll && (
          <button
            className="button button--primary"
            disabled={busy || state.phase !== "AWAITING_ROLL"}
            onClick={onPreviewRoll}
            type="button"
          >
            {busy ? "Resolving…" : "Preview roll"}
          </button>
        )}
      </div>
    </aside>
  )
}
