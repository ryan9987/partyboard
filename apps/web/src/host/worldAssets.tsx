import { useGLTF } from "@react-three/drei"
import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import {
  propMaterial,
  usePropGeometry,
  WORLD_MODEL_URL,
  type Placement,
  type PropName,
} from "./worldProps"

const scratchObject = new THREE.Object3D()
const scratchColor = new THREE.Color()

function applyPlacement(target: THREE.Object3D, placement: Placement) {
  target.position.set(...placement.position)
  const rotation = placement.rotation ?? 0
  if (typeof rotation === "number") target.rotation.set(0, rotation, 0)
  else target.rotation.set(...rotation)
  const scale = placement.scale ?? 1
  if (typeof scale === "number") target.scale.setScalar(scale)
  else target.scale.set(...scale)
}

type PropInstancesProps = {
  name: PropName
  placements: readonly Placement[]
  castShadow?: boolean
  receiveShadow?: boolean
}

export function PropInstances({
  name,
  placements,
  castShadow = true,
  receiveShadow = false,
}: PropInstancesProps) {
  const geometry = usePropGeometry(name)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const tinted = useMemo(() => placements.some((placement) => placement.color), [placements])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    placements.forEach((placement, index) => {
      applyPlacement(scratchObject, placement)
      scratchObject.updateMatrix()
      mesh.setMatrixAt(index, scratchObject.matrix)
      if (tinted) mesh.setColorAt(index, scratchColor.set(placement.color ?? "#ffffff"))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements, tinted])

  if (placements.length === 0) return null
  return (
    <instancedMesh
      // Instance capacity is fixed at creation, so remount when the count or tinting changes.
      key={`${placements.length}-${tinted}`}
      ref={meshRef}
      args={[geometry, propMaterial, placements.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}

type PropProps = Omit<Placement, "color"> & {
  name: PropName
  castShadow?: boolean
  receiveShadow?: boolean
}

export function Prop({ name, castShadow = true, receiveShadow = false, ...placement }: PropProps) {
  const geometry = usePropGeometry(name)
  const rotation = placement.rotation ?? 0
  const scale = placement.scale ?? 1
  return (
    <mesh
      castShadow={castShadow}
      geometry={geometry}
      material={propMaterial}
      position={placement.position as [number, number, number]}
      receiveShadow={receiveShadow}
      rotation={
        typeof rotation === "number" ? [0, rotation, 0] : (rotation as [number, number, number])
      }
      scale={typeof scale === "number" ? scale : (scale as [number, number, number])}
    />
  )
}

useGLTF.preload(WORLD_MODEL_URL, false)
