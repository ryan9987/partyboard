import { useGameNow } from "../networking/gameClock"

/** Display the server's start deadline; clients never advance the game themselves. */
export function RoundCountdown({
  at,
  serverTime,
  paused = false,
}: {
  at: number
  serverTime: number | undefined
  paused?: boolean
}) {
  const now = useGameNow(serverTime)
  if (paused) return <p>Waiting for the host</p>
  const count = Math.max(1, Math.min(3, Math.ceil((at - now) / 1000)))
  return (
    <div className="round-countdown" role="timer" aria-label={`Starts in ${count}`}>
      <strong key={count}>{count}</strong>
      <span>Get ready</span>
    </div>
  )
}
