"""add repo timestamps

Revision ID: 0004_add_repo_timestamps
Revises: 0003_add_skill_content_fields
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_add_repo_timestamps"
down_revision = "0003_add_skill_content_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "skills", sa.Column("repo_created_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "skills", sa.Column("repo_updated_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(
        "ix_skills_repo_created_at", "skills", ["repo_created_at"], unique=False
    )
    op.create_index(
        "ix_skills_repo_updated_at", "skills", ["repo_updated_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_skills_repo_updated_at", table_name="skills")
    op.drop_index("ix_skills_repo_created_at", table_name="skills")
    op.drop_column("skills", "repo_updated_at")
    op.drop_column("skills", "repo_created_at")
