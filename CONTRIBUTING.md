# Contributing

Thanks for your interest in contributing to **agentskill.work**.

This repository powers `agentskill.work`, a directory of popular **Claude Skill** repositories.

## Code of Conduct

By participating, you agree to follow `CODE_OF_CONDUCT.md`.

## Development Setup

### Prerequisites

- Docker + Docker Compose (recommended)
- Python 3.11+ (backend local dev)
- Node.js 20+ (frontend local dev)

### Run with Docker (recommended)

```bash
cd docker
cp .env.example .env
./dev_in_docker.sh
```

Then open `http://localhost:8083`.

### Run locally (without Docker)

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Quality Gates (must pass)

- Run hooks: `pre-commit run -a`
- Backend tests: `cd backend && pytest`
- Frontend lint: `cd frontend && npm run lint`

## Database migrations

- Never edit migrations that have been applied in production.
- If DB schema changes, always add a new Alembic migration:

```bash
cd backend
alembic revision --autogenerate -m "your message"
alembic upgrade head
```

## GitHub API usage rule (important)

To protect GitHub rate limits and avoid overloading GitHub:

- The **frontend / user-browsing path must never call GitHub APIs**.
- GitHub fetching is only allowed in **scheduled backend Celery tasks**.

## Terminology rule

- Keep the term **"Claude Skill"** as-is in user-facing content and translations.

## Commit messages

This repository enforces **Conventional Commits** via a `commit-msg` hook.

Examples:

- `feat(frontend): add topic pages`
- `fix(backend): handle github rate limit headers`
- `docs: update operations`

## Pull Requests

- Keep changes small and focused.
- Explain the problem and the approach.
- Include screenshots for UI changes.
- Include migrations when DB schema changes.
- Ensure CI and `pre-commit` pass.
