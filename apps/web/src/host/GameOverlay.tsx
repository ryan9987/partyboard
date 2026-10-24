import type { GameState, PlayerColor } from "@party-board/protocol"

const COLOR_VALUES: Record<PlayerColor, string> = {
  coral: "#ff6f7d",
  cyan: "#51e7ee",
  gold: "#f6cc58",
  violet: "#9a72ff",
}

const PHASE_LABELS: Record<GameState["phase"], string> = {
  DUEL: "A duel on the trail",
  SHOP: "Visiting the market",
  POTATO: "Hot Potato",
  MINIGAME: "Mini-game",
  LOBBY: "Gather your friends",
  AWAITING_ROLL: "Ready to roll",
  ROLLING: "Rolling…",
  MOVING: "On the move",
  TURN_END: "Next up",
  FINISHED: "Trail complete",
}

function DiceFace({ value }: { value: number | null }) {
  const pips: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  }
  return (
    <svg className="roll-face" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#fffdf5" stroke="#d1c9b5" />
      {(pips[value ?? 0] ?? []).map((pip) => (
        <circle
          key={pip}
          cx={11 + (pip % 3) * 9}
          cy={11 + Math.floor(pip / 3) * 9}
          r="2.7"
          fill="currentColor"
        />
      ))}
      {value === null && (
        <path d="M15 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
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
          <p className="eyebrow">The woodland board</p>
          <h2>The Winding Trail</h2>
        </div>
        <span className="turn-counter" aria-label={`Turn ${state.turnNumber}`}>
          <small>Turn</small>
          {state.turnNumber}
        </span>
      </div>

      <div className="turn-summary">
        <div>
          <span className="summary-label">
            {activePlayer ? "Playing this turn" : "Waiting for a player"}
          </span>
          <strong className="turn-summary__player">
            {activePlayer && (
              <span
                className="player-dot"
                style={{ background: COLOR_VALUES[activePlayer.color] }}
              />
            )}
            {activePlayer?.name ?? "Waiting"}
          </strong>
          <span className="phase-badge" role="status">
            {PHASE_LABELS[state.phase]}
          </span>
        </div>
        <div className="roll-summary" aria-label={`Last dice result: ${state.lastRoll ?? "none"}`}>
          <DiceFace value={state.lastRoll} />
          <span className="summary-label">Last roll</span>
        </div>
      </div>

      <div className="roster-heading">
        <span className="eyebrow">On the trail</span>
        <span>
          {state.players.length} {state.players.length === 1 ? "player" : "players"}
        </span>
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
            <span className="player-state">
              <span className="player-effect-label">
                {[
                  player.frozen ? "Frozen" : "",
                  player.shield ? "Shield" : "",
                  player.boosted ? "+2 ready" : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {player.tileId === "tile-0" ? "Start" : player.tileId.replace("tile-", "Space ")}
            </span>
          </div>
        ))}
      </div>

      {state.phase === "AWAITING_ROLL" && (
        <p className="muted">Use a power-up on your phone, then roll when ready. No time limit.</p>
      )}

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
