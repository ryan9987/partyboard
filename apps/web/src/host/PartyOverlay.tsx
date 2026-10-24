import { SHOP_ITEMS, type GameState } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"

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
          {Object.values(SHOP_ITEMS).map((item) => (
            <div key={item.name}>
              <strong>
                {item.name}
                <span>{item.price}</span>
              </strong>
              <small>{item.description}</small>
            </div>
          ))}
        </div>
        <p className="muted">Buy or keep walking on your phone.</p>
        <p className="eyebrow">
          Continuing in {Math.max(0, Math.ceil((state.shop.endsAt - now) / 1000))}s
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
        <div className="duel-announcement">
          <div className="acorn-emblem" aria-hidden="true">
            ●
          </div>
          <p className="eyebrow">Round {state.roundNumber ?? 1} complete · everyone plays</p>
          <h1>Hot Potato</h1>
          <p>Don't get caught with the hot acorn.</p>
          <small>Flick or tap to pass · last standing earns 8 coins</small>
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
              ? "Coins awarded · back to the trail shortly"
              : `Pass clockwise with a flick or a tap · pops in ${Math.max(0, Math.ceil((game.fuseAt - now) / 1000))}s`}
          </div>
        </>
      )}
    </section>
  )
}
