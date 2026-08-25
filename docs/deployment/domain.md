# Custom Domain and HTTPS

This document prepares a future custom domain without assuming that `a3lam.example` or any other domain is owned or available. No DNS record or domain cutover is performed by Phase 17.7.

## Canonical policy

Choose one canonical HTTPS origin, set it as `NEXT_PUBLIC_SITE_URL`, and keep canonical links, sitemap, Open Graph, JSON-LD, and redirects consistent. Decide whether `www` redirects to the apex domain or the apex redirects to `www` before publishing DNS. Do not publish both as independent canonical origins.

## DNS patterns

| Record | Use |
|---|---|
| `A` | IPv4 address of the VPS/reverse proxy when the provider requires it |
| `AAAA` | IPv6 address when the host and firewall support it |
| `CNAME` | Hostname supplied by a managed deployment or for `www` where allowed |
| `TXT` | Domain ownership or email/provider verification when separately required |

Use the exact values supplied by the chosen hosting or DNS provider. Do not invent IP addresses in production configuration. Lower TTL temporarily before a planned cutover, then restore an operational TTL after validation.

## Nginx outline

Terminate TLS at the reverse proxy, redirect HTTP to HTTPS, and proxy to the local application:

```nginx
server {
    listen 80;
    server_name a3lam.example www.a3lam.example;
    return 301 https://a3lam.example$request_uri;
}

server {
    listen 443 ssl http2;
    server_name a3lam.example;

    # ssl_certificate and ssl_certificate_key are supplied outside Git.
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Replace the example domain and certificate paths only on the target host. Keep certificate private keys outside the repository. Enable automatic certificate renewal and test renewal before relying on it.

## Cutover checklist

Confirm DNS resolution, TLS certificate coverage, HTTP-to-HTTPS redirect, chosen `www` policy, `NEXT_PUBLIC_SITE_URL`, canonical metadata, robots, sitemap, health endpoint, Admin login, and rollback DNS/provider procedure. A custom-domain cutover remains `DEFERRED` until an owner supplies and controls a real domain.
