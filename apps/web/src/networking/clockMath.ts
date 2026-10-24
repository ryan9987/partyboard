export function readGameClock(anchor: { server: number; local: number }, localNow: number): number {
  return anchor.server + Math.max(0, localNow - anchor.local)
}
