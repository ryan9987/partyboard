import { Line } from "@react-three/drei"

export function AcornModel() {
  return (
    <group scale={0.38}>
      <mesh castShadow scale={[0.8, 1.1, 0.8]}>
        <sphereGeometry args={[0.36, 24, 16]} />
        <meshPhysicalMaterial
          color="#efa143"
          emissive="#dc6b23"
          emissiveIntensity={0.22}
          roughness={0.4}
          clearcoat={0.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.22, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.34, 18, 12]} />
        <meshStandardMaterial color="#836240" roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.63) * 0.29, 0.24, Math.sin(i * 0.63) * 0.29]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color="#b38c51" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.4, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.035, 0.055, 0.23, 8]} />
        <meshStandardMaterial color="#5b4d30" />
      </mesh>
    </group>
  )
}

// Grip is the origin. Every prop is mounted to the animated wrist, not world space.
export function FishingRod() {
  return (
    <group>
      <mesh castShadow position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.032, 0.42, 12]} />
        <meshStandardMaterial color="#886145" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.025, 1.45, 12]} />
        <meshStandardMaterial color="#345a50" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.065, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.09, 16]} />
        <meshStandardMaterial color="#bdad76" metalness={0.7} roughness={0.3} />
      </mesh>
      {[0.45, 0.85, 1.25, 1.65].map((z) => (
        <mesh key={z} position={[0, -0.02, z]}>
          <torusGeometry args={[0.026, 0.006, 6, 10]} />
          <meshStandardMaterial color="#d5cda8" metalness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

export function BowModel() {
  const curve: [number, number, number][] = Array.from({ length: 25 }, (_, i) => {
    const y = (i / 24 - 0.5) * 1.25
    return [0, y, 0.12 + Math.cos((y * Math.PI) / 1.25) * 0.22]
  })
  return (
    <group rotation={[1.4, 0, 0]}>
      <Line points={curve} color="#875a35" lineWidth={5} />
      <Line
        points={[
          [0, -0.625, 0.12],
          [0, 0, -0.09],
          [0, 0.625, 0.12],
        ]}
        color="#e8dfbb"
        lineWidth={1}
      />
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.18, 12]} />
        <meshStandardMaterial color="#443d30" />
      </mesh>
    </group>
  )
}

export function DrumStick() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.43, 10]} />
        <meshStandardMaterial color="#d4b47c" />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.025, 10, 8]} />
        <meshStandardMaterial color="#e9d6aa" />
      </mesh>
    </group>
  )
}
