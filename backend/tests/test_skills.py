from datetime import UTC, datetime

from app.core.database import SessionLocal
from app.models.skill import Skill


def seed_skills():
    with SessionLocal() as db:
        db.add_all(
            [
                Skill(
                    repo_id=1,
                    name="bar",
                    full_name="foo/bar",
                    description="A CLI tool",
                    html_url="https://github.com/foo/bar",
                    stars=10,
                    forks=1,
                    language="Python",
                    topics="cli,tools",
                    last_pushed_at=datetime(2026, 1, 1, tzinfo=UTC),
                ),
                Skill(
                    repo_id=2,
                    name="qux",
                    full_name="baz/qux",
                    description="Another project",
                    html_url="https://github.com/baz/qux",
                    stars=5,
                    forks=2,
                    language="Go",
                    topics="web,cli",
                    last_pushed_at=datetime(2026, 1, 2, tzinfo=UTC),
                ),
            ]
        )
        db.commit()


def test_skills_empty(client):
    response = client.get("/api/skills")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_skills_filters(client):
    seed_skills()

    response = client.get("/api/skills?topic=cli&limit=100&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert {item["full_name"] for item in data["items"]} == {"foo/bar", "baz/qux"}

    response = client.get("/api/skills?topic=tools&limit=100&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["full_name"] == "foo/bar"

    response = client.get("/api/skills?owner=foo&limit=100&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["full_name"] == "foo/bar"

    response = client.get("/api/skills?language=python&limit=100&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["full_name"] == "foo/bar"

    response = client.get("/api/skills?q=tools&limit=100&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["full_name"] == "foo/bar"
