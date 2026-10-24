import type { BoardDefinition, BoardTile, Vec3 } from "./board-definition"

const TILE_COUNT = 48

export const SHOP_TILE_IDS = [3, 11, 19, 27, 35, 43].map((index) => `tile-${index}`)

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000
}

function getPosition(index: number): Vec3 {
  return [
    roundCoordinate(Math.sin(index * 0.54) * 3.8 + Math.sin(index * 0.19) * 0.8),
    0,
    roundCoordinate(8 - index * 1.75),
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
  id: "winding-expedition",
  startingTileId: "tile-0",
  tiles: Array.from({ length: TILE_COUNT }, (_, index) => createTile(index)),
}
