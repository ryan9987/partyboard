import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, expect, it } from "vitest"

import { createGameApp } from "../../apps/server/src/server"
import { createStaticWebHandler } from "../../apps/server/src/static-web"

let directory: string
let app: ReturnType<typeof createGameApp>
let origin: string
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "partyboard-web-"))
  const web = join(directory, "dist")
  await mkdir(join(web, "assets"), { recursive: true })
  await writeFile(join(web, "index.html"), "<main>Party Board</main>")
  await writeFile(join(web, "assets", "demo.js"), "console.log('demo')")
  await writeFile(join(directory, "private.env"), "PRIVATE=hidden")
  await symlink(join(directory, "private.env"), join(web, "escape.txt"))
  app = createGameApp({
    allowedOrigins: ["https://demo.example"],
    webHandler: await createStaticWebHandler(web),
  })
  await new Promise<void>((done) => app.httpServer.listen(0, "127.0.0.1", done))
  const address = app.httpServer.address()
  if (!address || typeof address === "string") throw Error("No HTTP address")
  origin = `http://127.0.0.1:${address.port}`
})
afterEach(async () => {
  await app.close()
  await rm(directory, { recursive: true, force: true })
})

it("serves the built SPA on host and controller deep links with correct asset MIME types", async () => {
  for (const path of [
    "/",
    "/host",
    "/controller",
    "/controller/ABCD",
    "/controller/abcd?source=qr",
  ]) {
    const response = await fetch(origin + path)
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/html")
    expect(response.headers.get("Cache-Control")).toBe("no-cache")
    expect(await response.text()).toContain("Party Board")
  }
  const asset = await fetch(`${origin}/assets/demo.js`)
  expect(asset.headers.get("Content-Type")).toContain("text/javascript")
  expect(asset.headers.get("Cache-Control")).toContain("immutable")
  expect(await asset.text()).toBe("console.log('demo')")
  const head = await fetch(`${origin}/host`, { method: "HEAD" })
  expect(head.status).toBe(200)
  expect(await head.text()).toBe("")
})

it("keeps unknown routes, missing assets, dotfiles, symlinks, and traversal outside the build inaccessible", async () => {
  for (const path of [
    "/unknown",
    "/assets/missing.js",
    "/.env",
    "/%2eenv",
    "/escape.txt",
    "/%2e%2e%2fprivate.env",
    "/controller/INVALID",
    "/src/main.tsx",
  ]) {
    const response = await fetch(origin + path)
    expect(response.status, path).toBe(404)
    expect(await response.text()).not.toContain("hidden")
  }
  expect((await fetch(`${origin}/%ZZ`)).status).toBe(400)
  expect((await fetch(`${origin}/host`, { method: "POST" })).status).toBe(405)
})

it("serves Socket.IO polling on the same origin without routing it to SPA HTML", async () => {
  const response = await fetch(`${origin}/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: "https://demo.example" },
  })
  expect(response.status).toBe(200)
  expect(await response.text()).toMatch(/^0\{"sid":/)
})
