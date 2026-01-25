# agentskill.work

[English](README.md) | [简体中文](README.zh-CN.md)

agentskill.work is a curated, searchable index of trending **Claude Skill** GitHub repositories.

> Term policy: keep the proper term **"Claude Skill"** as-is. Do NOT translate it.

## Features

- Scheduled sync of trending Claude Skill repos (GitHub metadata stored locally)
- Search + paging (never calls GitHub from the user-facing request path)
- SEO/GEO: sitemaps, structured data (JSON-LD), dynamic Open Graph images, `llms.txt`
- Bilingual UI: `/zh` and `/en`
- Offline content enrichment (DeepSeek) via Celery (summary / key features / use cases / SEO title & description)

## Tech Stack

- Backend: FastAPI + SQLAlchemy + Alembic + Celery
- Frontend: Next.js (App Router) + TypeScript
- Infra: Docker + Nginx + MySQL + Redis

## Repository Layout

- `backend/`: API server + background workers
- `frontend/`: Next.js web app (SEO pages)
- `docker/`: dev/prod compose + nginx entry
- `docs/`: operational docs

## Quick Start (Docker, dev)

```bash
cd docker
cp .env.example .env
./dev_in_docker.sh
```

Open:

- Web (Nginx entry): `http://localhost:8083`
- API (via Nginx): `http://localhost:8083/api`

## Local Development (no Docker)

Backend:

```bash
cd backend
cp .env.example .env

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install

# point to the backend directly
export NEXT_PUBLIC_API_URL=http://localhost:8000/api

npm run dev
```

## Data Sync / Background Jobs

- Scheduled sync: Celery beat + worker (see `backend/app/core/celery_app.py`)
- Manual sync API: `POST /api/skills/sync` (disabled by default; protected by token if enabled)
- Translation / enrichment: offline tasks only (never run in the user-facing request path)

Operations doc: `docs/operations.md`

## Public API

Base URL:
- `/api` (via Nginx)

OpenAPI:
- `/api/openapi.json`
- `/api/docs`

Read endpoints (no auth):
- `GET /api/skills?q=&limit=&offset=&topic=&language=&owner=`
- `GET /api/skills/{owner}/{repo}`
- `GET /api/facets/topics`
- `GET /api/facets/languages`
- `GET /api/facets/owners`

## Contributing

See `CONTRIBUTING.md`. This repo enforces:

- `pre-commit run -a` before commits
- Conventional Commits (commit-msg hook)
- DB migrations via Alembic for schema changes

## License

MIT. See `LICENSE`.
