import { describe, expect, it } from "vitest"

import { buildControllerUrl, createRuntimeConfig } from "../apps/web/src/app/runtimeConfig"

describe("runtime demo configuration", () => {
  it("uses the current origin for a zero-config fixture preview", () => {
    const config = createRuntimeConfig({
      isSecureContext: true,
      origin: "http://localhost:5173",
    })

    expect(config).toMatchObject({
      controllerBaseUrl: "http://localhost:5173/controller",
      issues: [],
      socketUrl: null,
    })
    expect(buildControllerUrl(config.controllerBaseUrl, "PLAY")).toBe(
      "http://localhost:5173/controller/PLAY",
    )
  })

  it("normalizes production controller and socket URLs", () => {
    const config = createRuntimeConfig({
      controllerBaseUrl: "https://party.example/controller/",
      isSecureContext: true,
      origin: "https://party.example",
      socketUrl: "wss://game.example/",
    })

    expect(config.controllerBaseUrl).toBe("https://party.example/controller")
    expect(config.socketUrl).toBe("wss://game.example")
    expect(config.issues).toEqual([])
  })

  it("falls back safely and reports malformed public URLs", () => {
    const config = createRuntimeConfig({
      controllerBaseUrl: "not a URL",
      isSecureContext: true,
      origin: "https://party.example",
      socketUrl: "file:///tmp/socket",
    })

    expect(config.controllerBaseUrl).toBe("https://party.example/controller")
    expect(config.socketUrl).toBeNull()
    expect(config.issues.map((issue) => issue.code)).toEqual([
      "INVALID_CONTROLLER_URL",
      "INVALID_SOCKET_URL",
    ])
  })

  it("warns when a remote demo is not fully secure", () => {
    const config = createRuntimeConfig({
      controllerBaseUrl: "http://party.example/controller",
      isSecureContext: false,
      origin: "http://party.example",
      socketUrl: "ws://game.example",
    })

    expect(config.issues.map((issue) => issue.code)).toEqual([
      "INSECURE_CONTROLLER",
      "INSECURE_SOCKET",
      "INSECURE_HOST",
    ])
  })
})
