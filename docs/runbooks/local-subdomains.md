# Local Subdomain Development

Run the platform, portal, and marketplace apps locally via HTTPS subdomains.

## Prerequisites

1. Install Caddy: https://caddyserver.com/docs/install
2. Add hosts file entries (see below)
3. Run `npm install` at the repo root

## Hosts File (Windows)

Open `C:\Windows\System32\drivers\etc\hosts` as Administrator and add:

```
127.0.0.1 app.breederhq.test
127.0.0.1 portal.breederhq.test
127.0.0.1 marketplace.breederhq.test
```

## Run

```bash
npm run dev:all
```

This starts all three dev servers and Caddy reverse proxy concurrently.

## URLs

- https://app.breederhq.test - Platform (main app)
- https://portal.breederhq.test - Portal
- https://marketplace.breederhq.test - Marketplace

## Direct Localhost Access

Each app is also reachable directly without the proxy:

- http://localhost:6170 - Platform
- http://localhost:6171 - Portal
- http://localhost:6172 - Marketplace

## Stop

Press `Ctrl+C` in the terminal running `dev:all`.

## Notes

- First run: Caddy generates a local CA certificate. Accept any browser security prompts.
- The `.test` TLD is reserved for local development and will not conflict with production.
- Port assignments are fixed via Vite `strictPort` to ensure predictable routing.
