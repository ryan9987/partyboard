import type { PublicPlayer } from "@party-board/protocol"
import type { ReactNode } from "react"
import { PlayerPortrait } from "../app/PlayerPortrait"

export function RoundResult({
  players,
  detail,
  waiting,
  title = "Round complete",
  gameName,
  returnLabel,
  resultLabel,
  children,
}: {
  players: PublicPlayer[]
  detail: string
  waiting: boolean
  title?: string
  gameName?: string
  returnLabel?: string
  resultLabel?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`round-result${players.length > 2 ? " round-result--shared" : ""}`}
      role="status"
    >
      <svg className="victory-emblem" viewBox="0 0 64 64" aria-hidden="true" fill="none">
        <path
          d="M20 13h24v13c0 10-6 16-12 16S20 36 20 26Z"
          fill="#e9c879"
          stroke="#8d692f"
          strokeWidth="2"
        />
        <path
          d="M20 18H12v7c0 7 5 10 11 10m21-17h8v7c0 7-5 10-11 10M32 42v10m-12 4h24"
          stroke="#8d692f"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M27 30c-4-9 3-13 11-13 0 8-3 14-11 13Z" fill="#577751" />
        <path d="m26 33 9-12" stroke="#f8edce" strokeWidth="1.5" />
      </svg>
      <p className="eyebrow">
        {gameName && <>{gameName} · </>}
        {resultLabel ??
          (players.length > 1
            ? "A shared victory"
            : players.length
              ? "Round winner"
              : "Trail games")}
      </p>
      <div className="round-result__portraits">
        {players.map((player) => (
          <PlayerPortrait key={player.id} color={player.color} />
        ))}
      </div>
      <h2>
        {players.length
          ? players.length > 2
            ? `${players.length} share the win!`
            : `${players.map((player) => player.name).join(" & ")} ${players.length > 1 ? "win" : "wins"}!`
          : title}
      </h2>
      {players.length > 2 && (
        <p className="round-result__names">{players.map((player) => player.name).join(" · ")}</p>
      )}
      <p className="round-result__reward">{detail}</p>
      <small>
        {returnLabel ?? (waiting ? "Waiting for the host" : "Back to the trail in a moment")}
      </small>
      {children}
    </div>
  )
}
