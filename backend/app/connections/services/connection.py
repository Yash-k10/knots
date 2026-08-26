from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.connections.models.connection import Connection, ConnectionStatus
from app.connections.repository.connection import ConnectionRepository
from app.users.models.user import User


class ConnectionService:
    def __init__(self, db: AsyncSession):
        self.repository = ConnectionRepository(db)
        self.db = db

    async def request_connection(
        self, requester_id: int, addressee_id: int
    ) -> Connection:
        if requester_id == addressee_id:
            raise ValueError("Cannot connect with yourself")

        # Stealth check: Block connection requests to Super Admin
        try:
            from app.users.models.role import Role

            addressee_stmt = (
                select(User)
                .outerjoin(Role, User.role_id == Role.id)
                .options(selectinload(User.role))
                .where(User.id == addressee_id)
            )
            addressee_res = await self.db.execute(addressee_stmt)
            if hasattr(addressee_res, "scalars"):
                addressee = addressee_res.scalars().first()
                if (
                    addressee
                    and getattr(addressee, "role", None)
                    and getattr(addressee.role, "name", None) == "Super Admin"
                ):
                    raise ValueError("User not found")
        except ValueError:
            raise
        except Exception:
            pass

        existing = await self.repository.get_connection_between_users(
            requester_id, addressee_id
        )
        if existing:
            raise ValueError("Connection or request already exists")

        conn = await self.repository.create(
            {
                "requester_id": requester_id,
                "addressee_id": addressee_id,
                "status": ConnectionStatus.PENDING,
            }
        )

        try:
            from app.notifications.services.notification import NotificationService
            from app.profiles.repository.profile import ProfileRepository

            prof_repo = ProfileRepository(self.repository.db)
            req_prof = await prof_repo.get_by_user_id(requester_id)
            req_name = (
                f"{req_prof.first_name} {req_prof.last_name}"
                if (
                    req_prof and hasattr(req_prof, "first_name") and req_prof.first_name
                )
                else "Someone"
            )
            notif_service = NotificationService(self.repository.db)
            await notif_service.create_notification(
                user_id=addressee_id,
                title="New Connection Request",
                content=f"{req_name} sent you a connection request.",
                type="connection_request",
            )
        except Exception:
            pass

        # Return fully eagerly loaded connection object to prevent MissingGreenlet in FastAPI serializer
        loaded_conn = await self.repository.get(conn.id)
        return loaded_conn or conn

    async def accept_connection(self, connection_id: int, user_id: int) -> Connection:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.addressee_id != user_id:
            raise ValueError("Not authorized to accept this connection")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Connection is not in a pending state")

        await self.repository.update(conn, {"status": ConnectionStatus.ACCEPTED})
        loaded_conn = await self.repository.get(connection_id)

        # Dispatch real-time confirmation notification to the requester
        try:
            from app.notifications.services.notification import NotificationService
            from app.profiles.repository.profile import ProfileRepository

            prof_repo = ProfileRepository(self.repository.db)
            acceptor_prof = await prof_repo.get_by_user_id(user_id)
            acceptor_name = (
                f"{acceptor_prof.first_name} {acceptor_prof.last_name}".strip()
                if (
                    acceptor_prof
                    and hasattr(acceptor_prof, "first_name")
                    and acceptor_prof.first_name
                )
                else "A campus member"
            )
            notif_service = NotificationService(self.repository.db)
            await notif_service.create_notification(
                user_id=conn.requester_id,
                title="Connection Request Accepted",
                content=f"{acceptor_name} accepted your connection request. You are now connected!",
                type="connection_accepted",
            )
        except Exception as e:
            print(f"Notification error on connection accept: {e}")

        return loaded_conn or conn

    async def reject_connection(self, connection_id: int, user_id: int) -> Connection:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.addressee_id != user_id:
            raise ValueError("Not authorized to reject this connection")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Connection is not in a pending state")

        await self.repository.update(conn, {"status": ConnectionStatus.REJECTED})
        loaded_conn = await self.repository.get(connection_id)
        return loaded_conn or conn

    async def withdraw_connection_request(
        self, connection_id: int, user_id: int
    ) -> bool:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.requester_id != user_id:
            raise ValueError("Not authorized to withdraw this connection request")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Can only withdraw pending requests")

        await self.repository.delete(connection_id)
        return True

    async def list_my_connections(self, user_id: int) -> list[Connection]:
        return await self.repository.get_user_connections(user_id)

    async def list_my_pending_requests(self, user_id: int) -> list[Connection]:
        return await self.repository.get_pending_requests(user_id)

    async def list_my_sent_requests(self, user_id: int) -> list[Connection]:
        return await self.repository.get_sent_pending_requests(user_id)

    async def get_mutual_connections(
        self, user1_id: int, user2_id: int
    ) -> dict[str, any]:
        user1_conns = await self.repository.get_user_connected_user_ids(user1_id)
        user2_conns = await self.repository.get_user_connected_user_ids(user2_id)
        mutual_ids = sorted(list(user1_conns.intersection(user2_conns)))

        return {
            "target_user_id": user2_id,
            "mutual_count": len(mutual_ids),
            "mutual_user_ids": mutual_ids,
        }

    async def get_connection_suggestions(
        self, user_id: int, limit: int = 10
    ) -> list[dict[str, any]]:
        my_connected_ids = await self.repository.get_user_connected_user_ids(user_id)

        # Get existing requests (sent or received)
        pending_incoming = await self.repository.get_pending_requests(user_id)
        pending_sent = await self.repository.get_sent_pending_requests(user_id)

        excluded_user_ids = {user_id}.union(my_connected_ids)
        for req in pending_incoming:
            excluded_user_ids.add(req.requester_id)
        for req in pending_sent:
            excluded_user_ids.add(req.addressee_id)

        # Fetch candidate users (exclude current user, connected users, pending requests, and Super Admin)
        from sqlalchemy import and_, or_
        from app.users.models.role import Role

        stmt = (
            select(User)
            .outerjoin(Role, User.role_id == Role.id)
            .options(selectinload(User.profile))
            .where(
                and_(
                    User.id.not_in(excluded_user_ids),
                    or_(Role.name.is_(None), Role.name != "Super Admin"),
                )
            )
            .limit(50)
        )
        result = await self.db.execute(stmt)
        candidates = result.scalars().all()

        suggestions = []
        for candidate in candidates:
            cand_id = candidate.id
            cand_conns = await self.repository.get_user_connected_user_ids(cand_id)
            mutual_ids = my_connected_ids.intersection(cand_conns)
            mutual_count = len(mutual_ids)

            score = 10 + (mutual_count * 25)
            reason = "Member of campus community"
            if mutual_count > 0:
                reason = (
                    f"{mutual_count} mutual connection{'s' if mutual_count > 1 else ''}"
                )
            elif candidate.profile and candidate.profile.bio:
                reason = "Active student profile"
            elif candidate.profile and candidate.profile.department:
                reason = f"Department: {candidate.profile.department}"

            first_name = candidate.profile.first_name if candidate.profile else None
            last_name = candidate.profile.last_name if candidate.profile else None
            profile_pic = (
                candidate.profile.profile_picture if candidate.profile else None
            )
            dept = candidate.profile.department if candidate.profile else None

            if not first_name or first_name.strip().lower() == "user":
                email_handle = candidate.email.split("@")[0]
                parts = [
                    p.capitalize()
                    for p in email_handle.replace("_", ".").split(".")
                    if p
                ]
                first_name = parts[0] if parts else "Student"
                last_name = " ".join(parts[1:]) if len(parts) > 1 else (last_name or "")

            suggestions.append(
                {
                    "user_id": cand_id,
                    "email": candidate.email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "profile_picture": profile_pic,
                    "department": dept or "Student",
                    "mutual_count": mutual_count,
                    "recommendation_reason": reason,
                    "score": score,
                    "profile": {
                        "first_name": first_name,
                        "last_name": last_name,
                        "profile_picture": profile_pic,
                        "department": dept or "Student",
                    },
                }
            )

        suggestions.sort(key=lambda x: x["score"], reverse=True)
        return suggestions[:limit]
