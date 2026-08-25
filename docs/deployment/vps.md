# VPS Deployment

## Host requirements

Use a supported Linux VPS with Node.js `22.13.0`, pnpm `11.21.0`, PostgreSQL access, a process supervisor, firewall controls, and sufficient disk space for application logs and database backups. Docker Compose is the preferred repeatable path when Docker is available; a direct Node process is also supported.

## Direct Node deployment

```bash
git clone https://github.com/Goye2026/A3LAM.git
cd A3LAM
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
pnpm start
```

The real environment file must be created outside Git and loaded by the supervisor. The migration command is only for provisioning a new private database. Never run it as part of every boot and never run it against the existing Production database for this phase.

Run the process under systemd, Docker, or another supervisor with automatic restart and a bounded log-retention policy. Bind the application to `127.0.0.1:3000` when Nginx is on the same host. If the process is containerized, use the Compose healthcheck and internal network.

## Firewall and operational controls

Allow only SSH from trusted administrative networks and TCP 80/443 from the public internet. Keep PostgreSQL private. Use a separate operator account, disable password SSH where possible, patch the host, monitor disk usage, and verify backups independently of the live application.

## Nginx

Use the example in `domain.md` or a separate site configuration to proxy HTTPS traffic to the Node process. Forward `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`; set a deliberate request-body limit for profile file uploads; and do not proxy database or secret-management ports.

## Verification

After restart, check `/api/health`, public routes, Admin login with the existing owner-controlled credential, and the application logs. Treat missing PostgreSQL, storage, or email configuration as an explicit configuration state, not as evidence to create data or bypass access controls.
