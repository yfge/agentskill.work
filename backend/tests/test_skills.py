
def test_skills_empty(client):
    response = client.get("/api/skills")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
