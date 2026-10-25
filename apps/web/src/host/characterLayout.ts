import type { Vec3 } from "@party-board/board"

const CHARACTER_OFFSETS: Vec3[] = [
  [-0.31, 0, -0.27],
  [0.31, 0, -0.27],
  [-0.31, 0, 0.27],
  [0.31, 0, 0.27],
  [-0.93, 0, -0.27],
  [0.93, 0, -0.27],
  [-0.93, 0, 0.27],
  [0.93, 0, 0.27],
]

const DEFAULT_OFFSET: Vec3 = [0, 0, 0]
const COMPACT_OFFSETS: Vec3[] = [
  [-0.2, 0, -0.22],
  [0.2, 0, -0.22],
  [-0.2, 0, 0.22],
  [0.2, 0, 0.22],
  [-0.6, 0, -0.22],
  [0.6, 0, -0.22],
  [-0.6, 0, 0.22],
  [0.6, 0, 0.22],
]

export function getCharacterOffset(playerIndex: number, compact = false): Vec3 {
  const offsets = compact ? COMPACT_OFFSETS : CHARACTER_OFFSETS
  return offsets[playerIndex % offsets.length] ?? DEFAULT_OFFSET
}
