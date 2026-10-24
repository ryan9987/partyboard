import { useMemo } from "react"
import * as THREE from "three"

export function SwordModel({ color = "#e5ba63" }: { color?: string }) {
  const blade = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.065, 0.16)
    shape.lineTo(-0.065, 0.91)
    shape.lineTo(0, 1.1)
    shape.lineTo(0.065, 0.91)
    shape.lineTo(0.065, 0.16)
    shape.closePath()
    return shape
  }, [])
  return (
    <group>
      <mesh castShadow position={[0, 0, -0.02]}>
        <extrudeGeometry
          args={[
            blade,
            {
              depth: 0.04,
              bevelEnabled: true,
              bevelSize: 0.012,
              bevelThickness: 0.008,
              bevelSegments: 2,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial color="#d9e2df" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.56, 0.03]}>
        <boxGeometry args={[0.012, 0.7, 0.006]} />
        <meshStandardMaterial color="#94aaa5" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.14, 0]}>
        <boxGeometry args={[0.34, 0.055, 0.085]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.22, 10]} />
        <meshStandardMaterial color="#63462e" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[0, -0.06 + index * 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.044, 0.009, 5, 10]} />
          <meshStandardMaterial color="#b18d55" metalness={0.35} />
        </mesh>
      ))}
      <mesh castShadow position={[0, -0.14, 0]}>
        <icosahedronGeometry args={[0.065, 1]} />
        <meshStandardMaterial color={color} metalness={0.45} roughness={0.25} />
      </mesh>
    </group>
  )
}
