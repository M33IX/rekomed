# Production Checklist RekoMed

## 1. DNS And TLS

- `A` record for `reko-med.ru` points to the production server.
- `A` or `CNAME` record for `www.reko-med.ru` points to the same server.
- Let's Encrypt certificate exists at `/etc/letsencrypt/live/reko-med.ru/`.
- nginx config from `deploy/nginx.conf` is installed and `nginx -t` passes.

## 2. Firewall

Only public ports should be open:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

PostgreSQL must not be reachable from the internet. Check:

```bash
ss -lntp
docker compose ps
```

Expected:

- nginx listens on `0.0.0.0:80` and `0.0.0.0:443`;
- app is bound to `127.0.0.1:3000`;
- PostgreSQL has no published host port.

## 3. Environment

Create `.env` on the server from `.env.example` and replace all placeholders:

- `NEXT_PUBLIC_SITE_URL=https://reko-med.ru`
- `POSTGRES_PASSWORD` with a strong unique password
- `PAYLOAD_SECRET` with a strong unique secret
- `APP_IMAGE=ghcr.io/softaworks/rekomed-app:latest`
- `VK_GROUP_TOKEN` with the real VK community token
- `VK_API_VERSION=5.199`

Do not commit `.env`.

## 4. Docker Compose

Production uses the pushed image and does not require a local Dockerfile:

```bash
docker compose pull app
docker compose up -d
docker compose logs -f app
```

Local/server-side build, if needed:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

## 5. Database And Media

- Restore the PostgreSQL dump before switching traffic.
- Confirm Payload migrations finish successfully in app logs.
- Confirm named volumes exist:
  - `postgres_data`
  - `media_storage`
  - `lead_storage`
- Confirm file uploads work in Payload admin.

## 6. Backups

Run and schedule PostgreSQL backups:

```bash
BACKUP_DIR=/opt/rekomed/backups POSTGRES_CONTAINER=<postgres-container-name> deploy/backup-postgres.sh
```

Add a cron/systemd timer and periodically test restore on a separate environment.

## 7. Smoke Tests After Deploy

```bash
curl -I https://reko-med.ru/
curl https://reko-med.ru/api/health
curl https://reko-med.ru/robots.txt
curl https://reko-med.ru/sitemap.xml
```

Manual checks:

- `/admin` opens over HTTPS.
- `/catalog/` shows categories and products.
- A product page opens by legacy URL.
- Contact form creates a lead in Payload.
- VK delivery works or records delivery error without losing the lead.
- Cookie banner, legal links, JivoChat and Yandex Metrika consent behavior work.
