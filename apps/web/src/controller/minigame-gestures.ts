import type { MinigameKind, MinigamePlayer } from "@party-board/protocol"
import { canFishingAct } from "./fishing-motion"

/** Gating for the settled-wrist gesture shared by cast/reel and arrow release. */
export function canFlickAct(kind: MinigameKind, player: MinigamePlayer, now: number): boolean {
  if (!player.alive) return false
  if (kind === "archery") return player.attempts < 3 && now - player.actionAt >= 900
  return kind === "fishing" && canFishingAct(player.status, player.actionAt, now)
}
