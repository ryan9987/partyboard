# App shell

This directory contains:

- Route declarations
- Lazy loading for host and controller roles
- Global error boundary
- Global providers
- Environment configuration validation

`runtimeConfig.ts` validates the public controller and Socket.IO endpoints, falls back safely for
fixture mode, and reports HTTPS/secure-context issues to the host preflight panel.

It must not contain game rules or motion-recognition logic.
