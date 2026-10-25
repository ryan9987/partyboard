import type { GameState } from "@party-board/protocol"
import { QRCodeSVG } from "qrcode.react"
import { PlayerPortrait } from "../app/PlayerPortrait"

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
      <p className="eyebrow">The trail is better together</p>
      <h2>Gather your party.</h2>
      <div className="lobby-join">
        <div>
          <span className="room-heading__label">Room code</span>
          <h1>{state.roomCode}</h1>
          <span className="lobby-join__hint">
            Scan with your phone
            <br />
            or enter this code.
          </span>
        </div>

        {controllerUrl && (
          <div className="qr-card" aria-label={`QR code for ${controllerUrl}`}>
            <QRCodeSVG bgColor="#ffffff" fgColor="#264738" size={116} value={controllerUrl} />
          </div>
        )}
      </div>
      <p className="lobby-description">{description}</p>
      <p className="lobby-goal">
        <strong>First to the finish wins.</strong>
      </p>

      <div className="player-list">
        <p className="roster-count">
          <span>Your party</span>
          <strong>{state.players.length} / 4</strong>
        </p>
        {state.players.map((player) => (
          <div className="player-row" key={player.id}>
            <span className="player-row__identity">
              <PlayerPortrait color={player.color} />
              {player.name}
            </span>
            <span className={`lobby-ready${player.ready ? " is-ready" : ""}`}>
              {!player.connected ? "Reconnecting" : player.ready ? "Ready" : "Joining"}
            </span>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - state.players.length) }, (_, index) => (
          <div className="player-row player-row--empty" key={`empty-${index}`}>
            <span className="empty-seat" aria-hidden="true">
              +
            </span>
            <span>Open spot</span>
            <small>Waiting for a friend</small>
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
