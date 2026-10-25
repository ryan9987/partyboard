import type { GameState } from "@party-board/protocol"
import { RoundResult } from "./RoundResult"

export function MatchResult({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const winner = state.players.find((player) => player.id === state.winnerId)
  return (
    <section
      className="round-overlay round-overlay--result match-result"
      aria-label="Match results"
    >
      <RoundResult
        players={winner ? [winner] : []}
        detail="First to the finish. The trail has a champion."
        waiting={false}
        gameName="The Winding Trail"
        resultLabel="Trail champion"
        returnLabel="Match complete · celebrate your victory!"
      >
        <button type="button" className="button button--primary" onClick={onRestart}>
          Play again
        </button>
      </RoundResult>
    </section>
  )
}
