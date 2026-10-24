import type { BoardDefinition, BoardTile, Vec3 } from "./board-definition"

const TILE_COUNT = 20
const RADIUS_X = 7.4
const RADIUS_Z = 4.7

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000
}

function getPosition(index: number): Vec3 {
  const angle = Math.PI / 2 - (index / TILE_COUNT) * Math.PI * 2
  return [
    roundCoordinate(Math.cos(angle) * RADIUS_X),
    0,
    roundCoordinate(Math.sin(angle) * RADIUS_Z),
  ]
}

function createTile(index: number): BoardTile {
  return {
    id: `tile-${index}`,
    position: getPosition(index),
    nextTileId: `tile-${(index + 1) % TILE_COUNT}`,
  }
}

export const defaultBoard: BoardDefinition = {
  id: "core-loop",
  startingTileId: "tile-0",
  tiles: Array.from({ length: TILE_COUNT }, (_, index) => createTile(index)),
}
