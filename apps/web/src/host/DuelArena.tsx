import type { DuelState, GameState } from "@party-board/protocol"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { CharacterModel } from "./CharacterModel"
import { MeadowGround, MeadowPlanting, WoodlandTree } from "./WoodlandDetails"
import { createSurfaceTexture } from "./sceneryMaterials"
import { useGameClock } from "../networking/gameClock"

function ArenaCamera() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(5.8, 5.2, 9)
    camera.lookAt(0, 0.8, 0)
  }, [camera])
  return null
}

function ClashFlash({ duel }: { duel: DuelState }) {
  const ref = useRef<THREE.Group>(null)
  const changedAt = useRef(0)
  useEffect(() => {
    changedAt.current = performance.now()
  }, [duel.revision])
  useFrame(() => {
    if (!ref.current) return
    const age = (performance.now() - changedAt.current) / 650
    ref.current.visible = age < 1 && ["block", "clash", "hit"].includes(duel.outcome)
    ref.current.scale.setScalar(0.2 + age)
    ref.current.rotation.z = age * 2
  })
  return (
    <group ref={ref} position={[0, 1.35, 0]}>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh
          key={index}
          rotation={[0, 0, (index * Math.PI * 2) / 9]}
          position={[Math.cos(index) * 0.3, Math.sin(index) * 0.3, 0]}
        >
          <boxGeometry args={[0.035, 0.28, 0.035]} />
          <meshBasicMaterial color={duel.outcome === "hit" ? "#ffdc96" : "#e5ffff"} />
        </mesh>
      ))}
    </group>
  )
}

export function DuelArena({ state }: { state: GameState }) {
  const clock = useGameClock(state.serverTime)
  const duel = state.duel!
  const stone = useMemo(() => createSurfaceTexture("stone"), [])
  useEffect(() => () => stone.dispose(), [stone])
  return (
    <>
      <ArenaCamera />
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
      <MeadowPlanting clearingRadius={3.6} />
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[3.25, 3.5, 0.24, 64]} />
        <meshStandardMaterial map={stone} color="#dfd2af" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.7, 2.77, 64]} />
        <meshStandardMaterial color="#90764b" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.154, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.58, 40]} />
        <meshStandardMaterial color="#c3ae7d" />
      </mesh>
      {Array.from({ length: 20 }, (_, index) => {
        const angle = (index / 20) * Math.PI * 2
        return (
          <mesh
            key={index}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * 3.22, 0.22, Math.sin(angle) * 3.22]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.33, 0.26, 0.92]} />
            <meshStandardMaterial
              map={stone}
              color={index % 2 ? "#b5ae93" : "#c7bba1"}
              roughness={1}
            />
          </mesh>
        )
      })}
      {[-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((index) => (
          <WoodlandTree
            key={`${side}-${index}`}
            position={[side * (6 + (index % 2)), 3 - index * 4]}
            scale={1.1 + index * 0.07}
          />
        )),
      )}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.7, 0, -1.7]}>
          <mesh castShadow position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 2.6, 10]} />
            <meshStandardMaterial color="#695338" />
          </mesh>
          <mesh castShadow position={[side * 0.32, 2.15, 0]}>
            <boxGeometry args={[0.58, 0.72, 0.035]} />
            <meshStandardMaterial
              color={side < 0 ? "#d27668" : "#5e9e9b"}
              roughness={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[side * 0.32, 2.15, 0.025]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.15, 0.15, 0.02]} />
            <meshStandardMaterial color="#f4df9b" />
          </mesh>
          <mesh castShadow position={[0, 2.68, 0]}>
            <sphereGeometry args={[0.1, 12, 8]} />
            <meshStandardMaterial color="#d8b46d" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {duel.fighters.map((fighter, index) => {
        const player = state.players.find((entry) => entry.id === fighter.playerId)!
        return (
          <CharacterModel
            clock={clock}
            centered
            key={fighter.playerId}
            active={duel.winnerId === fighter.playerId}
            color={player.color}
            playerIndex={index}
            moving={false}
            position={[index === 0 ? -1 : 1, -0.23, 0]}
            facing={index === 0 ? Math.PI / 2 : -Math.PI / 2}
            combat={fighter}
          />
        )
      })}
      {state.players
        .filter((player) => !duel.fighters.some((fighter) => fighter.playerId === player.id))
        .map((player, index) => (
          <CharacterModel
            key={player.id}
            active={false}
            color={player.color}
            playerIndex={index}
            moving={false}
            position={[-1.1 + index * 2.2, -0.46, -4.2]}
          />
        ))}
      <ClashFlash duel={duel} />
    </>
  )
}
