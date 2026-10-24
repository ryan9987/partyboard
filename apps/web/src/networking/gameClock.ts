import { useCallback, useEffect, useRef, useState } from "react"
import { readGameClock } from "./clockMath"

/** Anchor to server snapshots, then advance monotonically. Device wall-clock skew is irrelevant. */
export function useGameClock(serverTime: number | undefined): () => number {
  const anchor = useRef({ server: 0, local: 0 })
  useEffect(() => {
    anchor.current = { server: serverTime ?? Date.now(), local: performance.now() }
  }, [serverTime])
  return useCallback(() => readGameClock(anchor.current, performance.now()), [])
}

export function useGameNow(serverTime: number | undefined, interval = 50): number {
  const clock = useGameClock(serverTime)
  const [now, setNow] = useState(() => serverTime ?? Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(clock()), interval)
    return () => window.clearInterval(timer)
  }, [clock, interval])
  return now
}
