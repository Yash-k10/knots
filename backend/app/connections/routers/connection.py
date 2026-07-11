from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.connections.schemas.connection import ConnectionRequest, ConnectionUpdate, ConnectionResponse
from app.connections.services.connection import ConnectionService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.post("", response_model=APIResponse[ConnectionResponse])
async def create_connection(
    payload: ConnectionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a connection request to another user."""
    service = ConnectionService(db)
    conn = await service.request_connection(current_user.id, payload.addressee_id)
    return APIResponse(message="Connection request sent", data=conn)


@router.put("/{connection_id}", response_model=APIResponse[ConnectionResponse])
async def respond_connection(
    connection_id: int,
    payload: ConnectionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Respond (ACCEPT/REJECT) to a pending connection request."""
    service = ConnectionService(db)
    conn = await service.update_status(connection_id, payload.status)
    return APIResponse(message="Connection status updated", data=conn)
