import { defaultBoard, SHOP_TILE_IDS } from "@party-board/board"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

import { MeadowGround, MeadowPlanting, TrailLandmarks, WoodlandUnderstory } from "./WoodlandDetails"
import { Prop, PropInstances } from "./worldAssets"
import { treeVariant, type Placement } from "./worldProps"

const ROUTE_CENTER_Z =
  ((defaultBoard.tiles[0]?.position[2] ?? 0) + (defaultBoard.tiles.at(-1)?.position[2] ?? 0)) / 2

// Markets need a genuine clearing, including space for the close-up camera sightline.
function inMarketClearing(x: number, z: number) {
  return defaultBoard.tiles.some(
    (tile) =>
      SHOP_TILE_IDS.includes(tile.id) &&
      Math.hypot(x - tile.position[0] - 2.55, z - tile.position[2]) < 3.6,
  )
}

type ScenePlacements = Record<
  "TreeOakA" | "TreeOakB" | "TreePine" | "Rock" | "Shrub" | "Flower" | "Mushroom",
  Placement[]
>

function buildPlacements(): ScenePlacements {
  const placements: ScenePlacements = {
    TreeOakA: [],
    TreeOakB: [],
    TreePine: [],
    Rock: [],
    Shrub: [],
    Flower: [],
    Mushroom: [],
  }
  const addTree = (x: number, z: number, scale: number) => {
    if (inMarketClearing(x, z)) return
    placements[treeVariant(x, z)].push({
      position: [x, -0.1, z],
      rotation: x * 1.7 + z,
      scale,
    })
  }

  for (const side of [-1, 1]) {
    for (const index of [0, 1, 2]) {
      addTree(
        side * (4.5 + (index % 2) * 2.5),
        defaultBoard.tiles.at(-1)!.position[2] - 7 - index * 7,
        1.05 + index * 0.08,
      )
    }
  }

  defaultBoard.tiles.forEach((tile, index) => {
    const [x, , z] = tile.position
    const side = index % 2 === 0 ? 1 : -1
    if (index % 2 === 0)
      addTree(x + side * (4.25 + (index % 3) * 0.45), z, 0.78 + (index % 5) * 0.07)
    if (index % 3 === 0) addTree(x - side * 5.4, z - 1.2, 0.85 + (index % 4) * 0.12)
    if (index % 6 === 2) {
      placements.Rock.push({
        position: [x - side * 3.25, -0.05, z + 0.35],
        rotation: index * 0.7,
        scale: 0.9,
      })
    }
    if (index % 4 === 1) {
      placements.Shrub.push({
        position: [x - side * 3.9, 0, z - 0.5],
        rotation: index,
        color: index % 3 === 0 ? "#e4f5dc" : "#ffffff",
      })
    }
    placements.Flower.push({
      position: [x + side * 2.35, -0.08, z + 0.42],
      rotation: index,
      color: index % 3 === 0 ? "#ffd966" : index % 3 === 1 ? "#ff9fb0" : "#ffffff",
    })
    if (index % 5 === 0) {
      placements.Mushroom.push({ position: [x + side * 2.57, -0.08, z + 0.5], rotation: index })
    }
  })
  return placements
}

function Cloud({
  position,
  speed,
}: {
  position: readonly [number, number, number]
  speed: number
}) {
  const cloudRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const cloud = cloudRef.current
    if (!cloud) return
    cloud.position.x += delta * speed
    if (cloud.position.x > 14) cloud.position.x = -14
  })

  return (
    <group ref={cloudRef} position={position}>
      <Prop castShadow={false} name="Cloud" position={[0, 0, 0]} scale={1.3} />
    </group>
  )
}

export function WorldEnvironment() {
  const placements = useMemo(() => buildPlacements(), [])
  const start = defaultBoard.tiles[0]?.position ?? [0, 0, 8]

  return (
    <>
      <mesh receiveShadow position={[0, -0.82, ROUTE_CENTER_Z]}>
        <boxGeometry args={[19, 1.2, 64]} />
        <meshStandardMaterial color="#69452d" roughness={1} />
      </mesh>
      <MeadowGround />
      <MeadowPlanting />
      <TrailLandmarks />
      <WoodlandUnderstory />
      {(Object.keys(placements) as (keyof ScenePlacements)[]).map((name) => (
        <PropInstances
          key={name}
          name={name}
          placements={placements[name]}
          receiveShadow={name === "Rock"}
        />
      ))}
      <Prop name="StartGate" position={[start[0], 0, start[2] - 1.3]} />
      <Cloud position={[-8, 7.2, 2]} speed={0.18} />
      <Cloud position={[5, 8.1, -17]} speed={0.11} />
      <Cloud position={[-3, 7.5, -38]} speed={0.14} />
    </>
  )
}
