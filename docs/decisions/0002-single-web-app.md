# Decision 0002: one web application with role-based routes

## Status

Accepted for the core milestone.

## Decision

Use one React/Vite application with `/host` and `/controller/:roomCode` routes. Dynamically import the host route so phones do not load the 3D scene bundle.

## Why

One application reduces deployment and configuration work while the route and directory boundary still allows separate ownership.

## Consequences

- Shared package-manifest changes require coordination.
- Host-only dependencies and components must not be imported by the controller entry path.
- Both roles use the same networking adapter and protocol package.
