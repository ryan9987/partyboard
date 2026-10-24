# Deployment and demo preflight

This phase is complete only after the web client and authoritative server are reachable from the
presentation laptop and all controller phones over HTTPS. Do not put private tokens or secrets in
Vite environment variables; every `VITE_*` value is compiled into public browser code.

## Production configuration

Set these values before building the web app:

```env
VITE_CONTROLLER_URL=https://party.example/controller
VITE_SOCKET_URL=https://game.party.example
```

- `VITE_CONTROLLER_URL` is the public controller base URL. The host appends the four-character room
  code when it creates the QR code.
- `VITE_SOCKET_URL` is the browser-reachable Socket.IO server. Use an HTTPS/WSS-capable endpoint in
  production.
- The server's `ALLOWED_ORIGINS` must include the exact public web origin.
- The deployment must route `/host`, `/controller`, and `/controller/:roomCode` to `index.html` so a
  direct visit or refresh reaches the React router.

Build the static web client with:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @party-board/web build
```

The deployable output is `apps/web/dist`. The server deployment remains Jack's lane and must be
integrated before the production build is considered playable.

## Built-in preflight

Open `/host?preflight=1` on the presentation laptop. The panel checks:

- Whether the page is running in a secure browser context
- Whether the controller URL is valid and HTTPS-safe
- Whether a live game server is configured and connected
- How many controllers are joined and ready

The same panel is available from the **Preflight** button on `/host`. A yellow fixture warning is
expected during Ryan's offline preview; the final networked demo should have green host, URL,
server, and controller checks.

## Release proof

1. Run `pnpm check` from a clean checkout.
2. Deploy the web client and authoritative server.
3. Open the deployed host with `?preflight=1` and clear every warning that affects live play.
4. Complete `docs/DEMO_CHECKLIST.md` on the intended laptop and network.
5. Test both iPhone/Safari and Android/Chrome motion permission flows, including touch fallback.
6. Record one complete successful demonstration.
7. Only then tag the exact commit used for the recording as the known-good demo version.

Do not create the known-good tag from an untested fixture build.
