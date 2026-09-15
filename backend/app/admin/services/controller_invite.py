from datetime import datetime, timedelta
import hashlib
import secrets

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.models.controller_invite import ControllerInvite
from app.admin.repository.admin import AdminRepository
from app.admin.repository.controller_invite import ControllerInviteRepository
from app.admin.schemas.controller_invite import ControllerInviteCreate
from app.core.exceptions import NotFoundError, ValidationError


def generate_high_entropy_code() -> str:
    """Generate a high-entropy controller activation code in format: KNT-XXXX-XXXX-XXXX-XXXX"""
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # High legibility characters
    chunks = ["".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(4)]
    return f"KNT-{'-'.join(chunks)}"


def hash_activation_code(code: str) -> str:
    """Calculate SHA-256 hash of a normalized activation code."""
    cleaned = code.strip().upper()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()


class ControllerInviteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ControllerInviteRepository(db)
        self.admin_repo = AdminRepository(db)

    async def generate_invite(
        self, admin_id: int, payload: ControllerInviteCreate
    ) -> dict:
        dept = payload.department.strip()
        if not dept:
            raise ValidationError(
                message="Department is required to generate controller invite"
            )

        raw_code = generate_high_entropy_code()
        code_hash = hash_activation_code(raw_code)
        now = datetime.utcnow()
        expires_at = now + timedelta(days=payload.validity_days)

        invite_data = {
            "code_hash": code_hash,
            "role": payload.role or "Controller",
            "department": dept,
            "created_by": admin_id,
            "created_at": now,
            "expires_at": expires_at,
            "max_uses": payload.max_uses,
            "used_count": 0,
            "status": "ACTIVE",
        }
        invite = await self.repository.create(invite_data)

        # Log audit trail
        await self.admin_repo.create(
            {
                "actor_id": admin_id,
                "action": "generate_controller_invite",
                "target": f"Department: {dept}, Invite ID: {invite.id}",
                "ip_address": None,
            }
        )

        return {
            "id": invite.id,
            "code": raw_code,  # Plaintext returned only once upon creation
            "department": invite.department,
            "role": invite.role,
            "expires_at": invite.expires_at,
            "max_uses": invite.max_uses,
            "used_count": invite.used_count,
            "status": invite.status,
            "created_at": invite.created_at,
        }

    async def list_invites(
        self, skip: int = 0, limit: int = 100
    ) -> list[ControllerInvite]:
        return await self.repository.list_invites(skip=skip, limit=limit)

    async def revoke_invite(self, invite_id: int, admin_id: int) -> ControllerInvite:
        invite = await self.repository.get(invite_id)
        if not invite:
            raise NotFoundError(message="Controller invite not found")

        invite.status = "REVOKED"
        await self.db.flush()

        # Log audit trail
        await self.admin_repo.create(
            {
                "actor_id": admin_id,
                "action": "revoke_controller_invite",
                "target": f"Invite ID: {invite_id}, Department: {invite.department}",
                "ip_address": None,
            }
        )
        return invite
