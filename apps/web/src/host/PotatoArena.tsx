import type { GameState } from "@party-board/protocol"
import { useFrame } from "@react-three/fiber"
import { useRef, type RefObject } from "react"
import * as THREE from "three"
import { CharacterModel } from "./CharacterModel"
import { AcornModel } from "./GameEquipment"
import { ArenaEnvironment } from "./MinigameArena"
import { smoothStep } from "./trailMotion"

function PassingAcorn({
  holderId,
  grips,
}: {
  holderId: string | null
  grips: RefObject<Map<string, THREE.Group>>
}) {
  const root = useRef<THREE.Group>(null)
  const previous = useRef<string | null>(null)
  const origin = useRef(new THREE.Vector3())
  const progress = useRef(1)
  const target = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    const group = root.current
    const grip = holderId ? grips.current.get(holderId) : null
    if (!group) return
    group.visible = !!grip
    if (!grip) return
    grip.updateWorldMatrix(true, false)
    target.current.set(0, -0.025, 0.13).applyMatrix4(grip.matrixWorld)
    if (previous.current !== holderId) {
      origin.current.copy(previous.current ? group.position : target.current)
      progress.current = previous.current ? 0 : 1
      previous.current = holderId
    }
    progress.current = Math.min(1, progress.current + delta / 0.28)
    group.position.lerpVectors(origin.current, target.current, smoothStep(progress.current))
    group.position.y += Math.sin(progress.current * Math.PI) ** 2 * 0.5
    group.rotation.y += delta * (progress.current < 1 ? 6 : 0.3)
  })
  return (
    <group ref={root} visible={false}>
      <AcornModel />
    </group>
  )
}

export function PotatoArena({ state }: { state: GameState }) {
  const game = state.potato!
  const grips = useRef(new Map<string, THREE.Group>())
  return (
    <>
      <ArenaEnvironment close />
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[3.4, 3.6, 0.24, 64]} />
        <meshStandardMaterial color="#d6c6a0" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, 0]}>
        <ringGeometry args={[2.9, 2.97, 64]} />
        <meshStandardMaterial color="#a38954" />
      </mesh>
      {game.participantIds.map((id, index) => {
        const player = state.players.find((entry) => entry.id === id)!
        const alive = game.aliveIds.includes(id)
        const angle = Math.PI + (index / game.participantIds.length) * Math.PI * 2
        const position: [number, number, number] = alive
          ? [Math.cos(angle) * 2.1, -0.31, Math.sin(angle) * 2.1]
          : [-1.3 + index * 0.8, -0.46, -4.5]
        return (
          <CharacterModel
            key={id}
            centered
            active={game.holderId === id || game.winnerId === id}
            color={player.color}
            moving={false}
            playerIndex={index}
            position={position}
            facing={alive ? Math.atan2(-position[0], -position[2]) : 0}
            pose={game.holderId === id ? "carry" : undefined}
            rightHand={
              <group
                ref={(grip) => {
                  if (grip) grips.current.set(id, grip)
                  else grips.current.delete(id)
                }}
              />
            }
          />
        )
      })}
      <PassingAcorn holderId={game.holderId} grips={grips} />
    </>
  )
}
