import type { GameState, PlayerColor } from "@party-board/protocol"
import { QRCodeSVG } from "qrcode.react"

const COLOR_VALUES: Record<PlayerColor, string> = {
  coral: "#ff6f7d",
  cyan: "#51e7ee",
  gold: "#f6cc58",
  violet: "#9a72ff",
}

type LobbyOverlayProps = {
  actionLabel: string
  controllerUrl: string | null
  description: string
  disabled: boolean
  state: GameState
  onStart: () => void
}

export function LobbyOverlay({
  actionLabel,
  controllerUrl,
  description,
  disabled,
  state,
  onStart,
}: LobbyOverlayProps) {
  return (
    <aside className="host-panel host-panel--lobby" aria-label="Game lobby">
      <span className="room-heading__label">Room</span>
      <h1>{state.roomCode}</h1>
      <p className="muted">{description}</p>

      {controllerUrl && (
        <div className="qr-card" aria-label={`QR code for ${controllerUrl}`}>
          <QRCodeSVG bgColor="#ffffff" fgColor="#111820" size={112} value={controllerUrl} />
        </div>
      )}

      <div className="player-list">
        <p className="roster-count">{state.players.length} of 4 players</p>
        {state.players.map((player) => (
          <div className="player-row" key={player.id}>
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
            <span className="player-state">{player.ready ? "Ready" : "Joining"}</span>
          </div>
        ))}
      </div>

      <div className="button-row">
        <button
          className="button button--primary"
          disabled={disabled}
          onClick={onStart}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </aside>
  )
}
