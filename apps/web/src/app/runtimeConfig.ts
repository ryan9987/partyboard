export type RuntimeIssueSeverity = "warning" | "error"

export type RuntimeIssue = {
  code:
    | "INVALID_CONTROLLER_URL"
    | "INVALID_SOCKET_URL"
    | "INSECURE_CONTROLLER"
    | "INSECURE_SOCKET"
    | "INSECURE_HOST"
  message: string
  severity: RuntimeIssueSeverity
}

export type RuntimeConfig = {
  controllerBaseUrl: string
  issues: RuntimeIssue[]
  secureContext: boolean
  socketUrl: string | null
}

type RuntimeConfigInput = {
  controllerBaseUrl?: string | undefined
  isSecureContext: boolean
  origin: string
  socketUrl?: string | undefined
}

function isLoopback(url: URL): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
}

function parseUrl(value: string, allowedProtocols: string[]): URL | null {
  try {
    const url = new URL(value)
    return allowedProtocols.includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

export function createRuntimeConfig({
  controllerBaseUrl,
  isSecureContext,
  origin,
  socketUrl,
}: RuntimeConfigInput): RuntimeConfig {
  const issues: RuntimeIssue[] = []
  const fallbackControllerUrl = `${trimTrailingSlash(origin)}/controller`
  const requestedControllerUrl = controllerBaseUrl?.trim() || fallbackControllerUrl
  const parsedControllerUrl = parseUrl(requestedControllerUrl, ["http:", "https:"])

  if (!parsedControllerUrl) {
    issues.push({
      code: "INVALID_CONTROLLER_URL",
      message: "VITE_CONTROLLER_URL must be an absolute HTTP or HTTPS URL.",
      severity: "error",
    })
  }

  const effectiveControllerUrl = parsedControllerUrl?.toString() ?? fallbackControllerUrl
  if (
    parsedControllerUrl &&
    parsedControllerUrl.protocol !== "https:" &&
    !isLoopback(parsedControllerUrl)
  ) {
    issues.push({
      code: "INSECURE_CONTROLLER",
      message: "The public controller URL must use HTTPS for reliable phone motion access.",
      severity: "warning",
    })
  }

  const requestedSocketUrl = socketUrl?.trim()
  const parsedSocketUrl = requestedSocketUrl
    ? parseUrl(requestedSocketUrl, ["http:", "https:", "ws:", "wss:"])
    : null

  if (requestedSocketUrl && !parsedSocketUrl) {
    issues.push({
      code: "INVALID_SOCKET_URL",
      message: "VITE_SOCKET_URL must be an absolute HTTP, HTTPS, WS, or WSS URL.",
      severity: "error",
    })
  }

  if (
    parsedSocketUrl &&
    !["https:", "wss:"].includes(parsedSocketUrl.protocol) &&
    !isLoopback(parsedSocketUrl)
  ) {
    issues.push({
      code: "INSECURE_SOCKET",
      message: "The public game server must use HTTPS or WSS for the deployed demo.",
      severity: "warning",
    })
  }

  if (!isSecureContext) {
    issues.push({
      code: "INSECURE_HOST",
      message: "This page is not a secure context; deploy over HTTPS before testing phone motion.",
      severity: "warning",
    })
  }

  return {
    controllerBaseUrl: trimTrailingSlash(effectiveControllerUrl),
    issues,
    secureContext: isSecureContext,
    socketUrl: parsedSocketUrl ? trimTrailingSlash(parsedSocketUrl.toString()) : null,
  }
}

export function buildControllerUrl(controllerBaseUrl: string, roomCode: string): string {
  return `${trimTrailingSlash(controllerBaseUrl)}/${encodeURIComponent(roomCode)}`
}
