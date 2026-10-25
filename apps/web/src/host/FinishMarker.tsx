import { useEffect, useMemo } from "react"
import { defaultBoard } from "@party-board/board"
import * as THREE from "three"

/** A locally authored timber finish arch, with no downloaded fonts or assets. */
export function FinishMarker() {
  const tile = defaultBoard.tiles.find((entry) => entry.id === defaultBoard.finishTileId)!
  const lettering = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#fff5d8"
    ctx.fillRect(0, 0, 512, 128)
    ctx.fillStyle = "#294c3d"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = "bold 74px Trebuchet MS, sans-serif"
    ctx.fillText("FINISH", 256, 66)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  useEffect(() => () => lettering.dispose(), [lettering])
  return (
    <group position={[tile.position[0], 0, tile.position[2] - 1]}>
      {[-1.5, 1.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 2.9, 10]} />
            <meshStandardMaterial color="#765333" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 2.98, 0]}>
            <sphereGeometry args={[0.18, 12, 8]} />
            <meshStandardMaterial color="#c29a4e" metalness={0.25} roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.28, 0.32, 0.25, 8]} />
            <meshStandardMaterial color="#c8c1a4" />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 2.52, 0]}>
        <boxGeometry args={[3.4, 0.78, 0.26]} />
        <meshStandardMaterial color="#765333" />
      </mesh>
      <mesh position={[0, 2.52, 0.14]}>
        <planeGeometry args={[3.06, 0.59]} />
        <meshStandardMaterial map={lettering} roughness={0.9} />
      </mesh>
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <mesh key={x} position={[x, 2.0, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.18, 0.37, 3]} />
          <meshStandardMaterial
            color={["#d17473", "#8fbc9c", "#e9c879", "#a394cb", "#fff5d8"][i]!}
          />
        </mesh>
      ))}
    </group>
  )
}
