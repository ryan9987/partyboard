import { SHOP_ITEMS, GAME_REWARDS, type GameState, type Item } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"
import { RoundCountdown } from "./RoundCountdown"
import { ItemGlyph } from "../app/PowerupNotice"
import { GameTutorial } from "./GameTutorial"
import { CoinCount } from "../app/CoinCount"
import { PlayerPortrait } from "../app/PlayerPortrait"
import { RoundResult } from "./RoundResult"

export function PartyOverlay({ state }: { state: GameState }) {
  const now = useGameNow(state.serverTime)
  if (state.phase === "SHOP" && state.shop) {
    const player = state.players.find((entry) => entry.id === state.shop!.playerId)!
    return (
      <aside className="host-panel market-panel" aria-label="Wildwood Market">
        <div className="market-heading">
          <span className="eyebrow">A little help for the trail</span>
          <span className="market-open">Open</span>
        </div>
        <h2>Wildwood Market</h2>
        <div className="market-customer">
          <PlayerPortrait color={player.color} />
          <span>
            <strong>{player.name}</strong>
            <small>Choose on your phone</small>
          </span>
          <CoinCount coins={player.coins ?? 0} />
        </div>
        <div className="market-stock">
          {Object.entries(SHOP_ITEMS).map(([id, item]) => (
            <div
              key={item.name}
              className={
                (player.coins ?? 0) < item.price ? "market-item market-item--saving" : "market-item"
              }
            >
              <ItemGlyph item={id as Item} />
              <strong>
                {item.name}
                <span className="market-price">
                  <CoinCount coins={item.price} />
                </span>
              </strong>
              <small>{item.description}</small>
              {(player.coins ?? 0) < item.price && (
                <span className="market-shortfall">
                  Save {item.price - (player.coins ?? 0)} more{" "}
                  {item.price - (player.coins ?? 0) === 1 ? "coin" : "coins"}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="market-footer">One purchase per stop. Take your time.</p>
        <p className="market-rule">
          Frost slows, never skips. Thaw protection prevents back-to-back attacks.
        </p>
      </aside>
    )
  }
  const game = state.potato
  if (!game) return null
  const holder = state.players.find((player) => player.id === game.holderId)
  const winner = state.players.find((player) => player.id === game.winnerId)
  return (
    <section
      className={`duel-overlay duel-overlay--${game.stage}`}
      aria-label="Hot Potato mini-game"
    >
      {game.stage === "intro" ? (
        <div className="duel-announcement duel-announcement--tutorial">
          <p className="eyebrow">Round {state.roundNumber ?? 1} complete · everyone plays</p>
          <h1>Hot Potato</h1>
          <GameTutorial kind="potato" />
          <RoundCountdown
            at={game.endsAt}
            serverTime={state.serverTime}
            paused={!!state.waitingForHost}
          />
          <small>
            Winner +{GAME_REWARDS.minigameWinner} coins · everyone else +
            {GAME_REWARDS.minigameParticipation}
          </small>
        </div>
      ) : game.stage === "result" ? (
        <RoundResult
          gameName="Hot Potato"
          players={winner ? [winner] : []}
          detail={`Winner +${GAME_REWARDS.minigameWinner} coins · everyone else +${GAME_REWARDS.minigameParticipation}`}
          waiting={!!state.waitingForHost}
        />
      ) : (
        <>
          <div className="duel-scoreboard">
            <div>
              <p className="eyebrow">Hot Potato · round {state.roundNumber ?? 1}</p>
              <h2>{holder?.name ?? "Someone"} has the acorn!</h2>
            </div>
            <span className="duel-timer">{game.aliveIds.length} left</span>
          </div>
          <div className="duel-instructions">
            Pass clockwise with a flick or a tap
            <span className="fuse-pill">
              Pops in {Math.max(0, Math.ceil((game.fuseAt - now) / 1000))}s
            </span>
          </div>
        </>
      )}
    </section>
  )
}
