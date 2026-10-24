import { useCallback, useRef, useState } from "react"
import { createTrailMotion, type TrailMotion } from "./trailMotion"

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function usePieceAnimation() {
  const runIdRef = useRef(0)
  const [motion, setMotion] = useState<TrailMotion | null>(null)

  const cancel = useCallback(() => {
    runIdRef.current += 1
    setMotion(null)
  }, [])

  const animatePath = useCallback(
    async (
      path: string[],
      millisecondsPerTile: number,
      onStep: (tileId: string) => void,
      context?: { playerId: string; turnNumber: number; fromTileId: string },
    ): Promise<boolean> => {
      const runId = runIdRef.current + 1
      runIdRef.current = runId
      const startsAt = performance.now()
      setMotion(
        context ? createTrailMotion({ ...context, path, millisecondsPerTile }, startsAt) : null,
      )

      for (const [index, tileId] of path.entries()) {
        // Absolute deadlines avoid accumulating drift if a frame or timeout is delayed.
        await wait(Math.max(0, startsAt + (index + 1) * millisecondsPerTile - performance.now()))
        if (runIdRef.current !== runId) {
          return false
        }
        onStep(tileId)
      }

      setMotion(null)
      return true
    },
    [],
  )

  return { animatePath, cancel, motion }
}
