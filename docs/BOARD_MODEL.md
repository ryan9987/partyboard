# Board model

## First board

The board is a deterministic 48-tile winding expedition. Each tile has one next tile. Market stops
at 3, 11, 19, 27, 35, and 43 are shared metadata; the server pauses a passing movement for a purchase.
The trail ends at space 47: first arrival wins. The final tile's self-edge is terminal metadata,
not a repeatable movement step. Rolls (including Boots) clamp at the finish; no exact roll is needed.
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
  finishTileId?: string
  tiles: BoardTile[]
}
```

The board package contains pure data and traversal logic. It must not contain React or Three.js objects.

## Traversal

The core function returns every tile visited, excluding the starting tile:

```ts
getMovementPath(board, "tile-44", 6)
// ["tile-45", "tile-46", "tile-47"]
```

Required validation:

- Board IDs and tile IDs are unique.
- The starting tile exists.
- Every `nextTileId` exists.
- A finish board visits every tile once before the terminal self-edge; unexpected loops fail validation.
- Movement returns at most the requested number of steps (1–8 including Boots), stopping at finish.
- A movement requested from finish returns an empty path. Legacy custom loop boards without
  finish metadata remain supported by the pure traversal package, not by the default match.

## Rendering

The host converts tile positions into rendered meshes. Board data should not prescribe materials, geometry, or animation. The host renders the route as an open curve, follows the active piece with the camera, and may interpolate between the positions returned by the movement path.

`trailMotion.ts` samples a continuous Hermite path from each movement event using a monotonic
clock, exact per-space arrival times, shared camera/die focus, and reused frame storage. The
legacy custom-board wrap uses a brief fade; the default trail never wraps.
See `ANIMATION.md` for recovery, performance, and verification details.

## Future compatibility

Branching paths may later replace `nextTileId` with multiple connections. Do not implement that abstraction now. A focused migration later will be cheaper than supporting unneeded route-selection states during the core milestone.
