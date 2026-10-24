import { InvalidBoardError, type BoardDefinition } from "./board-definition"

export function getMovementPath(
  board: BoardDefinition,
  startingTileId: string,
  spaces: number,
): string[] {
  if (!Number.isInteger(spaces) || spaces < 1 || spaces > 6) {
    throw new RangeError("Movement spaces must be an integer from 1 through 6")
  }

  const tilesById = new Map(board.tiles.map((tile) => [tile.id, tile]))
  if (!tilesById.has(startingTileId)) {
    throw new InvalidBoardError(`Starting tile does not exist: ${startingTileId}`)
  }

  const path: string[] = []
  let currentId = startingTileId

  for (let step = 0; step < spaces; step += 1) {
    const tile = tilesById.get(currentId)
    if (!tile) {
      throw new InvalidBoardError(`Cannot traverse missing tile ${currentId}`)
    }
    currentId = tile.nextTileId
    path.push(currentId)
  }

  return path
}
