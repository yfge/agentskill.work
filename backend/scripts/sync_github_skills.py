import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.github_service import sync_github_skills


def main() -> None:
    settings = get_settings()
    with SessionLocal() as db:
        count = sync_github_skills(db, settings)
    print(f"synced {count} repos")


if __name__ == "__main__":
    main()
