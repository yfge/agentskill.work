"""add description_zh

Revision ID: 0002_add_description_zh
Revises: 0001_create_skills
Create Date: 2026-01-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002_add_description_zh"
down_revision = "0001_create_skills"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("skills", sa.Column("description_zh", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("skills", "description_zh")
