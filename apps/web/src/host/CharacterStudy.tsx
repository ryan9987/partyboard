import { Canvas, useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { CharacterModel } from "./CharacterModel"

function PortraitCamera() {
  const { camera } = useThree()
  useEffect(() => {
    camera.lookAt(0, 0.7, 0)
  }, [camera])
  return null
}

export function CharacterStudy() {
  return (
    <Canvas camera={{ position: [2.5, 1.8, 3.2], fov: 32 }} shadows dpr={[1, 1.5]}>
      <PortraitCamera />
      <color attach="background" args={["#dedfce"]} />
      <hemisphereLight intensity={2} color="#fff5df" groundColor="#64745b" />
      <directionalLight
        castShadow
        intensity={2.3}
        position={[-3, 5, 4]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <group position={[0, -0.55, 0]}>
        <CharacterModel
          centered
          active={false}
          color="coral"
          moving={false}
          playerIndex={0}
          position={[0, 0, 0]}
          facing={0.3}
        />
      </group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#dedfce" roughness={1} />
      </mesh>
    </Canvas>
  )
}
