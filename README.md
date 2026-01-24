# AgentSkill Hub

一个用于展示 **AgentSkill / Claude Skill** 的网站：自动抓取 GitHub 上热门的 Claude Skill 项目入库，在首页展示，并支持搜索。

> 说明：本项目 99% 由 AI 完成，仍需人工审阅与持续完善。

## 功能概览

- 自动同步 GitHub 热门 Claude Skill 项目并入库
- 首页列表展示 + 搜索
- 后端 API 提供同步与检索能力

## 技术栈

- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Frontend**: Next.js + TypeScript
- **Infra**: Docker / Nginx / MySQL / Redis

## 仓库结构

- `backend/`：后端服务
- `frontend/`：前端 Web
- `docker/`：Docker 开发/生产编排与 Nginx 入口
- `docs/`：文档索引
- `scripts/`：同步脚本、维护工具

## 快速开始（Docker，一键启动）

```bash
cd docker
cp .env.example .env
./dev_in_docker.sh
```

访问：

- Web（Nginx 入口）：`http://localhost:8083`
- Backend API（Nginx 代理）：`http://localhost:8083/api`

## 本地开发（不使用 Docker）

### 后端

```bash
cd backend
cp .env.example .env

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install

# 指向后端 API（本地直连）
export NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

## 数据同步

- 手动执行：
  ```bash
  cd backend
  python -m scripts.sync_github_skills
  ```
- API 触发：`POST /api/skills/sync`（默认关闭，需设置 `SYNC_API_ENABLED=true`）
- 定时同步：由后台定时任务控制（见 `backend/app/core/scheduler.py`）
  - `SYNC_INTERVAL_MINUTES`：同步频率（分钟）
  - `SYNC_ON_START`：启动时是否立刻同步
  - `ENABLE_SCHEDULER`：是否启用定时任务
  - `SYNC_API_ENABLED` / `SYNC_API_TOKEN`：是否允许外部触发同步（建议关闭）
  - `GITHUB_MAX_PAGES`：自动翻页最大页数
  - `GITHUB_MAX_RESULTS`：单次同步最多入库数量
  - `ENABLE_TRANSLATION`：是否启用翻译（DeepSeek）
  - `DEEPSEEK_API_KEY` / `DEEPSEEK_API_URL` / `DEEPSEEK_MODEL`

## 多语言（中英文）

- 前端内置中英文切换（右上角按钮）。
- 中文展示会优先使用 `description_zh`，若为空则回退英文描述。

## 数据库迁移（Alembic）

```bash
cd backend
alembic revision --autogenerate -m "create skills table"
alembic upgrade head
```

> 注意：已应用的迁移不要修改，新增变更请创建新迁移。

## 代码规范与质量

```bash
pre-commit install
pre-commit run -a
```

- Python: Ruff (lint + format)
- Frontend: ESLint + Prettier
- Commit: Conventional Commits（commit-msg hook）

## 发布与部署（Docker）

```bash
cd docker
cp .env.example .env
# 修改 .env 中的数据库/密钥/配置

./build_prod.sh
docker compose -f docker-compose.prod.yml up -d
```

## 文档入口

- `docs/README.md`
