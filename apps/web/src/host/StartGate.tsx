import { useEffect, useMemo } from "react"
import { defaultBoard } from "@party-board/board"
import { getStartGatePlacement, liftStartGateVertex } from "./boardPath"
import { propMaterial, usePropGeometry } from "./worldProps"

const placement = getStartGatePlacement(defaultBoard.tiles)

/** Reuse the authored timber gate, with actual walking clearance under its header. */
export function StartGate() {
  const original = usePropGeometry("StartGate")
  const geometry = useMemo(() => {
    const raised = original.clone()
    const positions = raised.getAttribute("position")
    for (let i = 0; i < positions.count; i++)
      positions.setY(i, liftStartGateVertex(positions.getY(i)))
    positions.needsUpdate = true
    raised.computeVertexNormals()
    raised.computeBoundingBox()
    raised.computeBoundingSphere()
    return raised
  }, [original])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      material={propMaterial}
      position={placement.position}
      rotation={[0, placement.rotation, 0]}
      castShadow
      receiveShadow
    />
  )
}
