from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.clubs.models.club import Club, ClubGalleryItem, ClubResource
from app.clubs.models.club_member import ClubMember
from app.clubs.repository.club import ClubRepository
from app.clubs.repository.club_member import ClubMemberRepository
from app.clubs.schemas.club import (
    ClubAppointmentsUpdate,
    ClubCreate,
    ClubDetailResponse,
    ClubGalleryCreate,
    ClubGalleryResponse,
    ClubLeadUser,
    ClubMemberResponse,
    ClubMemberUpdateRole,
    ClubMemberUser,
    ClubResourceCreate,
    ClubResourceResponse,
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


def _depts_match(user_dept: str, club_cat: str) -> bool:
    """Exact canonical department matching so that CSE(AIML) never matches plain CSE, etc."""
    u = user_dept.lower().strip()
    c = club_cat.lower().strip()
    if u == c:
        return True
    # Central clubs are managed by Central Admin only — never match dept controllers
    if c in ("central", "central level", "campus-wide", "central club"):
        return False
    # Sub-department exact matching (CSE(AIML) vs CSE(AIDS) vs CSE)
    if "aiml" in u:
        return "aiml" in c
    if "aids" in u:
        return "aids" in c
    # Plain CSE must NOT match CSE(AIML) or CSE(AIDS)
    if u == "cse":
        return (
            c == "cse"
            or c == "computer science"
            or c == "computer science & engineering"
        )
    # IT
    if u == "it":
        return c == "it" or "information technology" in c
    # ETC / ECE
    if u in ("etc", "ece"):
        return (
            c in ("etc", "ece")
            or ("electronics" in c and "telecommunication" in c)
            or "ece" in c
        )
    # EE
    if u == "ee":
        return c == "ee" or "electrical" in c
    # ME
    if u == "me":
        return c == "me" or "mechanical" in c
    # BCA / MCA / MBA
    if u == "bca":
        return c == "bca"
    if u == "mca":
        return c == "mca"
    if u == "mba":
        return c == "mba"
    # First Year
    if "first" in u or u == "fy":
        return "first" in c or c == "fy"
    # Sports
    if "sport" in u:
        return "sport" in c
    return False


class ClubService:
    """Business-logic layer for Clubs and Club Memberships."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.club_repo = ClubRepository(db)
        self.member_repo = ClubMemberRepository(db)

    async def _get_user_with_role(self, user_id: int) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(User.id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    # ── Club CRUD ─────────────────────────────────────────────────────────────

    async def create_club(self, creator_id: int, payload: ClubCreate) -> Club:
        """Create a new club, assign creator as LEADER, and appoint Head / Co-Head."""
        # Check name uniqueness
        existing = await self.club_repo.get_by_name(payload.name)
        if existing:
            raise ConflictError(
                message=f"Club with name '{payload.name}' already exists"
            )

        stmt = (
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .filter(User.id == creator_id)
        )
        creator = (await self.db.execute(stmt)).scalars().first()
        role_name = (
            creator.role.name.lower().strip() if creator and creator.role else ""
        )
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot create clubs."
            )
        if role_name == "hod" or "hod" in role_name:
            raise AuthorizationError(
                message="HOD accounts cannot create clubs; club creation is managed by Department Controllers."
            )

        club_data = payload.model_dump(exclude_unset=True)
        is_central_admin = creator and (
            creator.role_id == 1
            or role_name
            in ("admin", "super admin", "superadmin", "central admin", "management")
            or "admin" in creator.email.lower()
        )
        if is_central_admin:
            if not club_data.get("category"):
                club_data["category"] = "Central"
        elif "controller" in role_name:
            user_dept = (
                getattr(creator.profile, "department", None)
                if creator and getattr(creator, "profile", None)
                else None
            )
            if user_dept:
                club_data["category"] = user_dept
        elif "tpo" in role_name:
            club_data["category"] = "Placement & Internship"

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

        if payload.faculty_coordinator_id:
            await self.member_repo.create(
                {
                    "club_id": club.id,
                    "user_id": payload.faculty_coordinator_id,
                    "role": "FACULTY_COORDINATOR",
                }
            )
            await notif_service.create_notification(
                user_id=payload.faculty_coordinator_id,
                title="Appointed as Faculty Coordinator! 🎓",
                content=f"You have been appointed as the Faculty Coordinator for '{club.name}'.",
                type="club_role",
            )

        if payload.alumni_mentor_id:
            await notif_service.create_notification(
                user_id=payload.alumni_mentor_id,
                title="Requested as Club Alumni Mentor! 🌟",
                content=f"You have been requested to serve as an Alumni Mentor for '{club.name}'.",
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
        self,
        club_id: int,
        current_user: User | int | None = None,
        current_user_id: int | None = None,
    ) -> ClubDetailResponse:
        """Fetch club with details, members, and requester's membership role."""
        club = await self.club_repo.get_with_details(club_id)
        if not club:
            raise NotFoundError(message=f"Club with id {club_id} not found")

        # Resolve current user object and ID
        req_user: User | None = None
        user_id = current_user_id
        if isinstance(current_user, User):
            req_user = current_user
            user_id = current_user.id
        elif isinstance(current_user, int):
            user_id = current_user

        if req_user:
            role_name = (
                getattr(req_user.role, "name", "").lower().strip()
                if getattr(req_user, "role", None)
                else ""
            )
            if not role_name and getattr(req_user, "role_id", None) == 6:
                role_name = "faculty"

            # Faculty can only view the clubs where they are the coordinator
            if "faculty" in role_name and club.faculty_coordinator_id != req_user.id:
                raise AuthorizationError(
                    message="Faculty members can only view clubs in which they are the appointed Faculty Coordinator."
                )

        members_count = len([m for m in club.members if m.role != "PENDING"])

        user_role = None
        if user_id:
            membership = await self.member_repo.get_by_club_and_user(club_id, user_id)
            if membership:
                user_role = membership.role
            elif user_id == club.faculty_coordinator_id:
                user_role = "FACULTY_COORDINATOR"

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

        # Count shared resources
        res_count_stmt = select(func.count(ClubResource.id)).filter(
            ClubResource.club_id == club.id
        )
        res_count = (await self.db.execute(res_count_stmt)).scalar() or 0

        return ClubDetailResponse(
            id=club.id,
            name=club.name,
            description=club.description,
            category=club.category,
            creator_id=club.creator_id,
            head_id=club.head_id,
            co_head_id=club.co_head_id,
            faculty_coordinator_id=club.faculty_coordinator_id,
            alumni_mentor_id=club.alumni_mentor_id,
            head=_map_club_lead_user(club.head),
            co_head=_map_club_lead_user(club.co_head),
            faculty_coordinator=_map_club_lead_user(club.faculty_coordinator),
            alumni_mentor=_map_club_lead_user(club.alumni_mentor),
            members_count=members_count,
            resources_count=res_count,
            user_role=user_role,
            members=mapped_members,
        )

    async def update_club(
        self, club_id: int, user_id: int, payload: ClubUpdate
    ) -> Club:
        """Update club metadata (LEADER / Creator only)."""
        club = await self.get_club(club_id)

        # Check authorization (Central Admin, Department Controller for their dept, or Creator / LEADER / Faculty Coordinator)
        current_user = await self._get_user_with_role(user_id)
        role_name = (
            current_user.role.name.lower().strip()
            if current_user and current_user.role
            else ""
        )
        is_admin = current_user and (
            current_user.role_id in (1, 2, 9)
            or role_name
            in ("admin", "super admin", "superadmin", "central admin", "management")
            or "admin" in current_user.email.lower()
        )

        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot update clubs."
            )
        if role_name == "hod" or "hod" in role_name:
            raise AuthorizationError(
                message="HOD accounts cannot update clubs; club management is handled by Department Controllers."
            )

        if not is_admin:
            if "controller" in role_name:
                user_dept = (
                    (getattr(current_user.profile, "department", None) or "").strip()
                    if current_user and getattr(current_user, "profile", None)
                    else ""
                )
                club_cat = (club.category or "").strip()
                if not (user_dept and _depts_match(user_dept, club_cat)):
                    raise AuthorizationError(
                        message="Controllers can only update clubs belonging to their own department"
                    )
            elif "tpo" in role_name:
                if club.creator_id != user_id:
                    raise AuthorizationError(
                        message="TPO can only manage and update clubs created by them"
                    )
            else:
                membership = await self.member_repo.get_by_club_and_user(
                    club_id, user_id
                )
                is_faculty_coord = club.faculty_coordinator_id == user_id
                if (
                    club.creator_id != user_id
                    and not is_faculty_coord
                    and (
                        not membership
                        or membership.role not in ("LEADER", "FACULTY_COORDINATOR")
                    )
                ):
                    raise AuthorizationError(
                        message="Only the club leader, faculty coordinator, or department controller can update club details"
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

        # Check authorization (Central Admin, Controller for their department, or Club Leader / Creator)
        current_user = await self._get_user_with_role(user_id)
        role_name = (
            current_user.role.name.lower().strip()
            if current_user and current_user.role
            else ""
        )
        is_admin = current_user and (
            current_user.role_id in (1, 2, 9)
            or role_name
            in ("admin", "super admin", "superadmin", "central admin", "management")
            or "admin" in current_user.email.lower()
        )

        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot delete clubs."
            )
        if role_name == "hod" or "hod" in role_name:
            raise AuthorizationError(
                message="HOD accounts cannot delete clubs; club management is handled by Department Controllers."
            )

        if not is_admin:
            if "controller" in role_name:
                user_dept = (
                    (getattr(current_user.profile, "department", None) or "").strip()
                    if current_user and getattr(current_user, "profile", None)
                    else ""
                )
                club_cat = (club.category or "").strip()
                if not (user_dept and _depts_match(user_dept, club_cat)):
                    raise AuthorizationError(
                        message="Controllers can only delete clubs belonging to their own department"
                    )
            elif "tpo" in role_name:
                if club.creator_id != user_id:
                    raise AuthorizationError(
                        message="TPO can only delete clubs created by them"
                    )
            else:
                membership = await self.member_repo.get_by_club_and_user(
                    club_id, user_id
                )
                if club.creator_id != user_id and (
                    not membership or membership.role != "LEADER"
                ):
                    raise AuthorizationError(
                        message="Only the club leader, department controller, or admin can delete this club"
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
        faculty_coordinator_id = None
        if current_user:
            role_name = (
                getattr(current_user.role, "name", "student").lower().strip()
                if getattr(current_user, "role", None)
                else ""
            )
            if not role_name and getattr(current_user, "role_id", None) == 6:
                role_name = "faculty"
            elif not role_name and getattr(current_user, "role_id", None) == 8:
                role_name = "controller"

            # 1. Faculty: ONLY clubs where they are the coordinator
            if "faculty" in role_name:
                faculty_coordinator_id = current_user.id

        clubs = await self.club_repo.get_clubs_filtered(
            category=category,
            search=search,
            faculty_coordinator_id=faculty_coordinator_id,
            skip=skip,
            limit=limit,
        )

        if current_user:
            role_name = (
                getattr(current_user.role, "name", "student").lower().strip()
                if getattr(current_user, "role", None)
                else ""
            )
            if not role_name and getattr(current_user, "role_id", None) == 6:
                role_name = "faculty"
            elif not role_name and getattr(current_user, "role_id", None) == 8:
                role_name = "controller"

            # 1. Faculty: coordinated clubs + all Central level clubs
            if "faculty" in role_name:
                clubs = [
                    c
                    for c in clubs
                    if c.faculty_coordinator_id == current_user.id
                    or (
                        c.category
                        and c.category.strip().lower()
                        in ("central", "central level", "campus-wide", "central club")
                    )
                ]

            # 2. Controller: clubs in their department + Central level clubs
            elif role_name == "controller":
                user_dept = (
                    getattr(current_user.profile, "department", None)
                    if getattr(current_user, "profile", None)
                    else None
                )
                dept_str = user_dept.strip() if user_dept else ""
                clubs = [
                    c
                    for c in clubs
                    if (
                        c.category
                        and c.category.strip().lower()
                        in ("central", "central level", "campus-wide", "central club")
                    )
                    or (
                        dept_str
                        and c.category
                        and _depts_match(dept_str, c.category.strip())
                    )
                ]
            # 3. Central admin: sees ALL clubs
            elif role_name in (
                "central admin",
                "central_admin",
                "admin",
                "super admin",
                "superadmin",
            ):
                pass

        return [
            ClubResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                category=c.category,
                creator_id=c.creator_id,
                head_id=c.head_id,
                co_head_id=c.co_head_id,
                faculty_coordinator_id=c.faculty_coordinator_id,
                alumni_mentor_id=c.alumni_mentor_id,
                head=_map_club_lead_user(c.head),
                co_head=_map_club_lead_user(c.co_head),
                faculty_coordinator=_map_club_lead_user(c.faculty_coordinator),
                alumni_mentor=_map_club_lead_user(c.alumni_mentor),
            )
            for c in clubs
        ]

    # ── Memberships ───────────────────────────────────────────────────────────

    async def join_club(self, club_id: int, user_id: int) -> ClubMember:
        """Join a club with PENDING role awaiting Leader/Controller approval."""
        club = await self.get_club(club_id)

        user = await self._get_user_with_role(user_id)
        role_name = user.role.name.lower().strip() if user and user.role else ""
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot join clubs."
            )

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
            req_user = await self._get_user_with_role(current_user_id)
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
                or current_user_id == club.faculty_coordinator_id
                or (
                    requester_membership
                    and requester_membership.role
                    in ["HEAD", "CO-HEAD", "LEADER", "OFFICER", "FACULTY_COORDINATOR"]
                )
            )
            if (
                not is_admin_or_controller
                and club.creator_id != current_user_id
                and not is_lead
            ):
                raise AuthorizationError(
                    message="Only club leaders, appointed heads, faculty coordinator, or controllers can remove members or reject requests"
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
        req_user = await self._get_user_with_role(current_user_id)
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
            or current_user_id == club.faculty_coordinator_id
            or (
                requester_membership
                and requester_membership.role
                in ["HEAD", "CO-HEAD", "LEADER", "OFFICER", "FACULTY_COORDINATOR"]
            )
        )
        is_authorized = (
            is_admin_or_controller or club.creator_id == current_user_id or is_lead
        )
        if not is_authorized:
            raise AuthorizationError(
                message="Only club leaders, appointed heads, faculty coordinator, or controllers can update member roles"
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

    # ── Faculty Coordinator Management ────────────────────────────────────────

    async def set_faculty_coordinator(
        self, club_id: int, current_user: User, faculty_id: int | None
    ) -> ClubDetailResponse:
        """Controller of the club's department (or Admin) appoints or removes a Faculty Coordinator."""
        club = await self.get_club(club_id)

        from sqlalchemy.orm import joinedload

        # Ensure current_user relationships are loaded
        if (
            "role" not in current_user.__dict__
            or "profile" not in current_user.__dict__
        ):
            stmt = (
                select(User)
                .options(joinedload(User.role), joinedload(User.profile))
                .filter(User.id == current_user.id)
            )
            res = await self.db.execute(stmt)
            loaded_user = res.scalars().first()
            if loaded_user:
                current_user = loaded_user

        role_name = (
            current_user.role.name.lower().strip()
            if getattr(current_user, "role", None)
            else ""
        )
        is_admin = current_user.role_id in (1, 2, 9) or role_name in [
            "admin",
            "super admin",
            "superadmin",
            "central admin",
            "management",
        ]
        user_dept = (
            getattr(current_user.profile, "department", None)
            if getattr(current_user, "profile", None)
            else None
        )

        is_dept_controller = False
        if role_name == "controller":
            if (
                user_dept
                and club.category
                and user_dept.strip().lower() == club.category.strip().lower()
            ):
                is_dept_controller = True
            elif current_user.email and club.category:
                prefix = current_user.email.split("@")[0].lower()
                cat_clean = (
                    club.category.lower()
                    .replace("(", "")
                    .replace(")", "")
                    .replace(" ", "")
                )
                if cat_clean in prefix:
                    is_dept_controller = True
            if not user_dept and not is_dept_controller:
                is_dept_controller = True

        if not is_admin and not is_dept_controller:
            raise AuthorizationError(
                message="Only the Department Controller of this club's department can assign a Faculty Coordinator"
            )

        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)

        if faculty_id is not None:
            fac_stmt = (
                select(User)
                .options(joinedload(User.role), joinedload(User.profile))
                .filter(User.id == faculty_id)
            )
            fac_res = await self.db.execute(fac_stmt)
            fac_user = fac_res.scalars().first()
            if not fac_user:
                raise NotFoundError(
                    message=f"Faculty user with id {faculty_id} not found"
                )

            # Check role
            fac_role = fac_user.role.name.lower().strip() if fac_user.role else ""
            if (
                fac_user.role_id not in (6, 10)
                and "faculty" not in fac_role
                and "hod" not in fac_role
            ):
                raise ValidationError(
                    message="Selected user must have a Faculty or HOD role"
                )

            # Update club
            await self.club_repo.update(club, {"faculty_coordinator_id": faculty_id})

            # Ensure membership has role FACULTY_COORDINATOR
            existing_mem = await self.member_repo.get_by_club_and_user(
                club_id, faculty_id
            )
            if existing_mem:
                await self.member_repo.update(
                    existing_mem, {"role": "FACULTY_COORDINATOR"}
                )
            else:
                await self.member_repo.create(
                    {
                        "club_id": club_id,
                        "user_id": faculty_id,
                        "role": "FACULTY_COORDINATOR",
                    }
                )

            # Add to club group conversation if needed
            if club.conversation_id:
                from app.messaging.models.conversation import ConversationParticipant

                cp_res = await self.db.execute(
                    select(ConversationParticipant).filter(
                        ConversationParticipant.conversation_id == club.conversation_id,
                        ConversationParticipant.user_id == faculty_id,
                    )
                )
                if not cp_res.scalars().first():
                    new_cp = ConversationParticipant(
                        conversation_id=club.conversation_id,
                        user_id=faculty_id,
                    )
                    self.db.add(new_cp)
                    await self.db.flush()

            # Send Notification
            await notif_service.create_notification(
                user_id=faculty_id,
                title="Appointed as Faculty Coordinator! 🎓",
                content=f"You have been appointed as the Faculty Coordinator for '{club.name}' by the Department Controller. You can now oversee and manage the club.",
                type="club_role",
            )
        else:
            old_coord_id = club.faculty_coordinator_id
            await self.club_repo.update(club, {"faculty_coordinator_id": None})
            if old_coord_id:
                old_mem = await self.member_repo.get_by_club_and_user(
                    club_id, old_coord_id
                )
                if old_mem and old_mem.role == "FACULTY_COORDINATOR":
                    await self.member_repo.remove(old_mem.id)

        return await self.get_club_detail(club_id, current_user.id)

    async def get_faculty_candidates(
        self, department: str | None = None
    ) -> list[ClubLeadUser]:
        """Fetch faculty members available to be appointed as coordinators."""
        from sqlalchemy import or_, select
        from app.users.models.role import Role
        from app.profiles.models.profile import Profile

        stmt = (
            select(User)
            .join(User.role)
            .outerjoin(User.profile)
            .options(selectinload(User.profile), selectinload(User.role))
            .filter(
                or_(
                    User.role_id.in_([6, 10]),
                    Role.name.ilike("%faculty%"),
                    Role.name.ilike("%hod%"),
                ),
                User.is_active.is_(True),
            )
        )
        if department:
            stmt = stmt.filter(
                or_(
                    Profile.department.ilike(f"%{department}%"),
                    Profile.department.is_(None),
                )
            )
        res = await self.db.execute(stmt)
        users = res.scalars().unique().all()
        return [_map_club_lead_user(u) for u in users if u is not None]

    async def update_appointments(
        self, club_id: int, current_user: User, payload: ClubAppointmentsUpdate
    ) -> ClubDetailResponse:
        """Appoint Head, Co-Head, Faculty Coordinator, and Alumni Mentor (Controller / Admin only)."""
        role_name = current_user.role.name.lower().strip() if current_user.role else ""
        is_admin = (
            current_user.role_id in (1, 2, 9)
            or role_name
            in ("admin", "super admin", "superadmin", "central admin", "management")
            or "admin" in current_user.email.lower()
        )
        club = await self.get_club(club_id)

        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot appoint club leadership."
            )
        if role_name == "hod" or "hod" in role_name:
            raise AuthorizationError(
                message="HOD accounts cannot appoint club leadership; appointments are handled by Department Controllers."
            )

        if not is_admin:
            if "controller" in role_name:
                user_dept = (
                    (getattr(current_user.profile, "department", None) or "").strip()
                    if getattr(current_user, "profile", None)
                    else ""
                )
                club_cat = (club.category or "").strip()
                if not (user_dept and _depts_match(user_dept, club_cat)):
                    raise AuthorizationError(
                        message="Controllers can only appoint leadership for clubs belonging to their own department"
                    )
            elif "tpo" in role_name:
                if club.creator_id != current_user.id:
                    raise AuthorizationError(
                        message="TPO can only appoint leadership for clubs created by them."
                    )
            else:
                raise AuthorizationError(
                    message="Only Department Controllers, TPO (for created clubs), or Admins can appoint club leadership and mentors."
                )
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)

        update_data = {}
        if payload.head_id is not None:
            update_data["head_id"] = payload.head_id if payload.head_id > 0 else None
            if payload.head_id > 0:
                await self.member_repo.create(
                    {"club_id": club.id, "user_id": payload.head_id, "role": "HEAD"}
                )
                await notif_service.create_notification(
                    user_id=payload.head_id,
                    title="Appointed as Club Head! 🎖️",
                    content=f"You have been appointed as the Club Head for '{club.name}'.",
                    type="club_role",
                )

        if payload.co_head_id is not None:
            update_data["co_head_id"] = (
                payload.co_head_id if payload.co_head_id > 0 else None
            )
            if payload.co_head_id > 0:
                await self.member_repo.create(
                    {
                        "club_id": club.id,
                        "user_id": payload.co_head_id,
                        "role": "CO-HEAD",
                    }
                )
                await notif_service.create_notification(
                    user_id=payload.co_head_id,
                    title="Appointed as Club Co-Head! 🎖️",
                    content=f"You have been appointed as the Club Co-Head for '{club.name}'.",
                    type="club_role",
                )

        if payload.faculty_coordinator_id is not None:
            update_data["faculty_coordinator_id"] = (
                payload.faculty_coordinator_id
                if payload.faculty_coordinator_id > 0
                else None
            )
            if payload.faculty_coordinator_id > 0:
                await self.member_repo.create(
                    {
                        "club_id": club.id,
                        "user_id": payload.faculty_coordinator_id,
                        "role": "FACULTY_COORDINATOR",
                    }
                )
                await notif_service.create_notification(
                    user_id=payload.faculty_coordinator_id,
                    title="Appointed as Faculty Coordinator! 🎓",
                    content=f"You have been appointed as the Faculty Coordinator for '{club.name}'.",
                    type="club_role",
                )

        if payload.alumni_mentor_id is not None:
            update_data["alumni_mentor_id"] = (
                payload.alumni_mentor_id if payload.alumni_mentor_id > 0 else None
            )
            if payload.alumni_mentor_id > 0:
                await notif_service.create_notification(
                    user_id=payload.alumni_mentor_id,
                    title="Requested as Club Alumni Mentor! 🌟",
                    content=f"The Department Controller has requested you to serve as the Alumni Mentor for '{club.name}'.",
                    type="club_role",
                )

        if update_data:
            await self.club_repo.update(club, update_data)

        return await self.get_club_detail(club_id, current_user.id)

    async def get_alumni_candidates(
        self, department: str | None = None
    ) -> list[ClubLeadUser]:
        """Fetch alumni members available to be appointed as mentors."""
        from app.profiles.models.profile import Profile
        from app.users.models.role import Role

        stmt = (
            select(User)
            .join(User.role)
            .outerjoin(User.profile)
            .options(selectinload(User.profile), selectinload(User.role))
            .filter(
                or_(
                    User.role_id == 4,
                    Role.name.ilike("%alumni%"),
                ),
                User.is_active.is_(True),
            )
        )
        if department:
            stmt = stmt.filter(
                or_(
                    Profile.department.ilike(f"%{department}%"),
                    Profile.department.is_(None),
                )
            )
        res = await self.db.execute(stmt)
        users = res.scalars().unique().all()
        return [_map_club_lead_user(u) for u in users if u is not None]

    # ── Club Resources ────────────────────────────────────────────────────────

    async def get_club_resources(self, club_id: int) -> list[ClubResourceResponse]:
        """Retrieve all shared resources for a club."""
        stmt = (
            select(ClubResource)
            .options(selectinload(ClubResource.uploaded_by).selectinload(User.profile))
            .filter(ClubResource.club_id == club_id)
            .order_by(ClubResource.created_at.desc())
        )
        res = await self.db.execute(stmt)
        resources = res.scalars().all()
        return [
            ClubResourceResponse(
                id=r.id,
                club_id=r.club_id,
                title=r.title,
                category=r.category,
                resource_type=getattr(r, "resource_type", "DOC") or "DOC",
                url=r.url,
                description=r.description,
                uploaded_by_id=r.uploaded_by_id,
                uploaded_by=_map_club_lead_user(r.uploaded_by),
                created_at=r.created_at,
            )
            for r in resources
        ]

    async def create_club_resource(
        self, club_id: int, user_id: int, payload: ClubResourceCreate
    ) -> ClubResourceResponse:
        """Add a shared resource to a club (Head, Co-Head, Faculty Coordinator, and Alumni only)."""
        user_stmt = (
            select(User).options(selectinload(User.role)).filter(User.id == user_id)
        )
        user = (await self.db.execute(user_stmt)).scalars().first()
        role_name = user.role.name.lower().strip() if user and user.role else ""
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot share club resources."
            )

        club = await self.get_club(club_id)

        # Check authorization: Club Head, Co-Head, Faculty Coordinator, Alumni, or Admin/Controller
        is_head = club.head_id == user_id
        is_co_head = club.co_head_id == user_id
        is_faculty_coord = (
            club.faculty_coordinator_id == user_id
            or "faculty" in role_name
            or "coordinator" in role_name
        )
        is_alumni = club.alumni_mentor_id == user_id or "alumni" in role_name
        is_admin_or_controller = (
            any(
                r in role_name
                for r in [
                    "admin",
                    "superadmin",
                    "super admin",
                    "central admin",
                    "management",
                    "controller",
                    "hod",
                ]
            )
            or "controller" in (user.email or "").lower()
            or "admin" in (user.email or "").lower()
            or club.creator_id == user_id
        )

        # Check membership role
        mem = await self.member_repo.get_by_club_and_user(club_id, user_id)
        mem_role = mem.role.upper() if mem and mem.role else ""
        is_member_lead = mem_role in (
            "HEAD",
            "CO-HEAD",
            "FACULTY_COORDINATOR",
            "LEADER",
        )

        if not (
            is_head
            or is_co_head
            or is_faculty_coord
            or is_alumni
            or is_admin_or_controller
            or is_member_lead
        ):
            raise AuthorizationError(
                message="Only Club Head, Co-Head, Faculty Coordinator, and Alumni can post club resources."
            )

        # Normalize resource_type
        raw_type = (getattr(payload, "resource_type", "") or "DOC").strip().upper()
        if raw_type not in ("DOC", "IMAGE", "PDF", "GITHUB"):
            url_lower = (payload.url or "").lower()
            if any(ext in url_lower for ext in (".pdf", "/pdf")):
                raw_type = "PDF"
            elif any(
                ext in url_lower
                for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")
            ):
                raw_type = "IMAGE"
            elif "github.com" in url_lower:
                raw_type = "GITHUB"
            else:
                raw_type = "DOC"

        # Normalize category: Notes, Question Bank, URL / Repo
        raw_cat = (payload.category or "Notes").strip()
        cat_lower = raw_cat.lower().replace(" ", "").replace("/", "").replace("&", "")
        if "question" in cat_lower or "bank" in cat_lower or "pyq" in cat_lower:
            norm_cat = "Question Bank"
        elif (
            "repo" in cat_lower
            or "url" in cat_lower
            or "code" in cat_lower
            or "github" in cat_lower
        ):
            norm_cat = "URL / Repo"
        else:
            norm_cat = "Notes"

        resource = ClubResource(
            club_id=club.id,
            title=payload.title,
            category=norm_cat,
            resource_type=raw_type,
            url=payload.url,
            description=payload.description,
            uploaded_by_id=user_id,
        )
        self.db.add(resource)
        await self.db.flush()
        await self.db.commit()

        stmt = (
            select(ClubResource)
            .options(selectinload(ClubResource.uploaded_by).selectinload(User.profile))
            .filter(ClubResource.id == resource.id)
        )
        loaded = (await self.db.execute(stmt)).scalars().first()
        return ClubResourceResponse(
            id=loaded.id,
            club_id=loaded.club_id,
            title=loaded.title,
            category=loaded.category,
            resource_type=getattr(loaded, "resource_type", "DOC") or "DOC",
            url=loaded.url,
            description=loaded.description,
            uploaded_by_id=loaded.uploaded_by_id,
            uploaded_by=_map_club_lead_user(loaded.uploaded_by),
            created_at=loaded.created_at,
        )

    async def delete_club_resource(
        self, club_id: int, resource_id: int, user_id: int, is_controller: bool = False
    ) -> None:
        """Delete a shared resource from a club."""
        user = await self._get_user_with_role(user_id)
        role_name = user.role.name.lower().strip() if user and user.role else ""
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot delete club resources."
            )

        stmt = select(ClubResource).filter(
            ClubResource.id == resource_id, ClubResource.club_id == club_id
        )
        resource = (await self.db.execute(stmt)).scalars().first()
        if not resource:
            raise NotFoundError(message="Club resource not found")
        club = await self.get_club(club_id)
        is_admin_user = (
            user.role_id in (1, 2, 9)
            or role_name
            in ("admin", "super admin", "superadmin", "central admin", "management")
            or "admin" in (user.email or "").lower()
        )
        if (
            resource.uploaded_by_id != user_id
            and not is_controller
            and not is_admin_user
            and club.creator_id != user_id
        ):
            raise AuthorizationError(message="You can only delete resources you shared")
        await self.db.delete(resource)
        await self.db.commit()

    # ── Club Gallery ──────────────────────────────────────────────────────────

    async def get_club_gallery(self, club_id: int) -> list[ClubGalleryResponse]:
        """Retrieve all gallery moments for a club."""
        stmt = (
            select(ClubGalleryItem)
            .options(
                selectinload(ClubGalleryItem.uploaded_by).selectinload(User.profile)
            )
            .filter(ClubGalleryItem.club_id == club_id)
            .order_by(ClubGalleryItem.created_at.desc())
        )
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            ClubGalleryResponse(
                id=g.id,
                club_id=g.club_id,
                title=g.title,
                image_url=g.image_url,
                activity_name=g.activity_name,
                uploaded_by_id=g.uploaded_by_id,
                uploaded_by=_map_club_lead_user(g.uploaded_by),
                created_at=g.created_at,
            )
            for g in items
        ]

    async def create_club_gallery(
        self, club_id: int, user_id: int, payload: ClubGalleryCreate
    ) -> ClubGalleryResponse:
        """Add a photo to a club gallery."""
        user = await self._get_user_with_role(user_id)
        role_name = user.role.name.lower().strip() if user and user.role else ""
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot upload gallery photos."
            )

        club = await self.get_club(club_id)
        item = ClubGalleryItem(
            club_id=club.id,
            title=payload.title,
            image_url=payload.image_url,
            activity_name=payload.activity_name,
            uploaded_by_id=user_id,
        )
        self.db.add(item)
        await self.db.flush()
        await self.db.commit()

        stmt = (
            select(ClubGalleryItem)
            .options(
                selectinload(ClubGalleryItem.uploaded_by).selectinload(User.profile)
            )
            .filter(ClubGalleryItem.id == item.id)
        )
        loaded = (await self.db.execute(stmt)).scalars().first()
        return ClubGalleryResponse(
            id=loaded.id,
            club_id=loaded.club_id,
            title=loaded.title,
            image_url=loaded.image_url,
            activity_name=loaded.activity_name,
            uploaded_by_id=loaded.uploaded_by_id,
            uploaded_by=_map_club_lead_user(loaded.uploaded_by),
            created_at=loaded.created_at,
        )

    async def delete_club_gallery(
        self, club_id: int, item_id: int, user_id: int, is_controller: bool = False
    ) -> None:
        """Delete a photo from a club gallery."""
        user = await self._get_user_with_role(user_id)
        role_name = user.role.name.lower().strip() if user and user.role else ""
        if role_name in ("ceo", "dean", "principal"):
            raise AuthorizationError(
                message="Executive leadership roles (CEO, Dean, Principal) have read-only access and cannot delete gallery photos."
            )

        stmt = select(ClubGalleryItem).filter(
            ClubGalleryItem.id == item_id, ClubGalleryItem.club_id == club_id
        )
        item = (await self.db.execute(stmt)).scalars().first()
        if not item:
            raise NotFoundError(message="Club gallery photo not found")
        club = await self.get_club(club_id)
        if (
            item.uploaded_by_id != user_id
            and not is_controller
            and club.creator_id != user_id
        ):
            raise AuthorizationError(message="You can only delete photos you uploaded")
        await self.db.delete(item)
        await self.db.commit()
