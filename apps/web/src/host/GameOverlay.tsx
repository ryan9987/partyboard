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
    <aside className="host-panel" aria-label="Game status">
      <p className="eyebrow">Turn {state.turnNumber}</p>
      <h2>The Winding Trail</h2>
      <span className="phase-badge">{state.phase.replaceAll("_", " ")}</span>

      <div className="turn-callout">
        <span className="muted">Current player</span>
        <span
          className="turn-callout__name"
          style={{ color: activePlayer ? COLOR_VALUES[activePlayer.color] : undefined }}
        >
          {activePlayer?.name ?? "Waiting"}
        </span>
        <span className="muted">{activePlayer?.tileId ?? "No active tile"}</span>
      </div>

      <div className="dice-result" aria-label="Last dice result">
        {state.lastRoll ?? "–"}
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

      <p className="technical-note">
        {live
          ? "The active phone requests each roll. The server supplies the authoritative value, movement path, and next turn."
          : "Preview Roll is a fixture-only test control. In the integrated game, the phone requests a roll and Jack's server supplies the authoritative value and path."}
      </p>

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
