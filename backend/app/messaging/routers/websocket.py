import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Query

from app.core import security
from app.core.database import SessionLocal
from app.core.exceptions import AuthenticationError
from app.messaging.websocket_manager import manager
from app.messaging.services.message import MessagingService
from app.messaging.repository.conversation import ConversationRepository
from app.messaging.schemas.message import MessageCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["Real-Time Messaging WebSocket"])


async def authenticate_websocket(
    websocket: WebSocket, token: Optional[str]
) -> Optional[int]:
    """
    Authenticate WebSocket connection using JWT token passed in query string or header.
    Returns user_id if valid, None otherwise.
    """
    if not token:
        # Try extracting from query params
        token = websocket.query_params.get("token")

    if not token:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token"
        )
        return None

    try:
        payload = security.decode_token(token, expected_type="access")
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token subject"
            )
            return None
        return int(user_id_str)
    except AuthenticationError as e:
        logger.warning(f"WebSocket auth failed: {e}")
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed"
        )
        return None
    except Exception as e:
        logger.error(f"Unexpected error during WebSocket auth: {e}")
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, reason="Authentication error"
        )
        return None


@router.websocket("/chat")
@router.websocket("")
async def websocket_chat_endpoint(
    websocket: WebSocket, token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time messaging, typing indicators, and presence updates.
    Connect via: ws://domain/api/v1/ws/chat?token=<jwt_token>
    """
    user_id = await authenticate_websocket(websocket, token)
    if not user_id:
        return

    await manager.connect(websocket, user_id)

    try:
        # Send connection confirmation frame
        await websocket.send_json(
            {"type": "connection_established", "user_id": user_id, "status": "online"}
        )

        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            elif event_type == "send_message":
                conversation_id = data.get("conversation_id")
                receiver_id = data.get("receiver_id")
                content = data.get("content")

                if not content or not content.strip():
                    await websocket.send_json(
                        {"type": "error", "message": "Message content cannot be empty"}
                    )
                    continue

                async with SessionLocal() as db:
                    try:
                        service = MessagingService(db)
                        msg_in = MessageCreate(
                            conversation_id=conversation_id,
                            receiver_id=receiver_id,
                            content=content.strip(),
                        )
                        message = await service.send_message(user_id, msg_in)
                        await db.commit()

                        # Fetch conversation participants for broadcasting
                        conv_repo = ConversationRepository(db)
                        conv = await conv_repo.get(message.conversation_id)
                        participant_ids = (
                            [p.user_id for p in conv.participants] if conv else []
                        )

                        # Fallback for direct message if conv participants not loaded
                        if not participant_ids and receiver_id:
                            participant_ids = [user_id, receiver_id]

                        payload = {
                            "type": "new_message",
                            "message": {
                                "id": message.id,
                                "conversation_id": message.conversation_id,
                                "sender_id": message.sender_id,
                                "receiver_id": message.receiver_id,
                                "content": message.content,
                                "created_at": (
                                    message.created_at.isoformat()
                                    if message.created_at
                                    else None
                                ),
                                "is_read": message.is_read,
                            },
                        }

                        # Broadcast to all conversation participants (including sender)
                        await manager.broadcast_to_conversation(
                            payload, participant_ids
                        )

                    except Exception as e:
                        await db.rollback()
                        logger.error(
                            f"Error processing send_message over WebSocket: {e}"
                        )
                        await websocket.send_json({"type": "error", "message": str(e)})

            elif event_type == "typing":
                conversation_id = data.get("conversation_id")
                is_typing = data.get("is_typing", True)

                if conversation_id:
                    async with SessionLocal() as db:
                        conv_repo = ConversationRepository(db)
                        conv = await conv_repo.get(conversation_id)
                        participant_ids = (
                            [p.user_id for p in conv.participants] if conv else []
                        )

                    payload = {
                        "type": "user_typing",
                        "conversation_id": conversation_id,
                        "user_id": user_id,
                        "is_typing": is_typing,
                    }
                    # Broadcast typing status to participants excluding the sender
                    await manager.broadcast_to_conversation(
                        payload, participant_ids, exclude_user_id=user_id
                    )

            elif event_type == "mark_read":
                conversation_id = data.get("conversation_id")
                if conversation_id:
                    async with SessionLocal() as db:
                        try:
                            service = MessagingService(db)
                            count = await service.mark_conversation_as_read(
                                user_id, conversation_id
                            )
                            await db.commit()

                            conv_repo = ConversationRepository(db)
                            conv = await conv_repo.get(conversation_id)
                            participant_ids = (
                                [p.user_id for p in conv.participants] if conv else []
                            )

                            payload = {
                                "type": "messages_read",
                                "conversation_id": conversation_id,
                                "reader_id": user_id,
                                "count": count,
                            }
                            await manager.broadcast_to_conversation(
                                payload, participant_ids
                            )
                        except Exception as e:
                            await db.rollback()
                            logger.error(f"Error marking messages read over WS: {e}")

            else:
                await websocket.send_json(
                    {"type": "error", "message": f"Unknown event type: '{event_type}'"}
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected for user_id={user_id}")
    except Exception as e:
        manager.disconnect(websocket, user_id)
        logger.error(f"WebSocket error for user_id={user_id}: {e}")
