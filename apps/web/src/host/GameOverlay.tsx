import type { GameState } from "@party-board/protocol"
import { PlayerPortrait } from "../app/PlayerPortrait"
import { defaultBoard } from "@party-board/board"

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
  const progress = Math.max(
    0,
    defaultBoard.tiles.findIndex((tile) => tile.id === activePlayer?.tileId),
  )
  const finish = defaultBoard.tiles.length - 1

  return (
    <aside className="host-panel host-panel--game" aria-label="Game status">
      <div className="game-heading">
        <span className="eyebrow">The Winding Trail</span>
        <span className="turn-counter" aria-label={`Turn ${state.turnNumber}`}>
          <small>Turn</small>
          {state.turnNumber}
        </span>
      </div>

      <div className="turn-summary">
        <div>
          <strong className="turn-summary__player">
            {activePlayer && <PlayerPortrait color={activePlayer.color} />}
            <span>
              <small>{activePlayer ? "Your turn" : "Gathering players"}</small>
              {activePlayer?.name ?? "Waiting"}
            </span>
          </strong>
          <span className="phase-line" role="status">
            {PHASE_LABELS[state.phase]}
          </span>
        </div>
        <div className="roll-summary" aria-label={`Last dice result: ${state.lastRoll ?? "none"}`}>
          <DiceFace value={state.lastRoll} />
          <span className="summary-label">Last roll</span>
        </div>
      </div>

      <div className="trail-progress">
        <span>Start</span>
        <span>
          {progress} / {finish} · Finish
        </span>
        <div
          role="progressbar"
          aria-label="Trail progress"
          aria-valuemin={0}
          aria-valuemax={finish}
          aria-valuenow={progress}
        >
          <i style={{ width: `${(progress / finish) * 100}%` }} />
        </div>
      </div>
      {state.phase === "AWAITING_ROLL" && (
        <p className="turn-prompt">
          Shake or tap to roll<span>Use a power-up first, if you like. No rush.</span>
        </p>
      )}
      {state.notice && !state.itemEffect && (
        <p className="muted" role="status">
          {state.notice}
        </p>
      )}

      <div className="game-operator">
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
