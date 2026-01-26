# Operations

## Environments

- `docker/.env`: Docker runtime configuration
- `backend/.env`: Local backend configuration
- `frontend/.env.local`: Local frontend configuration

## Common Commands

```bash
# Start dev stack
cd docker && ./dev_in_docker.sh

# Start production stack
cd docker && docker compose up -d
```

## Scheduled Sync (Celery)

- Worker: `agentskill-celery-worker`
- Beat: `agentskill-celery-beat`
- Sync task: `tasks.github_sync` (interval from `SYNC_INTERVAL_MINUTES`)
- Enrichment task: `tasks.skill_enrich` (interval from `ENRICH_INTERVAL_MINUTES`, enabled by `ENABLE_ENRICHMENT=true`)
- Immediate sync on beat start (if `SYNC_ON_START=true`)
- GitHub search query: `GITHUB_SEARCH_QUERY` (defaults to `("claude skill" OR "agent skill") in:name,description,topics`)
- Latest discovery (new repos) search window:
  - `GITHUB_NEWEST_WINDOW_DAYS` (default: 7)
  - `GITHUB_NEWEST_MAX_PAGES` (default: 2)
  - `GITHUB_NEWEST_MAX_RESULTS` (default: 100)
- GitHub rate-limit buffer: `GITHUB_RATE_LIMIT_BUFFER` (stop when remaining <= buffer)
- LLM requirement: enrichment needs `DEEPSEEK_API_KEY` (LLM is never called in user-facing request handlers)

```bash
# Run worker locally
celery -A app.core.celery_app.celery_app worker -l info

# Run beat locally
celery -A app.core.celery_app.celery_app beat -l info
```

## Migrations

```bash
cd backend
alembic upgrade head
```

## Public API

- Base URL: `https://www.agentskill.work/api`
- OpenAPI: `/api/openapi.json` and `/api/docs`
- Read endpoints are public (no auth).
- Write endpoint `POST /api/skills/sync` is disabled by default (requires `SYNC_API_ENABLED=true` + `SYNC_API_TOKEN`).

## Webmaster Verification (GSC / Bing)

The frontend reads these variables at runtime (no rebuild required; just update
`docker/.env` and restart the stack):

- `GOOGLE_SITE_VERIFICATION` -> `<meta name="google-site-verification" ...>`
- `BING_SITE_VERIFICATION` -> `<meta name="msvalidate.01" ...>`

## Server Deployment (agentskill.work)

**Host**
- Domain: `agentskill.work` (A record -> `47.77.193.163`)
- Data disk mount: `/data`
- App root: `/data/apps/agentskill.work`
- Docker data-root: `/data/docker`

**Docker (production)**
- Compose file: `/data/apps/agentskill.work/docker/docker-compose.prod.yml`
- Runtime env: `/data/apps/agentskill.work/docker/.env`
- Stack entry: `IMAGE_TAG=<tag> docker compose -f docker-compose.prod.yml up -d --remove-orphans`
- External port: `8083` (container `agentskill-nginx` listens on `8080`)

**Server Nginx (systemd service)**
- Config file: `/etc/nginx/conf.d/agentskill.work.conf`
- Canonical host: `https://www.agentskill.work`
- Redirects `https://agentskill.work/*` -> `https://www.agentskill.work/*` (avoid duplicate-content SEO issues)
- Proxies `https://www.agentskill.work/*` -> `http://127.0.0.1:8083`
- ACME webroot: `/var/www/letsencrypt` for `/.well-known/acme-challenge/`
- WeChat verification file: keep `https://agentskill.work/e5e588a3b46a049f7e2354fa3ba02fde.txt` reachable (200) while still redirecting other paths to `www`

Example config (server nginx):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name agentskill.work;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location = /e5e588a3b46a049f7e2354fa3ba02fde.txt {
        default_type text/plain;
        return 200 "c60a38d7ceb897d1071c1ff5c493a7ce42be4595";
    }

    return 308 https://www.agentskill.work$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name www.agentskill.work;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    return 308 https://www.agentskill.work$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name agentskill.work;

    # ssl_certificate / ssl_certificate_key / include ... are managed by certbot

    location = /e5e588a3b46a049f7e2354fa3ba02fde.txt {
        default_type text/plain;
        return 200 "c60a38d7ceb897d1071c1ff5c493a7ce42be4595";
    }

    return 308 https://www.agentskill.work$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.agentskill.work;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
    }
}
```

**TLS (Certbot + Nginx)**
- Install: `dnf -y install certbot python3-certbot-nginx`
- Issue/renew (first time):
  `certbot --nginx -d agentskill.work -d www.agentskill.work --agree-tos -m <email> --redirect -n`
- Cert paths:
  - `/etc/letsencrypt/live/agentskill.work/fullchain.pem`
  - `/etc/letsencrypt/live/agentskill.work/privkey.pem`
- Certbot sets up a scheduled renewal automatically.

**Firewall/Security Group**
- Inbound TCP must allow: `80` and `443` (public)
- `8083` is only required on the host for local proxying by server nginx.
