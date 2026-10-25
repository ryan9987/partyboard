import type { GameState } from "@party-board/protocol"
import { CoinCount } from "./CoinCount"
import { playerEffectLabels } from "./playerEffects"
import { PlayerPortrait } from "./PlayerPortrait"
import { getPlayerHud } from "./playerHud"
import { useGameNow } from "../networking/gameClock"

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
  const now = useGameNow(state.serverTime, state.minigame?.stage === "result" ? 100 : 1000)
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
        {state.players.map((player) => {
          const hud = getPlayerHud(state, player, now)
          return (
            <li
              key={player.id}
              className={
                host
                  ? `player-seat player-seat--${player.color} player-seat--${hud.tone}${hud.score !== null ? " player-seat--scored" : ""}`
                  : player.id === state.currentPlayerId
                    ? "is-current"
                    : ""
              }
            >
              {host ? (
                <PlayerPortrait color={player.color} />
              ) : (
                <span
                  className={`balance-marker balance-marker--${player.color}`}
                  aria-hidden="true"
                />
              )}
              <span className="player-balances__name">
                <span className="player-seat__name" title={player.name}>
                  {player.name}
                </span>
                {player.id === playerId && <small>you</small>}
                {host ? (
                  <small className="player-seat__status">{hud.label}</small>
                ) : (
                  !player.connected && <small>offline</small>
                )}
                {host && playerEffectLabels(player).length > 0 && (
                  <small>{playerEffectLabels(player).join(" · ")}</small>
                )}
              </span>
              {host && hud.score !== null && (
                <span
                  className="player-seat__score"
                  aria-label={`${player.name}: ${hud.score} ${hud.unit}`}
                >
                  <strong>{hud.score}</strong>
                  <small>{hud.unit}</small>
                </span>
              )}
              <CoinCount coins={player.coins ?? 0} />
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
