# Woodland art pass

The demo uses a warm woodland trail: olive and fern greens, pale limestone, weathered timber,
small cream/pink flowers, and clear blue atmospheric distance. Player outfit colors remain the
brightest focal accents. Keep the camera, overhead die, and walkable route readable before adding
more decoration.

## Assets and materials

Static props are modeled in Blender by a committed script and exported to one compact glTF file:

```sh
blender --background --factory-startup --python apps/web/scripts/blender/build-world.py
```

The script writes `apps/web/public/models/world.glb` (about 8k triangles, ~0.5 MB, no textures).
It contains `TreeOakA`, `TreeOakB`, `TreePine`, `Shrub`, `Rock`, `Mushroom`, `Flower`, `Tile`,
`StartGate`, `Bench`, `Lantern`, `MarketStall`, `Hill`, `Cloud`, and `Die`. Colors are baked
into vertex colors, so every prop shares one material and each prop type is drawn as a single
`InstancedMesh` (`worldAssets.tsx`). Instance colors tint tiles, shrubs, flowers, and hills.
Sign lettering uses Times New Roman Bold (or the metric-compatible Liberation Serif Bold).
Rerun the script after changing a prop; `tests/dice-orientation.test.ts` checks the exported die
against `diceOrientation.ts`.

- `sceneryMaterials.ts` still generates the meadow and trail-path textures. Characters remain
  procedural because their limbs are animated for minigames.
- Ground planting uses 10,000 grass blades, 500 scattered flower heads, 896 ground leaves, and
  768 flower petals. These use four instanced meshes.
  The seeded placement leaves a clear margin around board tiles.
- `BoardTile.tsx` adds textured stone sides, inset edge marks, and small base rocks.
- `CharacterModel.tsx` includes facial features, eye highlights, ears, noses, eyebrows, hair locks,
  outfit trim, scarves, rounded backpacks and pockets, straps and buckles, rounded shoes, soles,
  and laces. Existing idle/walking motion and player colors still drive the same characters.

## Rendering

`boardPath.ts` owns the rendered trail centerline. `StartGate` samples the midpoint/tangent
of its first segment, centers the existing timber model there and squares its posts across
the route. Never use a world-Z-only offset for the gate: the first segment bends right.
The model clone extends the posts and lifts the header by 0.65 without stretching START text;
feet stay grounded and walking characters have headroom. This stays one static draw call and
does not change the authored GLB, board spaces, movement or server rules.

Instruction cards prioritize reading from the demo audience: 16px numbered steps and goals,
14px touch guidance and a 760px maximum width, with the game title inside the same card. Keep
phone diagrams as supporting cues, not text containers. Phone lessons reflect the selected
Touch/Motion mode; no gesture animation on touch-only phones. See `gameLessons.ts` for copy.

The terminal tile has an original timber FINISH arch, cream inset sign, brass finials and
colored pennants. No borrowed assets or additional WebGL canvas. Persistent victory cards
use the same portrait/ivory/pine system as arena results. Phone UI follows that palette with
one strong primary action, secondary inventory, numbered lessons and explicit Phone/TV labels.

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

## Trail-kit overlays

The host HUD uses matte ivory, pine-green frames and small outfit-color accents, not glass,
gradients or decorative image panels. `hud.css` is scoped to `.host-shell` and loaded by the
host/rehearsal routes. It does not restyle Jack's controller route or load 3D code on the phone.

Visual references reviewed: the official [Super Mario Party Jamboree gallery](https://www.nintendo.com/us/store/products/super-mario-party-jamboree-switch/)
for compact party-game hierarchy and [Animal Crossing: New Horizons gallery](https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch/)
for soft natural colors and rounded shapes. These are design references only; no Nintendo art,
fonts, screenshots or icons are included in the game.

- One stable bottom player rail carries coins, positions/effects and authoritative arena scores.
  Do not reintroduce a second standings panel. Scores and coin balances have different labels.
- `PlayerPortrait` is an original lightweight SVG counterpart to the four 3D character outfits.
- Keep the center clear during play. Instructions, market browsing and results may use larger
  trail cards; allow scrolling on short screens, not clipped text. Keep touch fallbacks described.
- `RoundResult` handles named wins, shared victories and draws consistently across all arenas.
  Balance winner badges retain the existing fall-reveal delay.
- Use system Trebuchet/Segoe UI type; do not fetch fonts or add GPU blur/backdrop effects.
  Existing reduced-motion behavior applies to the countdown and crossed-swords introduction.
- Names truncate visually in the rail with full names retained in accessible text/title.
  Test 20-character names, 999 coins and 10,000-point scores before changing the card widths.

Development QA: `/rehearsal` includes Board HUD, Lobby, Market and all seven arena views;
`/rehearsal?stress=1` exercises label limits. `/phone-preview?view=overlays` renders these in
real 320/390/430px iframes. These fixtures never connect to or mutate a live game room.
