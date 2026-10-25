import type { PublicPlayer } from "@party-board/protocol"

/** Shared, textual status cues: readable without relying on icon color. */
export function playerEffectLabels(player: PublicPlayer): string[] {
  return [
    player.frozen ? "Frost: next move −2 (min 1)" : player.frostWard ? "Thaw protection" : "",
    player.shield ? "Leaf Shield active" : "",
    player.boosted ? "Next move +2" : "",
    player.lucky ? "Next die at least 4" : "",
    player.plannedRoll ? `Next die: ${player.plannedRoll}` : "",
  ].filter(Boolean)
}
