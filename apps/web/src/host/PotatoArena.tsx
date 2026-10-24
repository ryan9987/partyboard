import type { GameState } from "@party-board/protocol"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { CharacterModel } from "./CharacterModel"
import { MeadowGround, MeadowPlanting, WoodlandTree } from "./WoodlandDetails"
import { createSurfaceTexture } from "./sceneryMaterials"

function positionFor(index: number, count: number, radius = 2.1): [number, number, number] {
  const angle = Math.PI + (index / count) * Math.PI * 2
  return [Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius]
}

function HotAcorn({ state }: { state: GameState }) {
  const root = useRef<THREE.Group>(null)
  const origin = useRef(new THREE.Vector3(0, 2, 0))
  const progress = useRef(0)
  const game = state.potato!
  useEffect(() => {
    if (root.current) origin.current.copy(root.current.position)
    progress.current = 0
  }, [game.holderId, game.stage])
  useFrame((frame, delta) => {
    const group = root.current
    if (!group) return
    const index = game.participantIds.indexOf(game.holderId ?? "")
    const position = index < 0 ? [0, -0.2, 0] : positionFor(index, game.participantIds.length)
    const target = new THREE.Vector3(position[0], 2.05, position[2])
    progress.current = Math.min(1, progress.current + delta * 3.5)
    group.position.lerpVectors(origin.current, target, progress.current)
    group.position.y +=
      Math.sin(progress.current * Math.PI) * 1.1 + Math.sin(frame.clock.elapsedTime * 4) * 0.045
    group.rotation.y += delta * 0.7
  })
  return (
    <group ref={root} position={[0, 2, 0]} scale={0.7}>
      <mesh castShadow scale={[0.8, 1.1, 0.8]}>
        <sphereGeometry args={[0.36, 24, 16]} />
        <meshPhysicalMaterial
          color="#efa143"
          emissive="#dc6b23"
          emissiveIntensity={0.35}
          roughness={0.3}
          clearcoat={0.7}
        />
      </mesh>
      <mesh castShadow position={[0, 0.22, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.34, 18, 12]} />
        <meshStandardMaterial color="#836240" roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh
          key={index}
          position={[Math.cos(index * 0.63) * 0.29, 0.24, Math.sin(index * 0.63) * 0.29]}
          rotation={[0, index, 0.4]}
        >
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color="#b38c51" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.4, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.035, 0.055, 0.23, 8]} />
        <meshStandardMaterial color="#5b4d30" />
      </mesh>
      <mesh
        castShadow
        position={[0.13, 0.43, 0]}
        scale={[0.16, 0.035, 0.07]}
        rotation={[0, 0, 0.4]}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#83a45f" />
      </mesh>
      <pointLight color="#ffb550" intensity={8} distance={3} />
    </group>
  )
}

export function PotatoArena({ state }: { state: GameState }) {
  const game = state.potato!
  const { camera } = useThree()
  const stone = useMemo(() => createSurfaceTexture("stone"), [])
  useEffect(() => {
    camera.position.set(6, 6, 10)
    camera.lookAt(0, 1, 0)
    return () => stone.dispose()
  }, [camera, stone])
  return (
    <>
      <fog attach="fog" args={["#aed7e4", 18, 35]} />
      <hemisphereLight color="#e7f4ff" groundColor="#57643b" intensity={1.35} />
      <directionalLight
        castShadow
        position={[-5, 12, 7]}
        intensity={2.6}
        color="#fff4d1"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-normalBias={0.035}
      />
      <MeadowGround />
      <MeadowPlanting clearingRadius={3.7} />
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[3.4, 3.6, 0.24, 64]} />
        <meshStandardMaterial color="#dfcfaa" map={stone} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[2.9, 2.97, 64]} />
        <meshStandardMaterial color="#a38954" />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((index) => (
          <WoodlandTree
            key={`${side}-${index}`}
            position={[side * (6 + (index % 2)), 3 - index * 4]}
            scale={1.1 + index * 0.07}
          />
        )),
      )}
      {game.participantIds.map((id, index) => {
        const player = state.players.find((entry) => entry.id === id)!
        const alive = game.aliveIds.includes(id)
        const position = alive
          ? positionFor(index, game.participantIds.length)
          : ([-1.3 + index * 0.8, -0.46, -4.5] as [number, number, number])
        return (
          <CharacterModel
            key={id}
            active={game.holderId === id || game.winnerId === id}
            color={player.color}
            moving={false}
            playerIndex={index}
            position={position}
            facing={alive ? Math.atan2(-position[0], -position[2]) : 0}
          />
        )
      })}
      <HotAcorn state={state} />
    </>
  )
}
