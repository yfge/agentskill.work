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

## Migrations

```bash
cd backend
alembic upgrade head
```
