# Architecture

## Overview

agentskill.work is a structured AI Agent Skill registry. It starts from GitHub
repository discovery, then turns each repository into a comparable skill entity
with platform, type, install, README, and verification metadata.

agentskill.work consists of:

- **Backend** (FastAPI): syncs GitHub repositories, stores them in MySQL, and exposes search APIs.
- **Frontend** (Next.js): displays the skill list and provides search UX.
- **Infra**: MySQL + Redis + Nginx, orchestrated with Docker Compose.

## Data Flow

1. Scheduler or manual trigger calls GitHub Search API.
2. Backend upserts repositories into the `skills` table.
3. A scheduled inspection task calls GitHub repository content APIs for README
   and root manifest files, then stores registry fields such as `skill_type`,
   `platforms`, `capabilities`, `install_methods`, `source_files`,
   `quality_score`, and `verification_status`.
4. Frontend queries `/api/skills` for list/search/detail pages.

End-user browsing must never call GitHub directly. GitHub API usage stays in
Celery background jobs so public traffic only hits the local API/database.
