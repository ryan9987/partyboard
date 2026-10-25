import { MINIGAMES, type GameState } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"
import { RoundCountdown } from "./RoundCountdown"
import { GameTutorial } from "./GameTutorial"
import { BALANCE_WINNER_REVEAL_MS } from "./balanceFall"

export function MinigameOverlay({ state }: { state: GameState }) {
  const game = state.minigame!
  const info = MINIGAMES[game.kind]
  const now = useGameNow(state.serverTime)
  const finalFallAt =
    game.kind === "balance"
      ? Math.max(
          0,
          ...game.players.filter((player) => !player.alive).map((player) => player.actionAt),
        )
      : 0
  const showResult =
    game.stage === "result" && (!finalFallAt || now - finalFallAt >= BALANCE_WINNER_REVEAL_MS)
  const remaining = Math.min(
    Math.ceil(game.durationMs / 1000),
    Math.max(0, Math.ceil((game.endsAt - now) / 1000)),
  )
  const winners = game.winnerIds
    .map((id) => state.players.find((player) => player.id === id)?.name)
    .join(" & ")
  return (
    <section
      className={`minigame-hud minigame-hud--${game.stage}`}
      aria-label={`${info.name} mini-game`}
    >
      <div className="minigame-titlebar">
        <div>
          <p className="eyebrow">Woodland games · round {state.roundNumber}</p>
          <h1>{info.name}</h1>
        </div>
        <div className="minigame-clock">
          <strong>
            {game.stage === "result" ? "✓" : game.stage === "intro" ? "—" : remaining}
          </strong>
          <small>
            {game.stage === "intro"
              ? "get ready"
              : game.stage === "result"
                ? "complete"
                : "seconds"}
          </small>
        </div>
      </div>
      {game.stage === "intro" && (
        <div className="minigame-brief minigame-brief--instructions">
          <GameTutorial kind={game.kind} />
          <RoundCountdown
            at={game.startsAt}
            serverTime={state.serverTime}
            paused={!!state.waitingForHost}
          />
          <small>Winner +8 coins · everyone else +2 · motion or touch</small>
        </div>
      )}
      {showResult && (
        <div className="minigame-brief">
          <span className="eyebrow">
            {game.winnerIds.length > 1 ? "A shared victory" : "Round winner"}
          </span>
          <h2>
            {winners
              ? `${winners} ${game.winnerIds.length > 1 ? "win" : "wins"}!`
              : "Round complete"}
          </h2>
          <p>Winners +8 coins · everyone else +2</p>
          <small>{state.waitingForHost ? "Waiting for the host" : "Returning to the trail…"}</small>
        </div>
      )}
      {game.stage === "result" && !showResult && (
        <p className="minigame-hint" role="status">
          Splash! Round decided…
        </p>
      )}
      <div className="minigame-scores">
        {game.players.map((entry) => {
          const player = state.players.find((candidate) => candidate.id === entry.playerId)!
          return (
            <div
              key={entry.playerId}
              className={`minigame-score ${!entry.alive ? "minigame-score--out" : ""}${game.kind === "fishing" && entry.status === "bite" && game.stage === "active" ? " minigame-score--bite" : ""}`}
            >
              <span className={`score-dot score-dot--${player.color}`} />
              <span>
                {player.name}
                <small>
                  {game.stage === "result" && game.winnerIds.includes(entry.playerId)
                    ? "Winner"
                    : !entry.alive
                      ? "Out"
                      : game.kind === "archery"
                        ? `${entry.attempts}/3 arrows`
                        : game.kind === "fishing" && game.stage === "active"
                          ? {
                              ready: "Ready to cast",
                              casting: "Casting",
                              waiting: "Wait for bite",
                              bite: "REEL NOW",
                              caught: "Fish caught!",
                              miss: "Try again",
                              hit: "",
                              out: "Out",
                            }[entry.status]
                          : info.unit}
                </small>
              </span>
              <strong>{entry.score}</strong>
            </div>
          )
        })}
      </div>
      {game.stage === "active" && <p className="minigame-hint">{info.instruction}</p>}
    </section>
  )
}
