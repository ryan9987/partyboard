import type { MinigameState } from "@party-board/protocol"

export type DemoBot = {
  sessionId: string
  connectionId: string
  phaseKey: string
  nextActionAt: number
  sequence: number
}

/** Deliberately novice inputs, not score overrides. Humans still have to play to win. */
export function noviceInput(game: MinigameState, index: number, now: number) {
  const elapsed = now - game.startsAt
  if (game.kind === "balance") return { axis: 0.65 + index * 0.06, action: false }
  if (game.kind === "archery") return { axis: index % 2 ? -0.86 : 0.86, action: true }
  if (game.kind === "fishing") return { axis: 0.7, action: true }
  // Late wrist flicks: occasionally catch the edge of a beat, never perfect timing.
  return { axis: 0, action: elapsed % 750 > 230 && elapsed % 750 < 450 }
}
