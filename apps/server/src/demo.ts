import { spawn, type ChildProcess } from "node:child_process"
import { createServer, type Server as HttpServer } from "node:http"
import { dirname, join, resolve } from "node:path"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { setTimeout as delay } from "node:timers/promises"

import { createGameApp } from "./server"
import { createStaticWebHandler } from "./static-web"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const port = Number(process.env.DEMO_PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("DEMO_PORT must be between 1 and 65535")
const binary = process.env.CLOUDFLARED_BIN ?? "cloudflared"
let app: ReturnType<typeof createGameApp> | undefined
let tunnel: ChildProcess | undefined
let build: ChildProcess | undefined
let stopping = false
let reservation: HttpServer | undefined
let directory: string | undefined
async function stop() {
  if (stopping) return
  stopping = true
  build?.kill("SIGTERM")
  tunnel?.kill("SIGTERM")
  await app?.close()
  if (reservation?.listening) await new Promise<void>((done) => reservation!.close(() => done()))
  if (directory) await rm(directory, { recursive: true, force: true })
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void stop()
  })

try {
  directory = await mkdtemp(join(tmpdir(), "partyboard-demo-"))
  // Reserve the port first so the tunnel cannot accidentally expose another local service.
  reservation = createServer((_request, response) =>
    response.writeHead(503, { "Retry-After": "5" }).end("Demo is starting"),
  )
  await new Promise<void>((done, reject) => {
    reservation!.once("error", reject)
    reservation!.listen(port, "127.0.0.1", done)
  })
  // Only the startup placeholder is reachable until the build and game server are ready.
  const origin = await new Promise<string>((done, reject) => {
    const timer = setTimeout(
      () => reject(Error("Timed out waiting for the HTTPS tunnel URL")),
      45_000,
    )
    tunnel = spawn(binary, ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`], {
      stdio: ["ignore", "pipe", "pipe"],
    })
    let output = ""
    const read = (chunk: Buffer) => {
      process.stderr.write(chunk)
      output = (output + chunk.toString()).slice(-16_384)
      const url = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0]
      if (url) {
        clearTimeout(timer)
        done(url)
      }
    }
    tunnel.stdout?.on("data", read)
    tunnel.stderr?.on("data", read)
    tunnel.once("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    tunnel.once("exit", (code) => {
      clearTimeout(timer)
      reject(Error(`HTTPS tunnel exited (${code})`))
      if (!stopping) {
        process.exitCode = 1
        void stop()
      }
    })
  })
  if (stopping) throw Error("Demo startup was cancelled")
  console.log(`Building the demo for ${origin}…`)
  await new Promise<void>((done, reject) => {
    build = spawn(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["--filter", "@party-board/web", "build", "--outDir", directory!],
      {
        cwd: root,
        env: {
          ...process.env,
          VITE_SOCKET_URL: origin,
          VITE_CONTROLLER_URL: `${origin}/controller`,
        },
        stdio: "inherit",
      },
    )
    build.once("error", reject)
    build.once("exit", (code) =>
      code === 0 ? done() : reject(Error(`Web build failed (${code})`)),
    )
  })
  if (stopping) throw Error("Demo startup was cancelled")
  const webHandler = await createStaticWebHandler(directory)
  app = createGameApp({ allowedOrigins: [origin], webHandler })
  await new Promise<void>((done) => reservation!.close(() => done()))
  await new Promise<void>((done, reject) => {
    app!.httpServer.once("error", reject)
    app!.httpServer.listen(port, "127.0.0.1", done)
  })
  const deadline = Date.now() + 120_000
  let reachable = false
  let lastFailure = "No response"
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/host`, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      })
      lastFailure = `HTTP ${response.status}`
      if (response.status === 200) {
        reachable = true
        break
      }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error)
    }
    await delay(1000)
  }
  if (!reachable) throw Error(`The public HTTPS URL did not become reachable: ${lastFailure}`)
  console.log(
    `\nHTTPS demo ready: ${origin}/host\nControllers: ${origin}/controller\nKeep this process and laptop running. Press Ctrl+C to stop.\n`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
  await stop()
}
