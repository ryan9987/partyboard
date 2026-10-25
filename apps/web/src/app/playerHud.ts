import { MINIGAMES, type GameState, type PublicPlayer } from "@party-board/protocol"
import { BALANCE_WINNER_REVEAL_MS } from "../host/balanceFall"

export type PlayerHud = {
  label: string
  score: number | null
  unit: string
  tone: "normal" | "current" | "winner" | "out"
}

/** Presentation only: never predicts a score, winner, roll or game transition. */
export function getPlayerHud(state: GameState, player: PublicPlayer, now: number): PlayerHud {
  if (state.phase === "FINISHED")
    return {
      label: state.winnerId === player.id ? "Trail champion" : "Trail complete",
      score: null,
      unit: "",
      tone: state.winnerId === player.id ? "winner" : "normal",
    }
  if (!player.connected) return { label: "Reconnecting", score: null, unit: "", tone: "out" }
  if (state.phase === "LOBBY")
    return { label: player.ready ? "Ready" : "Joining", score: null, unit: "", tone: "normal" }
  if (state.phase === "MINIGAME" && state.minigame) {
    const game = state.minigame
    const entry = game.players.find((candidate) => candidate.playerId === player.id)
    if (entry) {
      const fallAt =
        game.kind === "balance"
          ? Math.max(0, ...game.players.filter((p) => !p.alive).map((p) => p.actionAt))
          : 0
      // Let the final log fall play before announcing the winner, just like the arena overlay.
      const winner =
        game.stage === "result" &&
        (!fallAt || now - fallAt >= BALANCE_WINNER_REVEAL_MS) &&
        game.winnerIds.includes(player.id)
      const fishingLabels = {
        ready: "Ready to cast",
        casting: "Casting",
        waiting: "Wait for a bite",
        bite: "Reel now!",
        caught: "Fish caught!",
        miss: "Try again",
        hit: "",
        out: "Out",
      }
      return {
        label: winner
          ? "Winner"
          : !entry.alive
            ? "Out"
            : game.stage === "intro"
              ? "Get ready"
              : game.kind === "fishing"
                ? fishingLabels[entry.status]
                : game.kind === "archery"
                  ? `${entry.attempts}/3 arrows`
                  : game.kind === "balance"
                    ? "On the log"
                    : "Playing",
        score: game.stage === "intro" ? null : entry.score,
        unit: MINIGAMES[game.kind].unit,
        tone: winner
          ? "winner"
          : !entry.alive
            ? "out"
            : game.kind === "fishing" && entry.status === "bite"
              ? "current"
              : "normal",
      }
    }
  }
  if (state.phase === "POTATO" && state.potato?.participantIds.includes(player.id)) {
    const game = state.potato
    const winner = game.stage === "result" && game.winnerId === player.id
    const holding = game.stage === "active" && game.holderId === player.id
    const out = game.stage !== "intro" && !game.aliveIds.includes(player.id)
    return {
      label: winner
        ? "Winner"
        : out
          ? "Out"
          : holding
            ? "Holding the acorn"
            : game.stage === "intro"
              ? "Get ready"
              : "Still in",
      score: null,
      unit: "",
      tone: winner ? "winner" : out ? "out" : holding ? "current" : "normal",
    }
  }

  const current = player.id === state.currentPlayerId
  const space =
    player.tileId === "tile-0"
      ? "At the start"
      : `Space ${player.tileId.replace("tile-", "").padStart(2, "0")}`
  return {
    label:
      current && state.phase === "SHOP"
        ? "At the market"
        : current
          ? `${space} · your turn`
          : space,
    score: null,
    unit: "",
    tone: current ? "current" : "normal",
  }
}
