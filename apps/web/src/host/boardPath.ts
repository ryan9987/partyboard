import type { BoardTile } from "@party-board/board"
import * as THREE from "three"

/** Extend the posts, but translate the header intact so START lettering is not stretched. */
export function liftStartGateVertex(height: number): number {
  return height + Math.min(1, Math.max(0, height / 1.5)) * 0.65
}

/** Shared centerline for the stone trail and its entrance; build once, never per frame. */
export function createBoardPath(tiles: readonly BoardTile[]) {
  return new THREE.CatmullRomCurve3(
    tiles.map((tile) => new THREE.Vector3(tile.position[0], -0.16, tile.position[2])),
    false,
    "centripetal",
  )
}

export function getStartGatePlacement(tiles: readonly BoardTile[]) {
  if (tiles.length < 2) throw new Error("An entrance needs at least two trail spaces")
  const curve = createBoardPath(tiles)
  // Halfway through the first segment, not a fixed world-Z offset from Start.
  const t = 0.5 / (tiles.length - 1)
  const center = curve.getPoint(t)
  const forward = curve.getTangent(t)
  return {
    position: [center.x, 0, center.z] as [number, number, number],
    // The model's front is +Z. Face back toward arriving players so its X-span
    // is perpendicular to the trail and both posts have equal clearance.
    rotation: Math.atan2(-forward.x, -forward.z),
  }
}
