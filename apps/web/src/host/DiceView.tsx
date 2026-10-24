import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState, type RefObject } from "react"
import * as THREE from "three"

import { faceCameraQuaternion } from "./diceOrientation"
import { Prop } from "./worldAssets"

const TUMBLE_AXIS = new THREE.Vector3(0.63, 0.74, 0.24).normalize()
const IDLE_AXIS = new THREE.Vector3(0, 1, 0)

type DiceViewProps = {
  position?: readonly [number, number, number]
  value: number | null
  rolling: boolean
  follow?: RefObject<THREE.Vector3>
  followOffset?: readonly [number, number, number]
  tracking?: boolean
}

/**
 * Renders the server-supplied value. While rolling the die tumbles freely; once the
 * value is known and rolling stops, the rolled face is turned toward the camera so the
 * number players read always matches the authoritative result.
 */
export function DiceView({
  position = [0, 1.85, 0],
  value,
  rolling,
  follow,
  followOffset = [0, 0, 0],
  tracking = false,
}: DiceViewProps) {
  const floatRef = useRef<THREE.Group>(null)
  const dieRef = useRef<THREE.Group>(null)
  const basePosition = useMemo(() => new THREE.Vector3(...position), [position])
  const [initialPosition] = useState(() => [...position] as [number, number, number])
  const scratchRef = useRef({
    toCamera: new THREE.Vector3(),
    worldPosition: new THREE.Vector3(),
    cameraUp: new THREE.Vector3(),
    target: new THREE.Quaternion(),
    step: new THREE.Quaternion(),
    desiredPosition: new THREE.Vector3(),
    cameraDirection: [0, 0, 0] as [number, number, number],
    cameraUpDirection: [0, 1, 0] as [number, number, number],
  })

  useFrame((state, delta) => {
    const scratch = scratchRef.current
    const floating = floatRef.current
    const die = dieRef.current
    if (!floating || !die) return

    const desired = scratch.desiredPosition.copy(follow?.current ?? basePosition)
    if (follow) {
      desired.x += followOffset[0]
      desired.y += followOffset[1]
      desired.z += followOffset[2]
    }
    desired.y += Math.sin(state.clock.elapsedTime * 2.2) * 0.08
    if (tracking || floating.position.distanceToSquared(desired) > 225)
      floating.position.copy(desired)
    else floating.position.lerp(desired, 1 - Math.exp(-delta * 10))

    if (rolling) {
      scratch.step.setFromAxisAngle(TUMBLE_AXIS, delta * 14)
      die.quaternion.premultiply(scratch.step)
      return
    }

    floating.getWorldPosition(scratch.worldPosition)
    scratch.toCamera.copy(state.camera.position).sub(scratch.worldPosition)
    scratch.cameraUp.set(0, 1, 0).applyQuaternion(state.camera.quaternion)
    scratch.toCamera.toArray(scratch.cameraDirection)
    scratch.cameraUp.toArray(scratch.cameraUpDirection)
    const target =
      value === null
        ? null
        : faceCameraQuaternion(
            value,
            scratch.cameraDirection,
            scratch.cameraUpDirection,
            scratch.target,
          )
    if (!target) {
      scratch.step.setFromAxisAngle(IDLE_AXIS, delta * 0.5)
      die.quaternion.premultiply(scratch.step)
      return
    }

    die.quaternion.slerp(target, 1 - Math.exp(-delta * 12))
  })

  return (
    <group ref={floatRef} position={initialPosition} scale={0.52}>
      <group ref={dieRef}>
        <Prop name="Die" position={[0, 0, 0]} />
      </group>
    </group>
  )
}
