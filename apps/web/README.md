# Web application

Planned React/Vite application for both browser roles.

## Routes

- `/host`: laptop lobby and 3D board
- `/controller/:roomCode`: phone join and roll interface

The host route is dynamically imported so controller devices do not download the Three.js bundle. The `/controller/:roomCode` route currently displays a clear placeholder until Jack's controller branch is integrated.

Run the application from the repository root with `pnpm dev` and open `/host`.

## Ownership

- `src/host`: host/board owner
- `src/controller`: server/controller owner
- `src/app` and `src/networking`: designated shared-file owner
