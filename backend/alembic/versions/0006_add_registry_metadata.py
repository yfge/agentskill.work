"""add registry metadata

Revision ID: 0006_add_registry_metadata
Revises: 0005_add_performance_indexes
Create Date: 2026-05-28

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0006_add_registry_metadata"
down_revision = "0005_add_performance_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("skills", sa.Column("topics_json", sa.JSON(), nullable=True))
    op.add_column(
        "skills", sa.Column("skill_type", sa.String(length=64), nullable=True)
    )
    op.add_column("skills", sa.Column("platforms", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("capabilities", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("install_methods", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("config_keys", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("source_files", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("readme_excerpt", sa.Text(), nullable=True))
    op.add_column("skills", sa.Column("quality_score", sa.Integer(), nullable=True))
    op.add_column(
        "skills", sa.Column("verification_status", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "skills",
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_skills_skill_type", "skills", ["skill_type"], unique=False)
    op.create_index(
        "ix_skills_quality_score", "skills", ["quality_score"], unique=False
    )
    op.create_index(
        "ix_skills_verification_status",
        "skills",
        ["verification_status"],
        unique=False,
    )
    op.create_index(
        "ix_skills_last_verified_at", "skills", ["last_verified_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_skills_last_verified_at", table_name="skills")
    op.drop_index("ix_skills_verification_status", table_name="skills")
    op.drop_index("ix_skills_quality_score", table_name="skills")
    op.drop_index("ix_skills_skill_type", table_name="skills")
    op.drop_column("skills", "last_verified_at")
    op.drop_column("skills", "verification_status")
    op.drop_column("skills", "quality_score")
    op.drop_column("skills", "readme_excerpt")
    op.drop_column("skills", "source_files")
    op.drop_column("skills", "config_keys")
    op.drop_column("skills", "install_methods")
    op.drop_column("skills", "capabilities")
    op.drop_column("skills", "platforms")
    op.drop_column("skills", "skill_type")
    op.drop_column("skills", "topics_json")
