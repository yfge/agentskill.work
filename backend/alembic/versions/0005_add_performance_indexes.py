"""add performance indexes

Revision ID: 0005_add_performance_indexes
Revises: 0004_add_repo_timestamps
Create Date: 2026-02-04

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0005_add_performance_indexes"
down_revision = "0004_add_repo_timestamps"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Single column indexes for filtering
    op.create_index("ix_skills_language", "skills", ["language"], unique=False)
    op.create_index("ix_skills_stars", "skills", ["stars"], unique=False)

    # Composite indexes for sorting + pagination (covers ORDER BY + WHERE id comparisons)
    op.create_index("ix_skills_stars_id", "skills", ["stars", "id"], unique=False)
    op.create_index(
        "ix_skills_created_id", "skills", ["repo_created_at", "id"], unique=False
    )
    op.create_index(
        "ix_skills_updated_id", "skills", ["repo_updated_at", "id"], unique=False
    )

    # Full-text index for description search (MySQL)
    # Note: This uses MySQL-specific syntax. For PostgreSQL, use gin/gist indexes instead.
    op.execute(
        "ALTER TABLE skills ADD FULLTEXT INDEX ft_skills_description "
        "(description, description_zh)"
    )


def downgrade() -> None:
    # Drop full-text index
    op.execute("ALTER TABLE skills DROP INDEX ft_skills_description")

    # Drop composite indexes
    op.drop_index("ix_skills_updated_id", table_name="skills")
    op.drop_index("ix_skills_created_id", table_name="skills")
    op.drop_index("ix_skills_stars_id", table_name="skills")

    # Drop single column indexes
    op.drop_index("ix_skills_stars", table_name="skills")
    op.drop_index("ix_skills_language", table_name="skills")
