import {
  archeryDrift,
  balanceLean,
  hazardLane,
  RHYTHM_BEAT_MS,
  type GameState,
  type MinigamePlayer,
  type MinigameState,
} from "@party-board/protocol"
import { Line } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, type RefObject } from "react"
import * as THREE from "three"
import { CharacterModel } from "./CharacterModel"
import { AcornModel, BowModel, DrumStick, FishingRod } from "./GameEquipment"
import { MeadowGround, MeadowPlanting, WoodlandTree } from "./WoodlandDetails"
import { createSurfaceTexture } from "./sceneryMaterials"
import { useGameClock } from "../networking/gameClock"
import { smoothStep } from "./trailMotion"

const COLORS = { coral: "#ed7180", cyan: "#40c1c8", gold: "#e0b745", violet: "#9476d4" }

export function ArenaEnvironment({ close = false }: { close?: boolean }) {
  const { camera } = useThree()
  useEffect(() => {
    if (close) camera.position.set(5.5, 5.5, 9.2)
    else camera.position.set(8.5, 7.5, 12.8)
    camera.lookAt(0, 0.7, -0.8)
  }, [camera, close])
  return (
    <>
      <fog attach="fog" args={["#aed7e4", 22, 43]} />
      <hemisphereLight color="#e7f4ff" groundColor="#57643b" intensity={1.4} />
      <directionalLight
        castShadow
        position={[-5, 12, 7]}
        intensity={2.6}
        color="#fff4d1"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-normalBias={0.035}
      />
      <MeadowGround />
      <MeadowPlanting clearingRadius={9} />
      {[-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((i) => (
          <WoodlandTree
            key={`${side}-${i}`}
            position={[side * (9.5 + (i % 2)), 3 - i * 4]}
            scale={1.15 + i * 0.06}
          />
        )),
      )}
      {[-5, 0, 5].map((x) => (
        <WoodlandTree key={x} position={[x, -10]} scale={1.1} />
      ))}
    </>
  )
}

function Pond() {
  return (
    <group position={[0, -0.1, -2]}>
      <mesh receiveShadow scale={[1, 1, 0.65]}>
        <cylinderGeometry args={[7.3, 7.6, 0.25, 72]} />
        <meshStandardMaterial color="#aa9d78" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]} scale={[1, 0.65, 1]}>
        <circleGeometry args={[7.1, 72]} />
        <meshPhysicalMaterial color="#5fada8" roughness={0.2} metalness={0.22} clearcoat={0.7} />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((i) => (
          <group key={`${side}-${i}`} position={[side * (6.3 - i * 0.25), 0.15, i - 1]}>
            {[0, 1, 2].map((j) => (
              <mesh key={j} position={[j * 0.09, 0.22, 0]} rotation={[0.08, 0, j * 0.15]}>
                <cylinderGeometry args={[0.015, 0.025, 0.7 + j * 0.12, 6]} />
                <meshStandardMaterial color="#708044" />
              </mesh>
            ))}
          </group>
        )),
      )}
    </group>
  )
}

function Dock({ x }: { x: number }) {
  return (
    <group position={[x, 0, 1.4]}>
      {[-0.72, 0.72].flatMap((px) =>
        [-0.9, 0.9].map((pz) => (
          <mesh castShadow key={`${px}-${pz}`} position={[px, -0.25, pz]}>
            <cylinderGeometry args={[0.08, 0.1, 1.05, 12]} />
            <meshStandardMaterial color="#72523a" roughness={0.95} />
          </mesh>
        )),
      )}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh castShadow receiveShadow key={i} position={[0, 0.02, (i - 4) * 0.24]}>
          <boxGeometry args={[1.75, 0.15, 0.22]} />
          <meshStandardMaterial color={i % 2 ? "#ab8056" : "#b88f62"} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function FishingLine({
  grip,
  player,
  x,
  clock,
}: {
  grip: RefObject<THREE.Group | null>
  player: MinigamePlayer
  x: number
  clock: () => number
}) {
  const bobber = useRef<THREE.Group>(null)
  const fish = useRef<THREE.Group>(null)
  const ripple = useRef<THREE.Mesh>(null)
  const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null)
  const scratchRef = useRef({ tip: new THREE.Vector3(), float: new THREE.Vector3() })
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3))
    const object = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: "#eee4cd", transparent: true, opacity: 0.8 }),
    )
    object.frustumCulled = false
    return object
  }, [])
  useEffect(
    () => () => {
      line.geometry.dispose()
      ;(line.material as THREE.Material).dispose()
    },
    [line],
  )
  useFrame(({ clock: renderClock }) => {
    const scratch = scratchRef.current
    if (!grip.current || !bobber.current || !fish.current || !ripple.current || !lineRef.current)
      return
    grip.current.updateWorldMatrix(true, false)
    const tip = scratch.tip.set(0, 0, 1.675).applyMatrix4(grip.current.matrixWorld)
    const float = scratch.float
    const age = Math.max(0, (clock() - player.actionAt) / 1000)
    const casting = player.status === "casting"
    const landed = player.status === "caught"
    const fishing = casting || player.status === "waiting" || player.status === "bite"
    const t = casting ? Math.min(1, age / 0.75) : 1
    float.set(x + 0.25, 0.08, -2.8)
    if (casting) {
      float.lerpVectors(tip, float, smoothStep(t))
      float.y += Math.sin(t * Math.PI) ** 2 * 1.4
    } else
      float.y +=
        Math.sin(renderClock.elapsedTime * (player.status === "bite" ? 16 : 3)) *
        (player.status === "bite" ? 0.09 : 0.025)
    bobber.current.visible = fishing
    bobber.current.position.copy(float)
    ripple.current.visible = fishing && !casting
    ripple.current.position.set(float.x, 0.06, float.z)
    ripple.current.scale.setScalar(0.8 + Math.sin(renderClock.elapsedTime * 4) * 0.15)
    fish.current.visible = landed && age < 1.5
    if (landed) {
      const reel = Math.min(1, age / 1.1)
      fish.current.position.lerpVectors(float, tip, smoothStep(reel))
      fish.current.position.y += Math.sin(reel * Math.PI) ** 2 * 0.8
      fish.current.rotation.z = Math.sin(age * 20) * 0.25
    }
    lineRef.current.material.opacity = fishing || (landed && age < 1.5) ? 0.8 : 0
    const end = landed ? fish.current.position : float
    const positions = lineRef.current.geometry.getAttribute("position") as THREE.BufferAttribute
    positions.setXYZ(0, tip.x, tip.y, tip.z)
    positions.setXYZ(1, (tip.x + end.x) / 2, (tip.y + end.y) / 2 - 0.12, (tip.z + end.z) / 2)
    positions.setXYZ(2, end.x, end.y, end.z)
    positions.needsUpdate = true
  })
  return (
    <>
      <primitive ref={lineRef} object={line} />
      <group ref={bobber} visible={false}>
        <mesh>
          <sphereGeometry args={[0.065, 16, 10]} />
          <meshStandardMaterial color="#f1e9cd" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
          <meshStandardMaterial color="#db6952" />
        </mesh>
      </group>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.15, 0.17, 32]} />
        <meshBasicMaterial color="#d8eee0" transparent opacity={0.7} />
      </mesh>
      <group ref={fish} visible={false}>
        <mesh scale={[0.13, 0.2, 0.36]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshPhysicalMaterial color="#d7c982" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.16, 0.22, 3]} />
          <meshStandardMaterial color="#b8a568" />
        </mesh>
        <mesh position={[0.12, 0.07, 0.21]}>
          <sphereGeometry args={[0.025, 10, 8]} />
          <meshStandardMaterial color="#283d35" />
        </mesh>
      </group>
    </>
  )
}

function ArrowModel() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.7, 8]} />
        <meshStandardMaterial color="#cdb384" />
      </mesh>
      <mesh position={[0, 0, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.035, 0.11, 4]} />
        <meshStandardMaterial color="#7d8980" metalness={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.025, 0, 0.23]}>
          <boxGeometry args={[0.04, 0.006, 0.13]} />
          <meshStandardMaterial color="#f6e7bf" />
        </mesh>
      ))}
    </group>
  )
}

function ArcheryShot({
  grip,
  player,
  x,
  clock,
  shot,
}: {
  grip: RefObject<THREE.Group | null>
  player: MinigamePlayer
  x: number
  clock: () => number
  shot?: { offset: number; at: number }
}) {
  const arrow = useRef<THREE.Group>(null)
  const origin = useRef(new THREE.Vector3())
  const previous = useRef(0)
  const scratchRef = useRef({ target: new THREE.Vector3(), look: new THREE.Vector3() })
  useFrame(() => {
    const scratch = scratchRef.current
    if (!arrow.current || !grip.current) return
    const firedAt = shot?.at ?? player.actionAt
    const age = (clock() - firedAt) / 1000
    if (previous.current !== firedAt) {
      grip.current.getWorldPosition(origin.current)
      previous.current = firedAt
    }
    arrow.current.visible = player.attempts > 0
    const offset = shot?.offset ?? player.position
    const hitsTarget = Math.abs(offset * 1.7) < 0.7
    const target = scratch.target.set(
      x + offset * 1.7,
      hitsTarget ? 1.5 : -0.06,
      hitsTarget ? -5.54 : -7.2,
    )
    arrow.current.position.lerpVectors(origin.current, target, Math.min(1, Math.max(0, age / 0.48)))
    scratch.look.copy(target).z -= 1
    arrow.current.lookAt(scratch.look)
    arrow.current.rotateY(Math.PI)
  })
  return (
    <group ref={arrow} visible={false}>
      <ArrowModel />
    </group>
  )
}

function ArcheryTarget({ x }: { x: number }) {
  return (
    <group position={[x, 1.5, -6]}>
      {[-1, 1].map((side) => (
        <mesh
          castShadow
          key={side}
          position={[side * 0.4, -0.9, -0.08]}
          rotation={[0, 0, side * -0.18]}
        >
          <boxGeometry args={[0.08, 1.8, 0.09]} />
          <meshStandardMaterial color="#7a6142" />
        </mesh>
      ))}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.14, 48]} />
        <meshStandardMaterial color="#a18455" roughness={1} />
      </mesh>
      {[
        { r: 0.67, c: "#ece1bd" },
        { r: 0.52, c: "#506e6a" },
        { r: 0.36, c: "#cb6752" },
        { r: 0.18, c: "#e8bf58" },
      ].map(({ r, c }, i) => (
        <mesh key={r} position={[0, 0, 0.075 + i * 0.002]}>
          <circleGeometry args={[r, 48]} />
          <meshStandardMaterial color={c} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function DodgeHazard({
  game,
  index,
  x,
  clock,
}: {
  game: MinigameState
  index: number
  x: number
  clock: () => number
}) {
  const acorn = useRef<THREE.Group>(null)
  const warning = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!acorn.current || !warning.current) return
    const elapsed =
      game.stage === "intro" ? 0 : Math.max(0, Math.min(game.durationMs, clock() - game.startsAt))
    const wave = Math.floor(elapsed / 1800)
    const phase = elapsed % 1800
    const laneX = x + hazardLane(wave, index) * 0.63
    warning.current.position.x = laneX
    warning.current.visible = game.stage === "active" && phase < 1500
    warning.current.scale.setScalar(phase < 900 ? 0.8 : 1.05)
    acorn.current.visible = game.stage === "active" && phase > 900 && phase < 1500
    acorn.current.position.set(laneX, 4.5 - Math.min(1, (phase - 900) / 550) * 3, 0)
    acorn.current.rotation.z = phase / 230
  })
  return (
    <>
      <group ref={acorn}>
        <AcornModel />
      </group>
      <mesh ref={warning} position={[x, -0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.3, 32]} />
        <meshBasicMaterial color="#b95e3e" transparent opacity={0.8} />
      </mesh>
    </>
  )
}

function Contestant({ state, index }: { state: GameState; index: number }) {
  const clock = useGameClock(state.serverTime)
  const game = state.minigame!
  const entry = game.players[index]!
  const player = state.players.find((candidate) => candidate.id === entry.playerId)!
  const x = (index - (game.players.length - 1) / 2) * 2.85
  const grip = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const log = useRef<THREE.Group>(null)
  const cue = useRef<THREE.Mesh>(null)
  const crosshair = useRef<THREE.Group>(null)
  const bark = useMemo(() => createSurfaceTexture("bark"), [])
  useEffect(() => () => bark.dispose(), [bark])
  useFrame((_, delta) => {
    const elapsed =
      game.stage === "intro" ? 0 : Math.max(0, Math.min(game.durationMs, clock() - game.startsAt))
    if (root.current) {
      const desired =
        game.kind === "dodge" && entry.alive
          ? entry.position * 0.63
          : game.kind === "balance"
            ? entry.position * 0.2
            : 0
      root.current.position.x = THREE.MathUtils.damp(
        root.current.position.x,
        x + desired,
        16,
        delta,
      )
    }
    if (log.current)
      log.current.rotation.z = THREE.MathUtils.damp(
        log.current.rotation.z,
        balanceLean(elapsed, index) * -0.16,
        12,
        delta,
      )
    if (cue.current) {
      const beat = (elapsed % RHYTHM_BEAT_MS) / RHYTHM_BEAT_MS
      cue.current.scale.setScalar(1 + (1 - beat) * 0.18)
      ;(cue.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        beat < 0.16 || beat > 0.84 ? 0.55 : 0
    }
    if (crosshair.current)
      crosshair.current.position.x = THREE.MathUtils.damp(
        crosshair.current.position.x,
        x + (entry.axis + archeryDrift(elapsed)) * 1.7,
        24,
        delta,
      )
  })
  const fishing = game.kind === "fishing"
  const archery = game.kind === "archery"
  const balance = game.kind === "balance"
  const rhythm = game.kind === "rhythm"
  const y = fishing
    ? -0.29
    : balance && entry.alive
      ? 0
      : game.kind === "dodge" && entry.alive
        ? -0.44
        : -0.48
  return (
    <>
      {fishing && <Dock x={x} />}
      {balance && (
        <group ref={log} position={[x, -0.02, 0]}>
          <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.39, 0.42, 2.2, 24]} />
            <meshStandardMaterial map={bark} color="#ae8b62" roughness={1} />
          </mesh>
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[0, 0, side * 1.106]}
              rotation={[0, side < 0 ? Math.PI : 0, 0]}
            >
              <mesh>
                <circleGeometry args={[0.37, 32]} />
                <meshStandardMaterial color="#cbad78" />
              </mesh>
              {[0.12, 0.22, 0.31].map((r) => (
                <mesh key={r} position={[0, 0, 0.002]}>
                  <ringGeometry args={[r, r + 0.008, 32]} />
                  <meshStandardMaterial color="#9d7a4c" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {game.kind === "dodge" && (
        <>
          <mesh receiveShadow position={[x, -0.145, 0]}>
            <boxGeometry args={[2.2, 0.15, 2]} />
            <meshStandardMaterial color="#d8c9a5" />
          </mesh>
          {[-1, 1].map((lane) => (
            <mesh key={lane} position={[x + lane * 0.32, -0.065, 0]}>
              <boxGeometry args={[0.016, 0.006, 1.8]} />
              <meshStandardMaterial color="#a9926d" />
            </mesh>
          ))}
          <DodgeHazard game={game} index={index} x={x} clock={clock} />
        </>
      )}
      <group ref={root} position={[x, 0, 0]}>
        <CharacterModel
          clock={clock}
          centered
          active={game.winnerIds.includes(player.id)}
          color={player.color}
          moving={false}
          playerIndex={index}
          position={[0, y, fishing ? 1.4 : entry.alive ? 0 : balance ? 4.2 : 2]}
          facing={fishing || archery ? Math.PI : 0}
          pose={
            fishing
              ? "fishing"
              : archery
                ? "archery"
                : balance
                  ? "balance"
                  : rhythm
                    ? "rhythm"
                    : undefined
          }
          actionAt={entry.actionAt}
          lean={entry.position}
          rightHand={
            <group ref={grip}>
              {fishing ? (
                <FishingRod />
              ) : rhythm ? (
                <DrumStick />
              ) : archery && entry.attempts < 3 ? (
                <group rotation={[1.35, Math.PI, 0]}>
                  <ArrowModel />
                </group>
              ) : null}
            </group>
          }
          leftHand={archery ? <BowModel /> : rhythm ? <DrumStick /> : undefined}
        />
      </group>
      {fishing && <FishingLine grip={grip} player={entry} x={x} clock={clock} />}
      {archery && (
        <>
          <ArcheryTarget x={x} />
          {entry.shots?.length ? (
            entry.shots.map((shot, i) => (
              <ArcheryShot key={i} grip={grip} player={entry} x={x} clock={clock} shot={shot} />
            ))
          ) : (
            <ArcheryShot grip={grip} player={entry} x={x} clock={clock} />
          )}
          <group ref={crosshair} position={[x, 1.5, -5.87]}>
            <Line
              points={[
                [-0.07, 0, 0],
                [0.07, 0, 0],
              ]}
              color="#243f37"
              lineWidth={2}
            />
            <Line
              points={[
                [0, -0.07, 0],
                [0, 0.07, 0],
              ]}
              color="#243f37"
              lineWidth={2}
            />
          </group>
        </>
      )}
      {rhythm && (
        <group position={[x, 0.45, 0.65]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.29, 0.53, 32]} />
            <meshStandardMaterial color="#80593e" roughness={0.8} />
          </mesh>
          {[-0.25, 0.25].map((height) => (
            <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[height > 0 ? 0.345 : 0.295, 0.018, 8, 32]} />
              <meshStandardMaterial color="#c9b77d" metalness={0.5} roughness={0.45} />
            </mesh>
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <mesh
              key={i}
              position={[Math.cos((i * Math.PI) / 6) * 0.32, 0, Math.sin((i * Math.PI) / 6) * 0.32]}
              rotation={[0, 0, 0.1]}
            >
              <cylinderGeometry args={[0.008, 0.008, 0.48, 6]} />
              <meshStandardMaterial color="#d8c697" />
            </mesh>
          ))}
          <mesh ref={cue} position={[0, 0.275, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.025, 32]} />
            <meshStandardMaterial color="#e6d3a5" emissive="#d4a951" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.22, -0.4, 0]} rotation={[0, 0, side * -0.16]}>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
              <meshStandardMaterial color="#544737" />
            </mesh>
          ))}
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.095, 2.5]}>
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial color={COLORS[player.color]} />
      </mesh>
    </>
  )
}

export function MinigameArena({ state }: { state: GameState }) {
  const game = state.minigame!
  return (
    <>
      <ArenaEnvironment />
      {["fishing", "balance"].includes(game.kind) && <Pond />}
      {game.players.map((player, index) => (
        <Contestant key={player.playerId} state={state} index={index} />
      ))}
    </>
  )
}
