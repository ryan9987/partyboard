import { SHOP_ITEMS, type GameState, type Item } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"
import { RoundCountdown } from "./RoundCountdown"
import { ItemGlyph } from "../app/PowerupNotice"
import { GameTutorial } from "./GameTutorial"

export function PartyOverlay({ state }: { state: GameState }) {
  const now = useGameNow(state.serverTime)
  if (state.phase === "SHOP" && state.shop) {
    const player = state.players.find((entry) => entry.id === state.shop!.playerId)!
    return (
      <aside className="host-panel market-panel" aria-label="Wildwood Market">
        <h2>Wildwood Market</h2>
        <p className="muted">
          {player.name} is browsing · {player.coins ?? 0} coins
        </p>
        <div className="market-stock">
          {Object.entries(SHOP_ITEMS).map(([id, item]) => (
            <div key={item.name}>
              <ItemGlyph item={id as Item} />
              <strong>
                {item.name}
                <span>{item.price} coins</span>
              </strong>
              <small>{item.description}</small>
            </div>
          ))}
        </div>
        <p className="muted">One purchase per stop · one power-up per turn.</p>
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
          <small>Winner +8 coins · everyone else +2</small>
        </div>
      ) : (
        <>
          <div className="duel-scoreboard">
            <div>
              <p className="eyebrow">Hot Potato · round {state.roundNumber ?? 1}</p>
              <h2>
                {game.stage === "result"
                  ? winner
                    ? `${winner.name} wins · +8 coins`
                    : "Round complete"
                  : `${holder?.name ?? "Someone"} has the acorn!`}
              </h2>
            </div>
            <span className="duel-timer">
              {game.stage === "active" ? `${game.aliveIds.length} left` : "+2 for everyone else"}
            </span>
          </div>
          <div className="party-roster">
            {game.participantIds.map((id) => {
              const player = state.players.find((entry) => entry.id === id)!
              return (
                <span key={id} className={game.aliveIds.includes(id) ? "" : "party-roster--out"}>
                  {player.name}
                  {game.holderId === id ? " · HOLDING" : game.winnerId === id ? " · WINNER" : ""}
                </span>
              )
            })}
          </div>
          <div className="duel-instructions">
            {game.stage === "result"
              ? state.waitingForHost
                ? "Coins awarded · waiting for the host"
                : "Coins awarded · returning to the trail…"
              : `Pass clockwise with a flick or a tap · pops in ${Math.max(0, Math.ceil((game.fuseAt - now) / 1000))}s`}
          </div>
        </>
      )}
    </section>
  )
}
