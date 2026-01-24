#!/usr/bin/env sh
set -e

cd /app/backend

python - <<'PY'
import os
import time

from sqlalchemy import create_engine, text

url = os.environ.get("DATABASE_URL")
if not url:
    raise SystemExit("DATABASE_URL is not set")

for attempt in range(1, 31):
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        break
    except Exception as exc:  # noqa: BLE001
        print(f"waiting for database ({attempt}/30): {exc}")
        time.sleep(2)
else:
    raise SystemExit("database not ready after 60s")
PY

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 ${UVICORN_ARGS:-}
