from app.core.config import Settings
from app.models.skill import Skill
from app.services.repository_inspection_service import inspect_skill_repository


class FakeResponse:
    def __init__(self, status_code=200, text="", json_data=None):
        self.status_code = status_code
        self.text = text
        self._json_data = json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise AssertionError(f"unexpected status {self.status_code}")

    def json(self):
        return self._json_data


class FakeClient:
    def __init__(self, readme, root_files):
        self.readme = readme
        self.root_files = root_files

    def get(self, url, headers):  # noqa: ARG002
        if url.endswith("/readme"):
            return FakeResponse(text=self.readme)
        if url.endswith("/contents"):
            return FakeResponse(
                json_data=[{"name": name} for name in self.root_files],
            )
        raise AssertionError(f"unexpected url {url}")


def test_inspect_skill_repository_extracts_registry_metadata():
    skill = Skill(
        repo_id=1,
        name="servers",
        full_name="modelcontextprotocol/servers",
        description="MCP servers for browser and filesystem automation",
        html_url="https://github.com/modelcontextprotocol/servers",
        stars=10,
        forks=1,
        language="TypeScript",
        topics="mcp,browser",
        topics_json=["mcp", "browser"],
    )
    readme = """
    # MCP Servers

    Browser automation and filesystem tools for Model Context Protocol.

    ```bash
    npm install @modelcontextprotocol/server-browser
    ```

    Requires API_TOKEN and SERVICE_URL for optional integrations.
    """
    result = inspect_skill_repository(
        skill,
        Settings(),
        client=FakeClient(readme, ["README.md", "mcp.json", "package.json", "tests"]),
    )

    assert result is not None
    assert result.skill_type == "mcp_server"
    assert "MCP" in result.platforms
    assert "browser" in result.capabilities
    assert result.install_methods == [
        "npm install @modelcontextprotocol/server-browser"
    ]
    assert result.config_keys == ["API_TOKEN", "SERVICE_URL", "PACKAGE_JSON"]
    assert result.source_files == ["README.md", "mcp.json", "package.json", "tests"]
    assert result.quality_score >= 60
    assert result.verification_status == "readme_parsed"


def test_inspect_skill_repository_detects_hermes_agent_plugins():
    skill = Skill(
        repo_id=2,
        name="hermes-tweet",
        full_name="Xquik-dev/hermes-tweet",
        description="Hermes Agent plugin for X/Twitter exploration and guarded actions",
        html_url="https://github.com/Xquik-dev/hermes-tweet",
        stars=10,
        forks=1,
        language="Python",
        topics="hermes-agent,twitter,social",
        topics_json=["hermes-agent", "twitter", "social"],
    )
    readme = """
    # Hermes Tweet

    Hermes Agent plugin for X/Twitter exploration, timeline reading, and
    action-gated posting workflows.

    Configure XQUIK_API_KEY for read tools. Set HERMES_TWEET_ENABLE_ACTIONS=true
    only when action tools should be available.
    """
    result = inspect_skill_repository(
        skill,
        Settings(),
        client=FakeClient(readme, ["README.md", ".claude-plugin", "pyproject.toml"]),
    )

    assert result is not None
    assert result.skill_type == "hermes_agent_plugin"
    assert "Hermes Agent" in result.platforms
    assert "social" in result.capabilities
    assert "XQUIK_API_KEY" in result.config_keys
    assert "HERMES_TWEET_ENABLE_ACTIONS" in result.config_keys
    assert result.verification_status == "readme_parsed"
