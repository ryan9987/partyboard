import type { GameState } from "@party-board/protocol"
import { useGameNow } from "../networking/gameClock"

function SwordIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 180" aria-hidden="true">
      <path d="M50 9 64 32v91H36V32Z" fill="#e4ebe3" stroke="#537063" strokeWidth="3" />
      <path d="M50 30v89" stroke="#a1b3a5" strokeWidth="3" />
      <path d="M25 126h50v9H25Z" fill="#d7ac5c" stroke="#795e36" strokeWidth="2" />
      <path d="M43 136h14v26H43Z" fill="#765439" />
      <circle cx="50" cy="167" r="8" fill="#d7ac5c" />
    </svg>
  )
}

export function DuelOverlay({ state }: { state: GameState }) {
  const duel = state.duel!
  const now = useGameNow(state.serverTime)
  const players = duel.fighters.map((fighter) =>
    state.players.find((player) => player.id === fighter.playerId)!,
  )
  const winner = state.players.find((player) => player.id === duel.winnerId)
  const loser = state.players.find((player) => player.id === duel.loserId)
  return (
    <section
      className={`duel-overlay duel-overlay--${duel.stage}`}
      aria-label="Sword duel"
      aria-live="polite"
    >
      {duel.stage === "intro" ? (
        <div className="duel-announcement" key={duel.id}>
          <div className="crossed-swords">
            <SwordIcon className="crossed-swords__left" />
            <SwordIcon className="crossed-swords__right" />
          </div>
          <p className="eyebrow">One space. Two challengers.</p>
          <h1>A woodland duel</h1>
          <p>
            {players[0]!.name} <span>vs</span> {players[1]!.name}
          </p>
          <small>First to two hits keeps the space</small>
        </div>
      ) : (
        <>
          <div className="duel-scoreboard">
            <div>
              <p className="eyebrow">Woodland duel</p>
              <h2>
                {duel.stage === "result"
                  ? winner
                    ? `${winner.name} wins!`
                    : "A draw!"
                  : "First to two hits"}
              </h2>
            </div>
            <div className="duel-scoreboard__scores">
              {players.map((player, index) => (
                <div key={player.id}>
                  <span>{player.name}</span>
                  <strong>{duel.fighters[index]!.score}</strong>
                </div>
              ))}
            </div>
            {duel.stage === "active" && (
              <span className="duel-timer">
                {Math.max(0, Math.ceil((duel.stageEndsAt - now) / 1000))}s
              </span>
            )}
          </div>
          <div className="duel-instructions" role="status">
            {duel.stage === "result"
              ? loser
                ? `${loser.name} moves back ${duel.penaltySpaces} spaces${duel.outcome === "forfeit" ? " · opponent disconnected" : ""}.`
                : "Both players keep their space."
              : duel.outcome === "block"
                ? "Parried! Wait for an opening."
                : duel.outcome === "clash"
                  ? "Swords clash!"
                  : duel.outcome === "hit"
                    ? "A clean hit!"
                    : "Swing to attack · tilt sideways to guard · or use your phone buttons"}
          </div>
        </>
      )}
    </section>
  )
}
