"""create skills table

Revision ID: 0001_create_skills
Revises:
Create Date: 2026-01-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_create_skills"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("repo_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("html_url", sa.String(length=512), nullable=False),
        sa.Column("stars", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("forks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("language", sa.String(length=64), nullable=True),
        sa.Column("topics", sa.Text(), nullable=True),
        sa.Column("last_pushed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_skills_repo_id", "skills", ["repo_id"], unique=True)
    op.create_index("ix_skills_name", "skills", ["name"], unique=False)
    op.create_index("ix_skills_full_name", "skills", ["full_name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_skills_full_name", table_name="skills")
    op.drop_index("ix_skills_name", table_name="skills")
    op.drop_index("ix_skills_repo_id", table_name="skills")
    op.drop_table("skills")
