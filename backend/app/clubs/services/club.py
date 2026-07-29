from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.clubs.models.club import Club
from app.clubs.models.club_member import ClubMember
from app.clubs.repository.club import ClubRepository
from app.clubs.repository.club_member import ClubMemberRepository
from app.clubs.schemas.club import (
    ClubCreate,
    ClubDetailResponse,
    ClubMemberResponse,
    ClubMemberUpdateRole,
    ClubMemberUser,
    ClubResponse,
    ClubUpdate,
)
from app.core.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)


class ClubService:
    """Business-logic layer for Clubs and Club Memberships."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.club_repo = ClubRepository(db)
        self.member_repo = ClubMemberRepository(db)

    # ── Club CRUD ─────────────────────────────────────────────────────────────

    async def create_club(self, creator_id: int, payload: ClubCreate) -> Club:
        """Create a new club and assign creator as LEADER."""
        # Check name uniqueness
        existing = await self.club_repo.get_by_name(payload.name)
        if existing:
            raise ConflictError(
                message=f"Club with name '{payload.name}' already exists"
            )

        club_data = payload.model_dump()
        club_data["creator_id"] = creator_id
        club = await self.club_repo.create(club_data)

        # Automatically join as LEADER
        await self.member_repo.create(
            {"club_id": club.id, "user_id": creator_id, "role": "LEADER"}
        )

        return club

    async def get_club(self, club_id: int) -> Club:
        """Fetch raw club model or raise NotFoundError."""
        club = await self.club_repo.get(club_id)
        if not club:
            raise NotFoundError(message=f"Club with id {club_id} not found")
        return club

    async def get_club_detail(
        self, club_id: int, current_user_id: int | None = None
    ) -> ClubDetailResponse:
        """Fetch club with details, members, and requester's membership role."""
        club = await self.club_repo.get_with_details(club_id)
        if not club:
            raise NotFoundError(message=f"Club with id {club_id} not found")

        members_count = len(club.members)

        user_role = None
        if current_user_id:
            membership = await self.member_repo.get_by_club_and_user(
                club_id, current_user_id
            )
            if membership:
                user_role = membership.role

        mapped_members: list[ClubMemberResponse] = []
        for m in club.members:
            user_info = None
            if m.user:
                user_info = ClubMemberUser(id=m.user.id, email=m.user.email)
            mapped_members.append(
                ClubMemberResponse(
                    id=m.id,
                    club_id=m.club_id,
                    user_id=m.user_id,
                    role=m.role,
                    user=user_info,
                )
            )

        return ClubDetailResponse(
            id=club.id,
            name=club.name,
            description=club.description,
            category=club.category,
            creator_id=club.creator_id,
            members_count=members_count,
            user_role=user_role,
            members=mapped_members,
        )

    async def update_club(
        self, club_id: int, user_id: int, payload: ClubUpdate
    ) -> Club:
        """Update club metadata (LEADER / Creator only)."""
        club = await self.get_club(club_id)

        # Check authorization
        membership = await self.member_repo.get_by_club_and_user(club_id, user_id)
        if club.creator_id != user_id and (
            not membership or membership.role != "LEADER"
        ):
            raise AuthorizationError(
                message="Only the club leader can update club details"
            )

        update_data = payload.model_dump(exclude_unset=True)

        # Name check
        if "name" in update_data and update_data["name"] != club.name:
            existing = await self.club_repo.get_by_name(update_data["name"])
            if existing:
                raise ConflictError(
                    message=f"Club with name '{update_data['name']}' already exists"
                )

        return await self.club_repo.update(club, update_data)

    async def delete_club(self, club_id: int, user_id: int) -> None:
        """Delete a club (LEADER / Creator only)."""
        club = await self.get_club(club_id)

        # Check authorization
        membership = await self.member_repo.get_by_club_and_user(club_id, user_id)
        if club.creator_id != user_id and (
            not membership or membership.role != "LEADER"
        ):
            raise AuthorizationError(
                message="Only the club leader can delete this club"
            )

        await self.club_repo.remove(club_id)

    async def list_clubs(
        self,
        category: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[ClubResponse]:
        """Fetch list of clubs (summary view)."""
        clubs = await self.club_repo.get_clubs_filtered(
            category=category, search=search, skip=skip, limit=limit
        )
        return [
            ClubResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                category=c.category,
                creator_id=c.creator_id,
            )
            for c in clubs
        ]

    # ── Memberships ───────────────────────────────────────────────────────────

    async def join_club(self, club_id: int, user_id: int) -> ClubMember:
        """Join a club as a MEMBER."""
        await self.get_club(club_id)

        # Check if already a member
        existing = await self.member_repo.get_by_club_and_user(club_id, user_id)
        if existing:
            raise ConflictError(message="You are already a member of this club")

        return await self.member_repo.create(
            {"club_id": club_id, "user_id": user_id, "role": "MEMBER"}
        )

    async def leave_club(self, club_id: int, user_id: int) -> None:
        """Leave a club. Sole leader must assign another leader first."""
        await self.get_club(club_id)

        membership = await self.member_repo.get_by_club_and_user(club_id, user_id)
        if not membership:
            raise NotFoundError(message="You are not a member of this club")

        # Sole leader check
        if membership.role == "LEADER":
            # Count other leaders
            all_members = await self.member_repo.get_by_club(club_id, limit=500)
            other_leaders = [
                m for m in all_members if m.role == "LEADER" and m.user_id != user_id
            ]
            if not other_leaders and len(all_members) > 1:
                raise ValidationError(
                    message="You are the sole leader of this club. "
                    "Please promote another member to LEADER before leaving."
                )

        await self.member_repo.remove(membership.id)

    async def get_club_members(
        self, club_id: int, skip: int = 0, limit: int = 100
    ) -> list[ClubMember]:
        """List all club members with user profiles eager loaded."""
        await self.get_club(club_id)

        # Load user relationships to prevent lazy loading N+1 queries
        result = await self.db.execute(
            select(ClubMember)
            .options(selectinload(ClubMember.user))
            .filter(ClubMember.club_id == club_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_member_role(
        self,
        club_id: int,
        current_user_id: int,
        target_user_id: int,
        payload: ClubMemberUpdateRole,
    ) -> ClubMember:
        """Update a member's role (LEADER only)."""
        await self.get_club(club_id)

        # 1. Authorizing requester (must be LEADER)
        requester_membership = await self.member_repo.get_by_club_and_user(
            club_id, current_user_id
        )
        if not requester_membership or requester_membership.role != "LEADER":
            raise AuthorizationError(
                message="Only club leaders can update member roles"
            )

        # 2. Get target member
        target_membership = await self.member_repo.get_by_club_and_user(
            club_id, target_user_id
        )
        if not target_membership:
            raise NotFoundError(
                message=f"User with id {target_user_id} is not a member of this club"
            )

        new_role = payload.role.upper()
        if new_role not in ["MEMBER", "OFFICER", "LEADER"]:
            raise ValidationError(
                message="Role must be one of MEMBER, OFFICER, or LEADER"
            )

        # 3. Perform update
        updated = await self.member_repo.update(target_membership, {"role": new_role})
        return await self.member_repo.get_with_user(updated.id)
