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
- `docker/`: Docker dev/prod orchestration
- `docs/`: Architecture and operational docs
- `scripts/`: Maintenance and sync scripts
