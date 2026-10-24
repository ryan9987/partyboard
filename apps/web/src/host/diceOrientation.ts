import * as THREE from "three"

type Vec3 = readonly [number, number, number]

// Outward normal and on-face "up" for each value, in three.js axes. These must match
// DIE_FACES in apps/web/scripts/blender/build-world.py; tests/dice-orientation.test.ts
// checks the exported model against this table.
export const DIE_FACES: Record<number, { normal: Vec3; up: Vec3 }> = {
  1: { normal: [0, 0, 1], up: [0, 1, 0] },
  2: { normal: [0, 1, 0], up: [0, 0, -1] },
  3: { normal: [1, 0, 0], up: [0, 1, 0] },
  4: { normal: [-1, 0, 0], up: [0, 1, 0] },
  5: { normal: [0, -1, 0], up: [0, 0, 1] },
  6: { normal: [0, 0, -1], up: [0, 1, 0] },
}

const normal = new THREE.Vector3()
const up = new THREE.Vector3()
const view = new THREE.Vector3()
const screenUp = new THREE.Vector3()
const twist = new THREE.Quaternion()

/**
 * The die rotation that shows `value` square to the viewer: the face points along
 * `toCamera` and its pips sit upright relative to `cameraUp`. Returns null for values
 * outside 1–6.
 */
export function faceCameraQuaternion(
  value: number,
  toCamera: Vec3,
  cameraUp: Vec3,
  target = new THREE.Quaternion(),
): THREE.Quaternion | null {
  const face = DIE_FACES[value]
  if (!face) return null
  normal.set(...face.normal)
  view.set(...toCamera).normalize()
  target.setFromUnitVectors(normal, view)

  up.set(...face.up)
    .applyQuaternion(target)
    .projectOnPlane(view)
  screenUp.set(...cameraUp).projectOnPlane(view)
  if (up.lengthSq() < 1e-8 || screenUp.lengthSq() < 1e-8) return target
  twist.setFromUnitVectors(up.normalize(), screenUp.normalize())
  return target.premultiply(twist)
}
