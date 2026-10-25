export type ShakeDetectorOptions = {
  onShake(): void
  threshold?: number
  requiredPeaks?: number
  windowMs?: number
  cooldownMs?: number
}

export type ShakeDetector = { start(): void; stop(): void }
/** Two deliberate low-force peaks; a single table bump must never roll. */
export const ROLL_SHAKE_SETTINGS = { threshold: 11, requiredPeaks: 2, windowMs: 1000 } as const
export type Acceleration = { x: number | null; y: number | null; z: number | null }

function magnitude(sample: Acceleration | null): number | null {
  if (!sample) return null
  const { x, y, z } = sample
  if (
    x === null ||
    y === null ||
    z === null ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z)
  )
    return null
  return Math.hypot(x, y, z)
}

/** Pure recognition logic; each peak requires a return below the threshold. */
export class ShakeRecognizer {
  private readonly threshold: number
  private readonly requiredPeaks: number
  private readonly windowMs: number
  private readonly cooldownMs: number
  private peaks: number[] = []
  private aboveThreshold = false
  private lastShake = -Infinity
  private lastSample = -Infinity

  private readonly options: ShakeDetectorOptions

  constructor(options: ShakeDetectorOptions) {
    this.options = options
    this.threshold = options.threshold ?? 14
    this.requiredPeaks = options.requiredPeaks ?? 3
    this.windowMs = options.windowMs ?? 650
    this.cooldownMs = options.cooldownMs ?? 1500
    if (
      !Number.isFinite(this.threshold) ||
      this.threshold <= 0 ||
      !Number.isInteger(this.requiredPeaks) ||
      this.requiredPeaks <= 0 ||
      !Number.isFinite(this.windowMs) ||
      this.windowMs <= 0 ||
      !Number.isFinite(this.cooldownMs) ||
      this.cooldownMs < 0
    ) {
      throw new RangeError("Invalid shake detector options")
    }
  }

  reset(): void {
    this.peaks = []
    this.aboveThreshold = false
    this.lastShake = -Infinity
    this.lastSample = -Infinity
  }

  sample(acceleration: Acceleration | null, timeMs: number): void {
    const strength = magnitude(acceleration)
    if (strength === null || !Number.isFinite(timeMs) || timeMs < this.lastSample) return
    this.lastSample = timeMs
    const rising = strength >= this.threshold && !this.aboveThreshold
    this.aboveThreshold = strength >= this.threshold
    this.peaks = this.peaks.filter((time) => timeMs - time <= this.windowMs)
    if (!rising || timeMs - this.lastShake < this.cooldownMs) return
    this.peaks.push(timeMs)
    if (this.peaks.length < this.requiredPeaks) return
    this.peaks = []
    this.lastShake = timeMs
    this.options.onShake()
  }
}

export type MotionSource = Pick<Window, "addEventListener" | "removeEventListener">

/** Permission must be granted by the caller before starting. Safe to stop inside onShake. */
export function createShakeDetector(
  options: ShakeDetectorOptions,
  source: MotionSource | undefined = typeof window === "undefined" ? undefined : window,
  now: () => number = () => performance.now(),
): ShakeDetector {
  const recognizer = new ShakeRecognizer(options)
  let running = false
  let previousGravity: Acceleration | null = null
  const listener = (event: DeviceMotionEvent): void => {
    if (!running) return
    if (magnitude(event.acceleration) !== null) {
      recognizer.sample(event.acceleration, now())
      previousGravity = null
      return
    }
    // Browsers without gravity-free acceleration: detect changes between readings.
    const current = event.accelerationIncludingGravity
    if (magnitude(current) === null || !current) return
    if (previousGravity) {
      recognizer.sample(
        {
          x: current.x! - previousGravity.x!,
          y: current.y! - previousGravity.y!,
          z: current.z! - previousGravity.z!,
        },
        now(),
      )
    }
    previousGravity = current
  }
  return {
    start() {
      if (running || !source) return
      recognizer.reset()
      previousGravity = null
      running = true
      source.addEventListener("devicemotion", listener)
    },
    stop() {
      if (!running || !source) return
      running = false
      source.removeEventListener("devicemotion", listener)
      recognizer.reset()
      previousGravity = null
    },
  }
}
