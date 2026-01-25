"""add skill content fields

Revision ID: 0003_add_skill_content_fields
Revises: 0002_add_description_zh
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_add_skill_content_fields"
down_revision = "0002_add_description_zh"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("skills", sa.Column("summary_en", sa.Text(), nullable=True))
    op.add_column("skills", sa.Column("summary_zh", sa.Text(), nullable=True))
    op.add_column("skills", sa.Column("key_features_en", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("key_features_zh", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("use_cases_en", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("use_cases_zh", sa.JSON(), nullable=True))
    op.add_column("skills", sa.Column("seo_title_en", sa.String(length=255), nullable=True))
    op.add_column("skills", sa.Column("seo_title_zh", sa.String(length=255), nullable=True))
    op.add_column(
        "skills", sa.Column("seo_description_en", sa.Text(), nullable=True)
    )
    op.add_column(
        "skills", sa.Column("seo_description_zh", sa.Text(), nullable=True)
    )
    op.add_column(
        "skills", sa.Column("content_updated_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("skills", "content_updated_at")
    op.drop_column("skills", "seo_description_zh")
    op.drop_column("skills", "seo_description_en")
    op.drop_column("skills", "seo_title_zh")
    op.drop_column("skills", "seo_title_en")
    op.drop_column("skills", "use_cases_zh")
    op.drop_column("skills", "use_cases_en")
    op.drop_column("skills", "key_features_zh")
    op.drop_column("skills", "key_features_en")
    op.drop_column("skills", "summary_zh")
    op.drop_column("skills", "summary_en")

