# Architecture

## Overview

AgentSkill Hub consists of:

- **Backend** (FastAPI): syncs GitHub repositories, stores them in MySQL, and exposes search APIs.
- **Frontend** (Next.js): displays the skill list and provides search UX.
- **Infra**: MySQL + Redis + Nginx, orchestrated with Docker Compose.

## Data Flow

1. Scheduler or manual trigger calls GitHub Search API.
2. Backend upserts repositories into the `skills` table.
3. Frontend queries `/api/skills` for list/search.
