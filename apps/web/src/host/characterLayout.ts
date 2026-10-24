import type { Vec3 } from "@party-board/board"

const CHARACTER_OFFSETS: Vec3[] = [
  [-0.31, 0, -0.27],
  [0.31, 0, -0.27],
  [-0.31, 0, 0.27],
  [0.31, 0, 0.27],
]

const DEFAULT_OFFSET: Vec3 = [0, 0, 0]

export function getCharacterOffset(playerIndex: number): Vec3 {
  return CHARACTER_OFFSETS[playerIndex % CHARACTER_OFFSETS.length] ?? DEFAULT_OFFSET
}
