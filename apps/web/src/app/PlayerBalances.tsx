import type { GameState } from "@party-board/protocol"
import { CoinCount } from "./CoinCount"

/** A quiet, persistent purse ledger, separate from mini-game scores. */
export function PlayerBalances({
  state,
  host = false,
  playerId,
}: {
  state: GameState
  host?: boolean
  playerId?: string | null
}) {
  if (!state.players.length) return null
  return (
    <aside
      className={`player-balances${host ? " player-balances--host" : ""}`}
      aria-label="Player coins"
    >
      <div className="player-balances__heading">
        <span>Players</span>
        <span>Coins</span>
      </div>
      <ul>
        {state.players.map((player) => (
          <li key={player.id} className={player.id === state.currentPlayerId ? "is-current" : ""}>
            <span className={`balance-marker balance-marker--${player.color}`} aria-hidden="true" />
            <span className="player-balances__name">
              {player.name}
              {player.id === playerId && <small>you</small>}
              {!player.connected && <small>offline</small>}
            </span>
            <CoinCount coins={player.coins ?? 0} />
          </li>
        ))}
      </ul>
    </aside>
  )
}
