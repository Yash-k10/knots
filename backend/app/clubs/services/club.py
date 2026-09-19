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
    ClubLeadUser,
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
from app.users.models.user import User


def _map_club_lead_user(user: User | None) -> ClubLeadUser | None:
    if not user:
        return None
    prof = getattr(user, "profile", None)
    role_obj = getattr(user, "role", None)
    return ClubLeadUser(
        id=user.id,
        email=user.email,
        first_name=prof.first_name if prof else None,
        last_name=prof.last_name if prof else None,
        profile_picture=prof.profile_picture if prof else None,
        department=prof.department if prof else None,
        graduation_year=prof.graduation_year if prof else None,
        user_role=role_obj.name if role_obj else None,
    )


class ClubService:
    """Business-logic layer for Clubs and Club Memberships."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.club_repo = ClubRepository(db)
        self.member_repo = ClubMemberRepository(db)

    # ── Club CRUD ─────────────────────────────────────────────────────────────

    async def create_club(self, creator_id: int, payload: ClubCreate) -> Club:
        """Create a new club, assign creator as LEADER, and appoint Head / Co-Head."""
        # Check name uniqueness
        existing = await self.club_repo.get_by_name(payload.name)
        if existing:
            raise ConflictError(
                message=f"Club with name '{payload.name}' already exists"
            )

        club_data = payload.model_dump()
        club_data["creator_id"] = creator_id

        # Participants for group chat
        participant_ids = [creator_id]
        if payload.head_id and payload.head_id not in participant_ids:
            participant_ids.append(payload.head_id)
        if payload.co_head_id and payload.co_head_id not in participant_ids:
            participant_ids.append(payload.co_head_id)

        # Create Group Chat for the club
        from app.messaging.repository.conversation import ConversationRepository

        conv_repo = ConversationRepository(self.db)
        conv = await conv_repo.create_group_conversation(
            name=payload.name, creator_id=creator_id, participant_ids=participant_ids
        )
        club_data["conversation_id"] = conv.id

        club = await self.club_repo.create(club_data)

        # Automatically join creator as LEADER
        await self.member_repo.create(
            {"club_id": club.id, "user_id": creator_id, "role": "LEADER"}
        )

        # Appoint and notify Head and Co-Head
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)

        if payload.head_id and payload.head_id != creator_id:
            await self.member_repo.create(
                {"club_id": club.id, "user_id": payload.head_id, "role": "HEAD"}
            )
            await notif_service.create_notification(
                user_id=payload.head_id,
                title="Appointed as Club Head! 🎖️",
                content=f"You have been appointed as the Club Head for '{club.name}'. You now have powers to approve or decline student join requests.",
                type="club_role",
            )

        if (
            payload.co_head_id
            and payload.co_head_id != creator_id
            and payload.co_head_id != payload.head_id
        ):
            await self.member_repo.create(
                {"club_id": club.id, "user_id": payload.co_head_id, "role": "CO-HEAD"}
            )
            await notif_service.create_notification(
                user_id=payload.co_head_id,
                title="Appointed as Club Co-Head! 🎖️",
                content=f"You have been appointed as the Club Co-Head for '{club.name}'. You now have powers to approve or decline student join requests.",
                type="club_role",
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

        members_count = len([m for m in club.members if m.role != "PENDING"])

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
                prof = getattr(m.user, "profile", None)
                role_obj = getattr(m.user, "role", None)
                role_name = role_obj.name if role_obj else None
                user_info = ClubMemberUser(
                    id=m.user.id,
                    email=m.user.email,
                    first_name=prof.first_name if prof else None,
                    last_name=prof.last_name if prof else None,
                    profile_picture=prof.profile_picture if prof else None,
                    department=prof.department if prof else None,
                    graduation_year=prof.graduation_year if prof else None,
                    user_role=role_name,
                )
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
            head_id=club.head_id,
            co_head_id=club.co_head_id,
            head=_map_club_lead_user(club.head),
            co_head=_map_club_lead_user(club.co_head),
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

        updated_club = await self.club_repo.update(club, update_data)

        # Synchronize newly appointed head / co-head
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)

        if "head_id" in update_data and update_data["head_id"] != club.head_id:
            new_head_id = update_data["head_id"]
            if new_head_id:
                mem = await self.member_repo.get_by_club_and_user(club_id, new_head_id)
                if mem:
                    await self.member_repo.update(mem, {"role": "HEAD"})
                else:
                    await self.member_repo.create(
                        {"club_id": club_id, "user_id": new_head_id, "role": "HEAD"}
                    )
                await notif_service.create_notification(
                    user_id=new_head_id,
                    title="Appointed as Club Head! 🎖️",
                    content=f"You have been appointed as the Club Head for '{updated_club.name}'. You now have powers to approve or decline student join requests.",
                    type="club_role",
                )

        if "co_head_id" in update_data and update_data["co_head_id"] != club.co_head_id:
            new_co_head_id = update_data["co_head_id"]
            if new_co_head_id:
                mem = await self.member_repo.get_by_club_and_user(
                    club_id, new_co_head_id
                )
                if mem:
                    await self.member_repo.update(mem, {"role": "CO-HEAD"})
                else:
                    await self.member_repo.create(
                        {
                            "club_id": club_id,
                            "user_id": new_co_head_id,
                            "role": "CO-HEAD",
                        }
                    )
                await notif_service.create_notification(
                    user_id=new_co_head_id,
                    title="Appointed as Club Co-Head! 🎖️",
                    content=f"You have been appointed as the Club Co-Head for '{updated_club.name}'. You now have powers to approve or decline student join requests.",
                    type="club_role",
                )

        return updated_club

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
        current_user: User | None = None,
    ) -> list[ClubResponse]:
        """Fetch list of clubs (summary view) with role-based scoping."""
        clubs = await self.club_repo.get_clubs_filtered(
            category=category, search=search, skip=skip, limit=limit
        )

        if current_user:
            role_name = (
                getattr(current_user.role, "name", "student").lower().strip()
                if getattr(current_user, "role", None)
                else "student"
            )
            # Central Admin sees only central clubs (category == 'Central' for example) or maybe all?
            # The prompt: "Controllers can only fetch/manage clubs in their department. Central Admin can only fetch/manage central-level clubs."
            if role_name == "controller":
                user_dept = (
                    getattr(current_user.profile, "department", None)
                    if getattr(current_user, "profile", None)
                    else None
                )
                clubs = [c for c in clubs if c.category == user_dept]
            elif role_name == "central admin":
                clubs = [
                    c for c in clubs if c.category and c.category.lower() == "central"
                ]

        return [
            ClubResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                category=c.category,
                creator_id=c.creator_id,
                head_id=c.head_id,
                co_head_id=c.co_head_id,
                head=_map_club_lead_user(c.head),
                co_head=_map_club_lead_user(c.co_head),
            )
            for c in clubs
        ]

    # ── Memberships ───────────────────────────────────────────────────────────

    async def join_club(self, club_id: int, user_id: int) -> ClubMember:
        """Join a club with PENDING role awaiting Leader/Controller approval."""
        club = await self.get_club(club_id)

        # Check if already a member or pending
        existing = await self.member_repo.get_by_club_and_user(club_id, user_id)
        if existing:
            if existing.role == "PENDING":
                raise ConflictError(
                    message="You already have a pending join request for this club"
                )
            raise ConflictError(message="You are already a member of this club")

        membership = await self.member_repo.create(
            {
                "club_id": club_id,
                "user_id": user_id,
                "role": "PENDING",
            }
        )

        # Notify Head, Co-Head, and Creator/Controller
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)
        recipients = {club.creator_id}
        if club.head_id:
            recipients.add(club.head_id)
        if club.co_head_id:
            recipients.add(club.co_head_id)
        recipients.discard(user_id)

        from app.auth.repository.auth import AuthRepository

        requester = await AuthRepository(self.db).get(user_id)
        requester_name = "A student"
        if requester:
            prof = getattr(requester, "profile", None)
            if prof and getattr(prof, "first_name", None):
                requester_name = (
                    f"{prof.first_name} {getattr(prof, 'last_name', '') or ''}".strip()
                )
            elif requester.email:
                requester_name = requester.email

        for r_id in recipients:
            await notif_service.create_notification(
                user_id=r_id,
                title="New Club Join Request",
                content=f"{requester_name} requested to join '{club.name}'. Click to review and approve.",
                type="club_join_request",
            )

        return membership

    async def leave_club(self, club_id: int, user_id: int) -> None:
        """Leave a club. Sole leader must assign another leader first."""
        club = await self.get_club(club_id)

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
            if (
                not other_leaders
                and len([m for m in all_members if m.role != "PENDING"]) > 1
            ):
                raise ValidationError(
                    message="You are the sole leader of this club. "
                    "Please promote another member to LEADER before leaving."
                )

        await self.member_repo.remove(membership.id)

        # Remove from GC
        if club.conversation_id:
            from app.messaging.models.conversation import ConversationParticipant
            from sqlalchemy import delete

            await self.db.execute(
                delete(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == club.conversation_id,
                    ConversationParticipant.user_id == user_id,
                )
            )
            await self.db.flush()

    async def remove_member(
        self, club_id: int, current_user_id: int, target_user_id: int
    ) -> None:
        """Remove a member or reject a pending join request (LEADER/Creator or self)."""
        club = await self.get_club(club_id)

        # Allow self cancellation or leader/creator/controller action
        if current_user_id != target_user_id:
            requester_membership = await self.member_repo.get_by_club_and_user(
                club_id, current_user_id
            )
            req_user = await self.db.get(User, current_user_id)
            req_role = (
                req_user.role.name.lower().strip() if req_user and req_user.role else ""
            )
            is_admin_or_controller = req_role in [
                "controller",
                "admin",
                "super admin",
                "superadmin",
                "management",
                "central admin",
            ]
            is_lead = (
                current_user_id == club.head_id
                or current_user_id == club.co_head_id
                or (
                    requester_membership
                    and requester_membership.role
                    in ["HEAD", "CO-HEAD", "LEADER", "OFFICER"]
                )
            )
            if (
                not is_admin_or_controller
                and club.creator_id != current_user_id
                and not is_lead
            ):
                raise AuthorizationError(
                    message="Only club leaders, appointed heads, or controllers can remove members or reject requests"
                )

        target_membership = await self.member_repo.get_by_club_and_user(
            club_id, target_user_id
        )
        if not target_membership:
            raise NotFoundError(
                message=f"User with id {target_user_id} has no membership or request in this club"
            )

        await self.member_repo.remove(target_membership.id)

        # Remove from GC
        if club.conversation_id:
            from app.messaging.models.conversation import ConversationParticipant
            from sqlalchemy import delete

            await self.db.execute(
                delete(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == club.conversation_id,
                    ConversationParticipant.user_id == target_user_id,
                )
            )
            await self.db.flush()

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
        """Update a member's role (Head/Co-Head/Leader/Officer/Controller/Admin). Accepts PENDING, MEMBER, OFFICER, LEADER, HEAD, CO-HEAD."""
        club = await self.get_club(club_id)

        # 1. Authorizing requester (must be LEADER, Creator, OFFICER, HEAD, CO-HEAD, Controller, or Admin)
        requester_membership = await self.member_repo.get_by_club_and_user(
            club_id, current_user_id
        )
        req_user = await self.db.get(User, current_user_id)
        req_role = (
            req_user.role.name.lower().strip() if req_user and req_user.role else ""
        )
        is_admin_or_controller = req_role in [
            "controller",
            "admin",
            "super admin",
            "superadmin",
            "management",
            "central admin",
        ]
        is_lead = (
            current_user_id == club.head_id
            or current_user_id == club.co_head_id
            or (
                requester_membership
                and requester_membership.role
                in ["HEAD", "CO-HEAD", "LEADER", "OFFICER"]
            )
        )
        is_authorized = (
            is_admin_or_controller or club.creator_id == current_user_id or is_lead
        )
        if not is_authorized:
            raise AuthorizationError(
                message="Only club leaders, appointed heads, or controllers can update member roles"
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
        if new_role not in [
            "PENDING",
            "MEMBER",
            "OFFICER",
            "LEADER",
            "HEAD",
            "CO-HEAD",
        ]:
            raise ValidationError(
                message="Role must be one of PENDING, MEMBER, OFFICER, LEADER, HEAD, or CO-HEAD"
            )

        # 3. Perform update
        updated = await self.member_repo.update(target_membership, {"role": new_role})

        # If promoted/accepted to active member, ensure added to conversation and send approval notification
        if (
            new_role in ["MEMBER", "OFFICER", "LEADER", "HEAD", "CO-HEAD"]
            and club.conversation_id
        ):
            from app.messaging.models.conversation import ConversationParticipant
            from sqlalchemy import select

            existing_part = await self.db.execute(
                select(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == club.conversation_id,
                    ConversationParticipant.user_id == target_user_id,
                )
            )
            if not existing_part.scalars().first():
                part = ConversationParticipant(
                    conversation_id=club.conversation_id, user_id=target_user_id
                )
                self.db.add(part)
                await self.db.flush()

            # Notification to approved student
            from app.notifications.services.notification import NotificationService

            notif_service = NotificationService(self.db)
            await notif_service.create_notification(
                user_id=target_user_id,
                title="Club Request Approved! 🎉",
                content=f"Your request to join '{club.name}' has been accepted. Welcome to the club!",
                type="club_join_approved",
            )

        return await self.member_repo.get_with_user(updated.id)
