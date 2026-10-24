import type { GameState, PlayerColor } from "@party-board/protocol"
import { QRCodeSVG } from "qrcode.react"

const COLOR_VALUES: Record<PlayerColor, string> = {
  coral: "#ff6f7d",
  cyan: "#51e7ee",
  gold: "#f6cc58",
  violet: "#9a72ff",
}

type LobbyOverlayProps = {
  controllerUrl: string
  state: GameState
  onStart: () => void
}

export function LobbyOverlay({ controllerUrl, state, onStart }: LobbyOverlayProps) {
  return (
    <aside className="host-panel" aria-label="Game lobby">
      <p className="eyebrow">Room code</p>
      <h1>{state.roomCode}</h1>
      <p className="muted">
        Scan to join from a phone. Four fixture players are shown for Ryan's host preview.
      </p>

      <div className="qr-card" aria-label={`QR code for ${controllerUrl}`}>
        <QRCodeSVG bgColor="#ffffff" fgColor="#081226" size={132} value={controllerUrl} />
      </div>

      <div className="player-list">
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
        <button className="button button--primary" onClick={onStart} type="button">
          Start host preview
        </button>
      </div>
    </aside>
  )
}
