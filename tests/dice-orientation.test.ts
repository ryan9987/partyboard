import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { DIE_FACES, faceCameraQuaternion } from "../apps/web/src/host/diceOrientation"

type Vec3 = [number, number, number]

function rotate(q: { x: number; y: number; z: number; w: number }, v: Vec3): Vec3 {
  // v' = q v q*, expanded.
  const [vx, vy, vz] = v
  const tx = 2 * (q.y * vz - q.z * vy)
  const ty = 2 * (q.z * vx - q.x * vz)
  const tz = 2 * (q.x * vy - q.y * vx)
  return [
    vx + q.w * tx + (q.y * tz - q.z * ty),
    vy + q.w * ty + (q.z * tx - q.x * tz),
    vz + q.w * tz + (q.x * ty - q.y * tx),
  ]
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v)
  return [v[0] / length, v[1] / length, v[2] / length]
}

describe("dice orientation", () => {
  // The host camera looks down at the die from above and behind, so a camera-agnostic
  // "front" face is not what players read. Cover that view plus a few others.
  const views: { toCamera: Vec3; cameraUp: Vec3 }[] = [
    { toCamera: [0.31, 0.43, 0.85], cameraUp: [-0.1, 0.9, -0.43] },
    { toCamera: [0, 0, 1], cameraUp: [0, 1, 0] },
    { toCamera: [-0.6, 0.7, 0.4], cameraUp: [0.3, 0.6, -0.7] },
    { toCamera: [0, 1, 0.0001], cameraUp: [0, 0, -1] },
  ]

  for (const value of [1, 2, 3, 4, 5, 6]) {
    it(`shows ${value} square to the camera with upright pips`, () => {
      for (const view of views) {
        const toCamera = normalize(view.toCamera)
        const q = faceCameraQuaternion(value, toCamera, view.cameraUp)
        expect(q).not.toBeNull()
        const shownNormal = rotate(q!, [...DIE_FACES[value]!.normal])
        expect(dot(shownNormal, toCamera)).toBeCloseTo(1, 5)

        // No other face may point more toward the viewer than the rolled one.
        for (const other of [1, 2, 3, 4, 5, 6].filter((candidate) => candidate !== value)) {
          expect(dot(rotate(q!, [...DIE_FACES[other]!.normal]), toCamera)).toBeLessThan(0.01)
        }

        const shownUp = rotate(q!, [...DIE_FACES[value]!.up])
        const screenUp = normalize(view.cameraUp)
        const projected = normalize([
          screenUp[0] - toCamera[0] * dot(screenUp, toCamera),
          screenUp[1] - toCamera[1] * dot(screenUp, toCamera),
          screenUp[2] - toCamera[2] * dot(screenUp, toCamera),
        ])
        expect(dot(shownUp, projected)).toBeCloseTo(1, 4)
      }
    })
  }

  it("rejects values the server can never send", () => {
    expect(faceCameraQuaternion(0, [0, 0, 1], [0, 1, 0])).toBeNull()
    expect(faceCameraQuaternion(7, [0, 0, 1], [0, 1, 0])).toBeNull()
  })
})

describe("exported die model", () => {
  // Reads the Blender-generated world.glb and counts the dark pip discs on each face, so
  // regenerating the model can never silently disagree with DIE_FACES.
  const glb = readFileSync(
    fileURLToPath(new URL("../apps/web/public/models/world.glb", import.meta.url)),
  )
  const jsonLength = glb.readUInt32LE(12)
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8")) as {
    nodes: { name: string; mesh?: number }[]
    meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[]
    accessors: {
      bufferView: number
      byteOffset?: number
      componentType: number
      count: number
      type: string
      normalized?: boolean
    }[]
    bufferViews: { byteOffset?: number; byteStride?: number }[]
  }
  const binStart = 20 + jsonLength + 8

  function readAccessor(index: number): number[][] {
    const accessor = gltf.accessors[index]!
    const view = gltf.bufferViews[accessor.bufferView]!
    const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type]!
    const bytes = { 5126: 4, 5123: 2, 5125: 4, 5121: 1 }[accessor.componentType]!
    const stride = view.byteStride ?? size * bytes
    const base = binStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const read = (offset: number) => {
      switch (accessor.componentType) {
        case 5126:
          return glb.readFloatLE(offset)
        case 5123:
          return glb.readUInt16LE(offset) / (accessor.normalized ? 65535 : 1)
        case 5125:
          return glb.readUInt32LE(offset)
        default:
          return glb.readUInt8(offset) / (accessor.normalized ? 255 : 1)
      }
    }
    return Array.from({ length: accessor.count }, (_, item) =>
      Array.from({ length: size }, (_, component) =>
        read(base + item * stride + component * bytes),
      ),
    )
  }

  it("has the pip count from DIE_FACES on every face", () => {
    const node = gltf.nodes.find((candidate) => candidate.name === "Die")
    expect(node?.mesh).toBeDefined()
    const primitive = gltf.meshes[node!.mesh!]!.primitives[0]!
    const positions = readAccessor(primitive.attributes.POSITION!)
    const colors = readAccessor(primitive.attributes.COLOR_0!)

    const pipCentres = new Map<number, Set<string>>()
    positions.forEach((position, index) => {
      const color = colors[index]!
      if (color[0]! + color[1]! + color[2]! > 0.3) return // body, not a pip
      for (const [value, face] of Object.entries(DIE_FACES)) {
        const along = dot(position as Vec3, [...face.normal])
        if (along < 0.6) continue
        // Snap each pip vertex to the 3x3 pip grid on that face.
        const key = position
          .map((coordinate, axis) =>
            face.normal[axis] === 0 ? Math.round(coordinate / 0.27) : "n",
          )
          .join(",")
        const centres = pipCentres.get(Number(value)) ?? new Set<string>()
        centres.add(key)
        pipCentres.set(Number(value), centres)
      }
    })

    for (const value of [1, 2, 3, 4, 5, 6]) {
      expect(pipCentres.get(value)?.size, `pips on face ${value}`).toBe(value)
    }
  })
})
