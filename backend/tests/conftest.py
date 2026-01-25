# ruff: noqa: E402

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("ENABLE_SCHEDULER", "false")
os.environ.setdefault("SYNC_ON_START", "false")

import pytest
from app.core.database import SessionLocal, engine
from app.db.base import Base
from app.main import create_app
from app.models.skill import Skill
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_database():
    """Keep tests isolated with a predictable database state."""
    db = SessionLocal()
    try:
        db.query(Skill).delete()
        db.commit()
    finally:
        db.close()
