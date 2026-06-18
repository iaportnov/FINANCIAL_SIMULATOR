"""add trainer solution notes

Revision ID: 6f4e3f2f9c1a
Revises: b34e7c2a91e4
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f4e3f2f9c1a"
down_revision: Union[str, None] = "b34e7c2a91e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trainer_tasks",
        sa.Column("solution_notes", sa.Text(), nullable=False, server_default=""),
    )
    op.alter_column("trainer_tasks", "solution_notes", server_default=None)


def downgrade() -> None:
    op.drop_column("trainer_tasks", "solution_notes")
