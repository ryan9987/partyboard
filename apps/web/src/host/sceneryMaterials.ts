import * as THREE from "three"

// Seeded details keep the world identical on every reload and on every demo laptop.
export function randomSource(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function createSurfaceTexture(kind: "grass" | "bark" | "stone") {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 256
  const context = canvas.getContext("2d")!
  const random = randomSource(kind === "grass" ? 27 : 71)
  context.fillStyle = kind === "grass" ? "#668d3e" : kind === "bark" ? "#735038" : "#cbbf9e"
  context.fillRect(0, 0, 256, 256)
  for (let index = 0; index < 7000; index++) {
    const light = random() > 0.5
    context.fillStyle =
      kind === "grass"
        ? light
          ? "rgba(190,207,109,0.13)"
          : "rgba(36,65,27,0.12)"
        : light
          ? "rgba(255,239,195,0.17)"
          : "rgba(34,25,17,0.2)"
    const x = random() * 256
    const y = random() * 256
    context.fillRect(
      x,
      y,
      kind === "bark" ? 1 + random() * 3 : 1 + random() * 5,
      kind === "bark" ? 8 + random() * 55 : 1 + random() * 4,
    )
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === "grass" ? 9 : 2, kind === "grass" ? 30 : 2)
  texture.anisotropy = 4
  return texture
}

export function createFabricTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 128
  const context = canvas.getContext("2d")!
  context.fillStyle = "#e9e6df"
  context.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 128; i += 4) {
    context.fillStyle = "#d1cfc7"
    context.fillRect(i, 0, 1, 128)
    context.fillStyle = "#f8f5ee"
    context.fillRect(0, i, 128, 1)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
