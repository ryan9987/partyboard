import { defaultBoard } from "@party-board/board"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { createSurfaceTexture, randomSource } from "./sceneryMaterials"
import { Prop, PropInstances } from "./worldAssets"
import { offsetFrom, treeVariant, type Placement } from "./worldProps"

export function WoodlandTree({
  position,
  scale,
}: {
  position: readonly [number, number]
  scale: number
}) {
  return (
    <Prop
      name={treeVariant(position[0], position[1])}
      position={[position[0], -0.1, position[1]]}
      rotation={position[0] * 1.7 + position[1]}
      scale={scale}
    />
  )
}

export function MeadowGround() {
  const texture = useMemo(() => createSurfaceTexture("grass"), [])
  useEffect(() => () => texture.dispose(), [texture])
  const centerZ = (defaultBoard.tiles[0]!.position[2] + defaultBoard.tiles.at(-1)!.position[2]) / 2
  return (
    <mesh receiveShadow position={[0, -0.17, centerZ]}>
      <boxGeometry args={[70, 0.16, 130]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  )
}

export function MeadowPlanting({ clearingRadius = 0 }: { clearingRadius?: number }) {
  const grassRef = useRef<THREE.InstancedMesh>(null)
  const flowerRef = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const grass = grassRef.current
    const flowers = flowerRef.current
    if (!grass || !flowers) return
    const random = randomSource(42)
    const dummy = new THREE.Object3D()
    let count = 0
    let flowerCount = 0
    while (count < 10000) {
      const x = (random() - 0.5) * 22
      const z = 12 - random() * (defaultBoard.tiles.length * 1.75 + 15)
      if (Math.hypot(x, z) < clearingRadius) continue
      if (
        defaultBoard.tiles.some(
          (tile) => Math.hypot(x - tile.position[0], z - tile.position[2]) < 1.25,
        )
      )
        continue
      const height = 0.1 + random() * 0.25
      dummy.position.set(x, -0.08 + height * 0.5, z)
      dummy.rotation.set((random() - 0.5) * 0.45, random() * 6.28, (random() - 0.5) * 0.5)
      dummy.scale.set(0.025 + random() * 0.035, height, 0.025 + random() * 0.025)
      dummy.updateMatrix()
      grass.setMatrixAt(count, dummy.matrix)
      grass.setColorAt(
        count,
        new THREE.Color().setHSL(
          0.2 + random() * 0.08,
          0.35 + random() * 0.2,
          0.25 + random() * 0.18,
        ),
      )
      if (count % 20 === 0 && flowerCount < 500) {
        dummy.position.y = height - 0.04
        dummy.scale.setScalar(0.035 + random() * 0.035)
        dummy.updateMatrix()
        flowers.setMatrixAt(flowerCount, dummy.matrix)
        flowers.setColorAt(
          flowerCount,
          new THREE.Color(["#fff5cb", "#e3b757", "#be91bc", "#f1d7cf"][flowerCount % 4]!),
        )
        flowerCount++
      }
      count++
    }
    for (const mesh of [grass, flowers]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [clearingRadius])
  return (
    <group>
      <instancedMesh ref={grassRef} args={[undefined, undefined, 10000]} receiveShadow>
        <coneGeometry args={[0.5, 1, 3, 1, true]} />
        <meshStandardMaterial side={THREE.DoubleSide} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, 500]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </group>
  )
}

export function TrailLandmarks() {
  const placements = useMemo(() => {
    const benches: Placement[] = []
    const lanterns: Placement[] = []
    const rocks: Placement[] = []
    defaultBoard.tiles
      .filter((_, index) => index % 5 === 2)
      .forEach((tile, index) => {
        const origin = [
          tile.position[0] + (index % 2 ? -2.15 : 2.15),
          -0.08,
          tile.position[2],
        ] as const
        const yaw = index % 2 ? 0.5 : -0.6
        benches.push({ position: origin, rotation: yaw })
        lanterns.push({ position: offsetFrom(origin, yaw, [0.95, 0, -0.1]), rotation: yaw })
        rocks.push({
          position: offsetFrom(origin, yaw, [-0.95, 0, 0.35]),
          rotation: yaw + index,
          scale: 0.45,
        })
      })
    return { benches, lanterns, rocks }
  }, [])
  return (
    <>
      <PropInstances name="Bench" placements={placements.benches} />
      <PropInstances name="Lantern" placements={placements.lanterns} />
      <PropInstances name="Rock" placements={placements.rocks} receiveShadow />
    </>
  )
}

const HILLS: Placement[] = [-1, 1].flatMap((side) =>
  [0, 1, 2, 3, 4].map((index) => ({
    position: [side * (16 + (index % 2) * 5), -0.7, 4 - index * 16] as const,
    scale: [7 + (index % 3), 2.2 + (index % 2), 12] as const,
    color: index % 2 ? "#e8f0d8" : "#ffffff",
  })),
)

export function WoodlandUnderstory() {
  const leavesRef = useRef<THREE.InstancedMesh>(null)
  const petalsRef = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const leaves = leavesRef.current
    const petals = petalsRef.current
    if (!leaves || !petals) return
    const random = randomSource(133)
    const dummy = new THREE.Object3D()
    let leafIndex = 0
    let petalIndex = 0
    for (const tile of defaultBoard.tiles) {
      for (let plant = 0; plant < 4; plant++) {
        const side = plant % 2 ? 1 : -1
        const x = tile.position[0] + side * (1.5 + random() * 1.2)
        const z = tile.position[2] + (random() - 0.5) * 0.8
        for (let leaf = 0; leaf < 7; leaf++) {
          const angle = (leaf / 7) * Math.PI * 2 + random() * 0.3
          dummy.position.set(
            x + Math.cos(angle) * 0.17,
            0.06 + random() * 0.09,
            z + Math.sin(angle) * 0.17,
          )
          dummy.rotation.set(Math.cos(angle) * 0.5, angle, Math.sin(angle) * 0.5)
          dummy.scale.set(0.055 + random() * 0.035, 0.025, 0.19 + random() * 0.1)
          dummy.updateMatrix()
          leaves.setMatrixAt(leafIndex, dummy.matrix)
          leaves.setColorAt(leafIndex++, new THREE.Color(leaf % 2 ? "#486c37" : "#77964b"))
        }
        const flowerColor = ["#e3ae75", "#e3c6d5", "#e4d49b", "#f4ead4"][plant]!
        for (let petal = 0; petal < 6; petal++) {
          const angle = (petal / 6) * Math.PI * 2
          dummy.position.set(x + Math.cos(angle) * 0.055, 0.21, z + Math.sin(angle) * 0.055)
          dummy.rotation.set(0, angle, 0)
          dummy.scale.set(0.04, 0.018, 0.08)
          dummy.updateMatrix()
          petals.setMatrixAt(petalIndex, dummy.matrix)
          petals.setColorAt(petalIndex++, new THREE.Color(flowerColor))
        }
      }
    }
    for (const mesh of [leaves, petals]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [])
  return (
    <group>
      <instancedMesh
        ref={leavesRef}
        args={[undefined, undefined, defaultBoard.tiles.length * 28]}
        receiveShadow
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial flatShading roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={petalsRef} args={[undefined, undefined, defaultBoard.tiles.length * 24]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
      <PropInstances castShadow={false} name="Hill" placements={HILLS} receiveShadow />
    </group>
  )
}
