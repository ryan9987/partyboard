import { defaultBoard } from "@party-board/board"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { createSurfaceTexture, randomSource } from "./sceneryMaterials"

export function WoodlandTree({
  position,
  scale,
}: {
  position: readonly [number, number]
  scale: number
}) {
  const foliageRef = useRef<THREE.InstancedMesh>(null)
  const bark = useMemo(() => createSurfaceTexture("bark"), [])
  useEffect(() => () => bark.dispose(), [bark])
  useEffect(() => {
    const mesh = foliageRef.current
    if (!mesh) return
    const random = randomSource(Math.round((position[1] + 80) * 191))
    const dummy = new THREE.Object3D()
    const colors = ["#3b7041", "#578447", "#78964b", "#91a75a", "#426e3c"]
    for (let index = 0; index < 110; index++) {
      const angle = random() * Math.PI * 2
      const height = random()
      const radius = Math.sqrt(random()) * (0.95 - height * 0.38)
      dummy.position.set(Math.cos(angle) * radius, 1.65 + height * 1.55, Math.sin(angle) * radius)
      dummy.rotation.set(random() * 3, random() * 6, random() * 3)
      dummy.scale.set(0.28 + random() * 0.22, 0.16 + random() * 0.17, 0.25 + random() * 0.22)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      mesh.setColorAt(index, new THREE.Color(colors[Math.floor(random() * colors.length)]!))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [position])
  return (
    <group position={[position[0], -0.1, position[1]]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.105, 0.25, 2.2, 12, 4]} />
        <meshStandardMaterial map={bark} roughness={0.96} />
      </mesh>
      {[0, 1, 2, 3, 4].map((index) => (
        <group key={index} rotation={[0, index * 2.4, 0]}>
          <mesh castShadow position={[0.27, 1.4 + (index % 3) * 0.2, 0]} rotation={[0, 0, -0.65]}>
            <cylinderGeometry args={[0.035, 0.09, 0.9, 7]} />
            <meshStandardMaterial map={bark} roughness={1} />
          </mesh>
          <mesh castShadow position={[0.2, 0.06, 0]} rotation={[0, 0, -1.1]}>
            <cylinderGeometry args={[0.04, 0.12, 0.65, 7]} />
            <meshStandardMaterial map={bark} roughness={1} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={foliageRef} args={[undefined, undefined, 110]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.92} />
      </instancedMesh>
    </group>
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
        <coneGeometry args={[0.5, 1, 3]} />
        <meshStandardMaterial side={THREE.DoubleSide} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, 500]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </group>
  )
}

function TrailBench() {
  return (
    <group>
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 0.18, 0]}>
            <boxGeometry args={[0.09, 0.45, 0.43]} />
            <meshStandardMaterial color="#34433e" />
          </mesh>
          <mesh castShadow position={[0, 0.5, -0.2]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.07, 0.65, 0.07]} />
            <meshStandardMaterial color="#34433e" />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh castShadow receiveShadow key={index} position={[0, 0.41, -0.14 + index * 0.14]}>
          <boxGeometry args={[1.3, 0.065, 0.115]} />
          <meshStandardMaterial color={index % 2 ? "#a57948" : "#ba925a"} roughness={0.88} />
        </mesh>
      ))}
      {[0.63, 0.79].map((y) => (
        <mesh castShadow key={y} position={[0, y, -0.24]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[1.3, 0.12, 0.06]} />
          <meshStandardMaterial color="#b58a54" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function TrailLandmarks() {
  return (
    <>
      {defaultBoard.tiles
        .filter((_, index) => index % 5 === 2)
        .map((tile, index) => (
          <group
            key={tile.id}
            position={[tile.position[0] + (index % 2 ? -2.15 : 2.15), -0.08, tile.position[2]]}
            rotation={[0, index % 2 ? 0.5 : -0.6, 0]}
          >
            <TrailBench />
            <group position={[0.95, 0, -0.1]}>
              <mesh castShadow position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.035, 0.055, 1.4, 8]} />
                <meshStandardMaterial color="#35443b" />
              </mesh>
              <mesh position={[0, 1.43, 0]}>
                <boxGeometry args={[0.17, 0.25, 0.17]} />
                <meshStandardMaterial color="#ffdda3" emissive="#ffbd69" emissiveIntensity={0.45} />
              </mesh>
              <mesh castShadow position={[0, 1.6, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.18, 0.15, 4]} />
                <meshStandardMaterial color="#35443b" />
              </mesh>
              <mesh position={[0, 1.28, 0]}>
                <boxGeometry args={[0.22, 0.045, 0.22]} />
                <meshStandardMaterial color="#35443b" />
              </mesh>
            </group>
            {[0, 1, 2].map((rock) => (
              <mesh
                key={rock}
                castShadow
                receiveShadow
                position={[-0.9 + rock * 0.12, 0.04 + rock * 0.03, 0.2 + rock * 0.19]}
                rotation={[rock * 0.7, index, 0.3]}
                scale={[0.22, 0.14, 0.18]}
              >
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                  color={rock % 2 ? "#7d8773" : "#9fa28b"}
                  roughness={1}
                  flatShading
                />
              </mesh>
            ))}
          </group>
        ))}
    </>
  )
}

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
        <sphereGeometry args={[1, 7, 5]} />
        <meshStandardMaterial roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={petalsRef} args={[undefined, undefined, defaultBoard.tiles.length * 24]}>
        <sphereGeometry args={[1, 8, 5]} />
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={`${side}-${index}`}
            position={[side * (16 + (index % 2) * 5), -0.7, 4 - index * 16]}
            scale={[7 + (index % 3), 2.2 + (index % 2), 12]}
            receiveShadow
          >
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={index % 2 ? "#718751" : "#82975c"} roughness={1} />
          </mesh>
        )),
      )}
    </group>
  )
}
