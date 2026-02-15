# MCP Server

agentskill.work exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server, allowing AI agents (Claude Desktop, Cursor, etc.) to search and discover Claude Skill repositories directly.

## Available Tools

| Tool | Description |
|------|-------------|
| `search_claude_skills` | Full-text search with filters (topic, language, owner, sort) |
| `get_skill_detail` | Get detailed info for a specific `owner/repo` |
| `list_topics` | Most popular topics across all skills |
| `list_languages` | Most common programming languages |
| `list_owners` | Most prolific skill authors/orgs |

## Resource

| URI | Description |
|-----|-------------|
| `skills://stats` | Overall index stats (total, top languages, top topics) |

## Running

### Standalone (stdio transport, for Claude Desktop / Cursor)

```bash
cd backend
DATABASE_URL=sqlite:///skills.db python -m app.mcp_server
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentskill": {
      "command": "python",
      "args": ["-m", "app.mcp_server"],
      "cwd": "/path/to/agentskill.work/backend",
      "env": {
        "DATABASE_URL": "mysql+pymysql://user:pass@localhost:3306/agentskill"
      }
    }
  }
}
```

### Cursor Configuration

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "agentskill": {
      "command": "python",
      "args": ["-m", "app.mcp_server"],
      "cwd": "/path/to/agentskill.work/backend",
      "env": {
        "DATABASE_URL": "sqlite:///skills.db"
      }
    }
  }
}
```

## Environment Variables

The MCP server reuses the same `DATABASE_URL` / `REDIS_URL` as the main backend. See `.env.example`.
