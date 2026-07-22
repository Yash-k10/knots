from typing import Dict, List, Optional
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages active WebSocket connections for real-time messaging.
    Supports multiple simultaneous socket connections per user (e.g. multi-tab/device).
    """

    def __init__(self) -> None:
        # Maps user_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        """Accept a WebSocket connection and register it under the given user_id."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(
            f"WebSocket connected for user_id={user_id}. Total active sockets: {len(self.active_connections[user_id])}"
        )

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        """Remove a WebSocket connection when client disconnects."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user_id={user_id}")

    async def send_personal_message(self, message: dict, user_id: int) -> None:
        """Deliver a real-time JSON message to all active sockets of a specific user."""
        if user_id not in self.active_connections:
            return

        disconnected_sockets = []
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send WS message to user_id={user_id}: {e}")
                disconnected_sockets.append(connection)

        # Cleanup failed/stale sockets
        for socket in disconnected_sockets:
            self.disconnect(socket, user_id)

    async def broadcast_to_conversation(
        self,
        message: dict,
        participant_ids: List[int],
        exclude_user_id: Optional[int] = None,
    ) -> None:
        """
        Broadcast a real-time JSON event to online participants in a conversation.
        Optionally exclude a user (e.g. the sender).
        """
        for user_id in participant_ids:
            if exclude_user_id is not None and user_id == exclude_user_id:
                continue
            await self.send_personal_message(message, user_id)

    def is_user_online(self, user_id: int) -> bool:
        """Check if a specific user currently has an active WebSocket connection."""
        return (
            user_id in self.active_connections
            and len(self.active_connections[user_id]) > 0
        )

    def get_online_users(self) -> List[int]:
        """Get list of user IDs currently online with active WebSockets."""
        return list(self.active_connections.keys())


# Shared singleton instance
manager = ConnectionManager()
