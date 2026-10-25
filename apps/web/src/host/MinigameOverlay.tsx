import { MINIGAMES, GAME_REWARDS, type GameState } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"
import { RoundCountdown } from "./RoundCountdown"
import { GameTutorial } from "./GameTutorial"
import { BALANCE_WINNER_REVEAL_MS } from "./balanceFall"
import { RoundResult } from "./RoundResult"

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
  const winners = state.players.filter((player) => game.winnerIds.includes(player.id))
  return (
    <section
      className={`minigame-hud minigame-hud--${game.stage}`}
      aria-label={`${info.name} mini-game`}
    >
      {game.stage !== "intro" && (
        <div className="minigame-titlebar">
          <div>
            <p className="eyebrow">Trail games · round {state.roundNumber ?? 1}</p>
            <h1>{info.name}</h1>
          </div>
          <div className="minigame-clock">
            <strong>{game.stage === "result" ? "✓" : remaining}</strong>
            <small>{game.stage === "result" ? "complete" : "seconds"}</small>
          </div>
        </div>
      )}
      {game.stage === "intro" && (
        <div className="minigame-brief minigame-brief--instructions">
          <div className="lesson-heading">
            <span className="eyebrow">Trail games · round {state.roundNumber ?? 1}</span>
            <h1>{info.name}</h1>
          </div>
          <GameTutorial kind={game.kind} />
          <RoundCountdown
            at={game.startsAt}
            serverTime={state.serverTime}
            paused={!!state.waitingForHost}
          />
          <small>
            Winner +{GAME_REWARDS.minigameWinner} coins · everyone else +
            {GAME_REWARDS.minigameParticipation}
          </small>
        </div>
      )}
      {showResult && (
        <RoundResult
          gameName={info.name}
          players={winners}
          detail={`Winners +${GAME_REWARDS.minigameWinner} coins · everyone else +${GAME_REWARDS.minigameParticipation}`}
          waiting={!!state.waitingForHost}
        />
      )}
      {game.stage === "result" && !showResult && (
        <p className="minigame-hint" role="status">
          Splash! Round decided…
        </p>
      )}
      {game.stage === "active" && <p className="minigame-hint">{info.instruction}</p>}
    </section>
  )
}
