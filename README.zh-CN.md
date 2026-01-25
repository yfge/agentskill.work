# AgentSkill Hub（agentskill.work）

[English](README.md) | [简体中文](README.zh-CN.md)

AgentSkill Hub 是一个用于发现与检索 **Claude Skill** GitHub 仓库的流量站：定时抓取热门项目入库，并提供可索引的列表页/详情页。

> 术语约束：请保持 **"Claude Skill"** 原文，不要翻译成其它中文说法。

## 功能

- 定时同步 GitHub 上热门 Claude Skill 项目（元数据落库）
- 搜索 + 翻页（用户访问链路绝不直连 GitHub，避免把 GitHub 拉爆）
- SEO/GEO：sitemap、结构化数据（JSON-LD）、动态 OG 图片、`llms.txt`
- `/zh` 与 `/en` 双语页面
- 离线内容增厚（DeepSeek）：摘要/要点/使用场景/SEO 标题与描述（仅定时任务调用）

## 技术栈

- 后端：FastAPI + SQLAlchemy + Alembic + Celery
- 前端：Next.js（App Router）+ TypeScript
- 基础设施：Docker + Nginx + MySQL + Redis

## 仓库结构

- `backend/`：API + 定时任务（Celery）
- `frontend/`：Next.js 网站（SEO 页）
- `docker/`：开发/生产编排 + Nginx 入口
- `docs/`：运维文档

## 快速开始（Docker 开发环境）

```bash
cd docker
cp .env.example .env
./dev_in_docker.sh
```

访问：

- Web（Nginx 入口）：`http://localhost:8083`
- API（Nginx 代理）：`http://localhost:8083/api`

## 本地开发（不使用 Docker）

后端：

```bash
cd backend
cp .env.example .env

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

前端：

```bash
cd frontend
npm install

# 直连后端 API
export NEXT_PUBLIC_API_URL=http://localhost:8000/api

npm run dev
```

## 数据同步 / 定时任务

- 定时同步：Celery beat + worker（见 `backend/app/core/celery_app.py`）
- 手动触发：`POST /api/skills/sync`（默认关闭；开启后必须配置 token）
- 翻译/增厚：仅离线任务调用 DeepSeek（绝不在用户请求链路调用）

运维与部署：见 `docs/operations.md`

## Public API

Base URL：
- `/api`（通过 Nginx）

OpenAPI：
- `/api/openapi.json`
- `/api/docs`

只读端点（无需鉴权）：
- `GET /api/skills?q=&limit=&offset=&topic=&language=&owner=`
- `GET /api/skills/{owner}/{repo}`
- `GET /api/facets/topics`
- `GET /api/facets/languages`
- `GET /api/facets/owners`

## 参与贡献

见 `CONTRIBUTING.md`。本仓库默认要求：

- 提交前跑：`pre-commit run -a`
- Commit Message 使用 Conventional Commits（commit-msg hook）
- DB 结构变更必须提交 Alembic migration

## License

MIT，见 `LICENSE`。
