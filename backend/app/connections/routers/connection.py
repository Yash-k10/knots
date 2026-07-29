from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.connections.schemas.connection import (
    ConnectionRequest,
    ConnectionResponse,
)
from app.connections.services.connection import ConnectionService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.post("", response_model=APIResponse[ConnectionResponse])
async def create_connection(
    payload: ConnectionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a connection request to another user."""
    service = ConnectionService(db)
    try:
        conn = await service.request_connection(current_user.id, payload.addressee_id)
        return APIResponse(message="Connection request sent", data=conn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{connection_id}/accept", response_model=APIResponse[ConnectionResponse])
async def accept_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending connection request."""
    service = ConnectionService(db)
    try:
        conn = await service.accept_connection(connection_id, current_user.id)
        return APIResponse(message="Connection accepted", data=conn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{connection_id}/reject", response_model=APIResponse[ConnectionResponse])
async def reject_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending connection request."""
    service = ConnectionService(db)
    try:
        conn = await service.reject_connection(connection_id, current_user.id)
        return APIResponse(message="Connection rejected", data=conn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=APIResponse[list[ConnectionResponse]])
async def list_my_connections(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """List all accepted connections for the current user."""
    service = ConnectionService(db)
    conns = await service.list_my_connections(current_user.id)
    return APIResponse(message="Connections fetched", data=conns)


@router.get("/me/requests", response_model=APIResponse[list[ConnectionResponse]])
async def list_my_pending_requests(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """List all pending incoming connection requests for the current user."""
    service = ConnectionService(db)
    conns = await service.list_my_pending_requests(current_user.id)
    return APIResponse(message="Pending requests fetched", data=conns)
