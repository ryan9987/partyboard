export type MotionPermissionStatus = "enabled" | "denied" | "unavailable"
export type MotionEnvironment = {
  isSecureContext: boolean
  DeviceMotionEvent?: { requestPermission?: () => Promise<string> }
}

/** Invoke directly from a touch/click handler, before any other asynchronous work. */
export async function requestMotionPermission(
  environment: MotionEnvironment | undefined = typeof window === "undefined"
    ? undefined
    : {
        isSecureContext: window.isSecureContext,
        // Safari exposes a permission method absent from standard DOM typings.
        ...(typeof DeviceMotionEvent === "undefined"
          ? {}
          : {
              DeviceMotionEvent: DeviceMotionEvent as typeof DeviceMotionEvent &
                NonNullable<MotionEnvironment["DeviceMotionEvent"]>,
            }),
      },
): Promise<MotionPermissionStatus> {
  if (!environment?.isSecureContext || !environment.DeviceMotionEvent) return "unavailable"
  const motion = environment.DeviceMotionEvent
  if (!motion.requestPermission) return "enabled"
  try {
    return (await motion.requestPermission()) === "granted" ? "enabled" : "denied"
  } catch {
    return "denied"
  }
}
