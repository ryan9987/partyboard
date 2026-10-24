import { useCallback, useRef } from "react"

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function usePieceAnimation() {
  const runIdRef = useRef(0)

  const cancel = useCallback(() => {
    runIdRef.current += 1
  }, [])

  const animatePath = useCallback(
    async (
      path: string[],
      millisecondsPerTile: number,
      onStep: (tileId: string) => void,
    ): Promise<boolean> => {
      const runId = runIdRef.current + 1
      runIdRef.current = runId

      for (const tileId of path) {
        await wait(millisecondsPerTile)
        if (runIdRef.current !== runId) {
          return false
        }
        onStep(tileId)
      }

      return true
    },
    [],
  )

  return { animatePath, cancel }
}
