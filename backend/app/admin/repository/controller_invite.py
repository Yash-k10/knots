from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.models.controller_invite import ControllerInvite
from app.core.repository import BaseRepository


class ControllerInviteRepository(BaseRepository[ControllerInvite]):
    def __init__(self, db: AsyncSession):
        super().__init__(ControllerInvite, db)

    async def get_by_code_hash(self, code_hash: str) -> ControllerInvite | None:
        result = await self.db.execute(
            select(ControllerInvite).filter(ControllerInvite.code_hash == code_hash)
        )
        return result.scalars().first()

    async def list_invites(
        self, skip: int = 0, limit: int = 100
    ) -> list[ControllerInvite]:
        # Auto-update status for expired ones that are still ACTIVE
        now = datetime.utcnow()
        result = await self.db.execute(
            select(ControllerInvite)
            .order_by(ControllerInvite.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        invites = list(result.scalars().all())
        for invite in invites:
            if invite.status == "ACTIVE" and invite.expires_at < now:
                invite.status = "EXPIRED"
        await self.db.flush()
        return invites
