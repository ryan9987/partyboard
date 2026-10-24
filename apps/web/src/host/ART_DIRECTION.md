# Woodland art pass

The demo uses a warm woodland trail: olive and fern greens, pale limestone, weathered timber,
small cream/pink flowers, and clear blue atmospheric distance. Player outfit colors remain the
brightest focal accents. Keep the camera, overhead die, and walkable route readable before adding
more decoration.

## Assets and materials

All current assets are authored locally in TypeScript/Three.js. No external models, CDN requests,
font downloads, new packages, or third-party attribution requirements were added in this pass.

- `sceneryMaterials.ts` generates repeatable grass, bark, and stone textures from seeded canvas
  drawing. Textures use sRGB, repeat wrapping, anisotropic filtering, and explicit disposal.
- `WoodlandDetails.tsx` contains branching trees with 110 individually colored foliage clusters per
  tree, exposed roots, textured trunks, a textured meadow, trail benches, lanterns, stones, distant
  hills, and layered planting.
- Ground planting uses 10,000 grass blades, 500 scattered flower heads, 896 ground leaves, and
  768 flower petals. These use four instanced meshes; foliage uses one instanced mesh per tree.
  The seeded placement leaves a clear margin around board tiles.
- `BoardTile.tsx` adds textured stone sides, inset edge marks, and small base rocks.
- `CharacterModel.tsx` includes facial features, eye highlights, ears, noses, eyebrows, hair locks,
  outfit trim, scarves, rounded backpacks and pockets, straps and buckles, rounded shoes, soles,
  and laces. Existing idle/walking motion and player colors still drive the same characters.

## Rendering

Warm directional sunlight and cooler hemisphere light retain shape and material contrast.
PCF shadows cover the route; fog and distant hills soften the horizon. The die remains above the
active character. Decoration has no effect on board traversal or server-authoritative turns.

## Verification and limits

Verify a fresh load as well as hot reload: instanced placement initializes in effects, and a
geometry-only hot edit can retain old instance matrices until reload. Check the lobby, a live
roll, movement, and at least one turn transition at the presentation viewport.

The added geometry uses instancing to limit repeated draw calls, but actual frame rate on the
presentation laptop still needs hardware testing. The current Vite host chunk size warning is
unchanged in kind; all 3D code remains isolated from the phone controller route.
