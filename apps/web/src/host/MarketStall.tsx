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
      <group position={[-0.08, 0.88, 0.51]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.065, 0.05, 0.1, 12]} />
          <meshStandardMaterial color="#ab815d" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
          <meshStandardMaterial color="#607b43" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 2) * 0.035,
              0.16,
              Math.sin((i * Math.PI) / 2) * 0.035,
            ]}
            scale={[1, 0.3, 1]}
          >
            <sphereGeometry args={[0.035, 10, 6]} />
            <meshStandardMaterial color={i % 2 ? "#759b4c" : "#91ae5d"} roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[0.16, 0.84, 0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.115, 0.115, 0.035, 24]} />
          <meshStandardMaterial color="#bd984c" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.096, 24]} />
          <meshStandardMaterial color="#f5eacb" />
        </mesh>
        <mesh position={[0, 0.027, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 2.7]}>
          <coneGeometry args={[0.025, 0.015, 4]} />
          <meshStandardMaterial color="#7a5c91" />
        </mesh>
      </group>
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
