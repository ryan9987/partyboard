# Board model

## First board

The board is a deterministic 48-tile winding expedition. Each tile has one next tile. Market stops
at 3, 11, 19, 27, 35, and 43 are shared metadata; the server pauses a passing movement for a purchase.
The data graph wraps from the last tile to Start, while the renderer shows an open, fogged trail.
See `PARTY_ECONOMY.md` for Boots and shops.

```ts
type Vec3 = readonly [number, number, number]

type BoardTile = {
  id: string
  position: Vec3
  nextTileId: string
}

type BoardDefinition = {
  id: string
  startingTileId: string
  tiles: BoardTile[]
}
```

The board package contains pure data and traversal logic. It must not contain React or Three.js objects.

## Traversal

The core function returns every tile visited, excluding the starting tile:

```ts
getMovementPath(board, "tile-30", 4)
// ["tile-31", "tile-0", "tile-1", "tile-2"]
```

Required validation:

- Board IDs and tile IDs are unique.
- The starting tile exists.
- Every `nextTileId` exists.
- Traversal cannot enter an unexpected infinite loop.
- A roll from 1 through 6 returns exactly that many tile IDs.

## Rendering

The host converts tile positions into rendered meshes. Board data should not prescribe materials, geometry, or animation. The host renders the route as an open curve, follows the active piece with the camera, and may interpolate between the positions returned by the movement path.

`trailMotion.ts` samples a continuous Hermite path from each movement event using a monotonic
clock, exact per-space arrival times, shared camera/die focus, and reused frame storage. The
logical lap wrap uses a brief fade instead of drawing a flight across the open world.
See `ANIMATION.md` for recovery, performance, and verification details.

## Future compatibility

Branching paths may later replace `nextTileId` with multiple connections. Do not implement that abstraction now. A focused migration later will be cheaper than supporting unneeded route-selection states during the core milestone.
