import { defaultBoard, SHOP_TILE_IDS } from "@party-board/board"

import { CharacterModel } from "./CharacterModel"
import { Prop } from "./worldAssets"

const SHOPKEEPER = {
  skinTone: "#a47152",
  hairColor: "#c6c4ad",
  hairStyle: "short",
  shirtColor: "#e5d6b0",
  pantsColor: "#4d6044",
  shoeColor: "#5b4633",
  accessoryColor: "#6d8554",
} as const

function Stall({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={[position[0] + 2.55, -0.08, position[2]]}>
      <Prop name="MarketStall" position={[0, 0, 0]} receiveShadow />
      <CharacterModel
        centered
        active={false}
        color="gold"
        moving={false}
        playerIndex={0}
        position={[0, -0.26, -0.12]}
        appearance={SHOPKEEPER}
      />
    </group>
  )
}

export function TrailMarkets({ focusZ }: { focusZ: number }) {
  return (
    <>
      {defaultBoard.tiles
        .filter(
          (tile) => SHOP_TILE_IDS.includes(tile.id) && Math.abs(tile.position[2] - focusZ) < 22,
        )
        .map((tile) => (
          <Stall key={tile.id} position={tile.position} />
        ))}
    </>
  )
}
