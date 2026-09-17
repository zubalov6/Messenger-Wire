"""add created to messages

Revision ID: 7177d1f00a56
Revises: f917e90b38aa
Create Date: 2026-07-16 16:39:31.552622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fdd859c454d2'
down_revision: Union[str, Sequence[str], None] = '7177d1f00a56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'messages', 'create',
        new_column_name='created_at',
        server_default=sa.text('now()')
    )


def downgrade() -> None:
    op.alter_column(
        'messages', 'created_at',
        new_column_name='create',
        server_default=None
    )
