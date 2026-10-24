# Web application

Planned React/Vite application for both browser roles.

## Routes

- `/host`: laptop lobby and 3D board
- `/controller/:roomCode`: phone join and roll interface

The host route must be dynamically imported so controller devices do not download the Three.js bundle. Package manifests and dependencies will be added during the joint foundation task after the protocol review.

## Ownership

- `src/host`: host/board owner
- `src/controller`: server/controller owner
- `src/app` and `src/networking`: designated shared-file owner
