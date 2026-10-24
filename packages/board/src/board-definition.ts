export type Vec3 = readonly [number, number, number]

export type BoardTile = {
  id: string
  position: Vec3
  nextTileId: string
}

export type BoardDefinition = {
  id: string
  startingTileId: string
  tiles: BoardTile[]
}

export class InvalidBoardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidBoardError"
  }
}

export function validateBoard(board: BoardDefinition): void {
  if (!board.id.trim()) {
    throw new InvalidBoardError("Board id cannot be empty")
  }

  if (board.tiles.length === 0) {
    throw new InvalidBoardError("Board must contain at least one tile")
  }

  const tileIds = new Set<string>()

  for (const tile of board.tiles) {
    if (tileIds.has(tile.id)) {
      throw new InvalidBoardError(`Duplicate tile id: ${tile.id}`)
    }
    tileIds.add(tile.id)
  }

  if (!tileIds.has(board.startingTileId)) {
    throw new InvalidBoardError(`Starting tile does not exist: ${board.startingTileId}`)
  }

  for (const tile of board.tiles) {
    if (!tileIds.has(tile.nextTileId)) {
      throw new InvalidBoardError(`Tile ${tile.id} points to missing tile ${tile.nextTileId}`)
    }
  }

  const visited = new Set<string>()
  let currentId = board.startingTileId

  for (let step = 0; step < board.tiles.length; step += 1) {
    if (visited.has(currentId)) {
      throw new InvalidBoardError(`Board loop repeats early at ${currentId}`)
    }

    visited.add(currentId)
    const tile = board.tiles.find((candidate) => candidate.id === currentId)
    if (!tile) {
      throw new InvalidBoardError(`Cannot traverse missing tile ${currentId}`)
    }
    currentId = tile.nextTileId
  }

  if (currentId !== board.startingTileId || visited.size !== board.tiles.length) {
    throw new InvalidBoardError("Board must form one loop containing every tile")
  }
}
