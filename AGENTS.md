# AGENTS.md

This file provides guidance to all coding agents (Claude Code, Codex, Gemini, Cursor, etc.) working in this repository.

## Instruction precedence & mirrors

- Follow instruction order: system / developer → user → this file → everything else.
- Keep the following files as symlinks (or exact copies) of `AGENTS.md`: `CLAUDE.md`, `GEMINI.md`.

## Quick Start

| Task | Command | Location |
|------|---------|----------|
| Start backend dev server | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | `backend/` |
| Start frontend dev server | `npm run dev` | `frontend/` |
| Run backend tests | `pytest` | `backend/` |
| Generate DB migration | `alembic revision --autogenerate -m "message"` | `backend/` |
| Apply DB migration | `alembic upgrade head` | `backend/` |
| Run code quality checks | `pre-commit run -a` | repo root |
| Start all services (Docker dev) | `./dev_in_docker.sh` | `docker/` |
| Build production images | `./build_prod.sh` | `docker/` |
| Build + push production images | `./build_prod_images.sh` | `docker/` |
| Start production stack | `docker compose -f docker-compose.prod.yml up -d` | `docker/` |

## MUST DO Before Any Commit

1. Run pre-commit hooks: `pre-commit run -a`.
2. If DB schema changed, generate a migration and commit it.
3. Run relevant tests (backend `pytest`, frontend `npm run lint`).
4. Use Conventional Commits for commit messages (enforced by commit-msg hook).

## Database Migration Rules

- Never edit applied migrations. Create a new migration for changes.
- Keep migrations small and focused on a single change.

## Project Layout

- `backend/`: Python backend (FastAPI + SQLAlchemy + Alembic)
- `frontend/`: Next.js frontend
- `docker/`: Docker dev/prod orchestration (see Docker section below)
- `docs/`: Architecture and operational docs
- `scripts/`: Maintenance and sync scripts

## Docker Directory

The `docker/` directory contains all Docker-related configuration for both development and production environments.

### File Structure

```
docker/
├── .env.example              # Environment variables template
├── docker-compose.yml        # Base compose configuration
├── docker-compose.dev.yml    # Development environment
├── docker-compose.prod.yml   # Production environment
├── dev_in_docker.sh          # Quick start dev environment
├── build_prod.sh             # Build production images locally
├── build_prod_images.sh      # Build & push multi-platform images
├── Dockerfile.backend.dev    # Backend development image
├── Dockerfile.backend.prod   # Backend production image
├── Dockerfile.frontend.dev   # Frontend development image
├── Dockerfile.frontend.prod  # Frontend production image
├── backend-entrypoint.sh     # Backend container startup script
├── nginx.conf                # Nginx config for production
├── nginx.dev.conf            # Nginx config for development
├── mysql_data/               # MySQL data persistence
└── redis_data/               # Redis data persistence
```

### Development Environment

Start all services in development mode with hot-reload:

```bash
cd docker/
./dev_in_docker.sh
# Or manually:
docker compose -f docker-compose.dev.yml up -d --build
```

Services:
- Backend: http://localhost:8000 (auto-reload on code changes)
- Frontend: http://localhost:3000 (auto-reload on code changes)
- MySQL: localhost:3306
- Redis: localhost:6379

### Production Environment

Build and run production images:

```bash
cd docker/

# Build images locally
./build_prod.sh

# Start production stack
docker compose -f docker-compose.prod.yml up -d

# Or build and push to registry (multi-platform)
REGISTRY=your-registry IMAGE_TAG=v1.0.0 ./build_prod_images.sh
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

**Required:**
- `GITHUB_TOKEN`: GitHub API token for fetching repositories
- `DATABASE_URL`: MySQL connection string
- `REDIS_URL`: Redis connection string

**Optional:**
- `ENABLE_SCHEDULER`: Enable background sync scheduler (default: true)
- `ENABLE_ENRICHMENT`: Enable AI-powered content enrichment (default: false)
- `ENABLE_TRANSLATION`: Enable auto-translation (default: false)
- `DEEPSEEK_API_KEY`: API key for DeepSeek (if enrichment/translation enabled)
- `SYNC_INTERVAL_MINUTES`: How often to sync from GitHub (default: 60)
- `NEXT_PUBLIC_SITE_ORIGIN`: Public URL of the site

See `.env.example` for all 33+ configuration options.

### Multi-platform Builds

The `build_prod_images.sh` script supports building for multiple architectures:

```bash
# Build for both amd64 and arm64
BUILD_PLATFORMS="linux/amd64,linux/arm64" ./build_prod_images.sh

# Build for single platform
BUILD_PLATFORMS="linux/amd64" ./build_prod_images.sh

# Customize registry and tag
REGISTRY="ghcr.io/yourname" IMAGE_TAG="v1.0.0" ./build_prod_images.sh
```

### Data Persistence

- `mysql_data/`: MySQL database files (auto-created)
- `redis_data/`: Redis persistence files (auto-created)

These directories are gitignored and mounted as volumes for data persistence.
