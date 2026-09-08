import { apiRequest } from "./api";

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  status?: "sending" | "delivered" | "read";
  reactions?: Record<string, number>;
}

export interface ConversationParticipantUser {
  id: number;
  email: string;
  role?: {
    id?: number;
    name: string;
  };
}

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  joined_at: string;
  last_read_at?: string;
  user?: ConversationParticipantUser | null;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  name?: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
}

export interface UnreadSummary {
  total_unread: number;
  unread_by_conversation: Record<number, number>;
}

export interface CampusUser {
  id: number;
  email: string;
  role?: {
    id?: number;
    name: string;
  };
}

export async function fetchConversations(
  skip = 0,
  limit = 50,
): Promise<Conversation[]> {
  return apiRequest<Conversation[]>(
    `/conversations?skip=${skip}&limit=${limit}`,
  );
}

export async function getOrCreateDirectConversation(
  targetUserId: number,
): Promise<Conversation> {
  return apiRequest<Conversation>(`/conversations/direct/${targetUserId}`, {
    method: "POST",
  });
}

export async function createGroupConversation(
  name: string,
  participant_ids: number[],
): Promise<Conversation> {
  return apiRequest<Conversation>("/conversations/group", {
    method: "POST",
    body: JSON.stringify({ name, participant_ids, is_group: true }),
  });
}

export async function fetchConversationMessages(
  conversationId: number,
  skip = 0,
  limit = 50,
): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`,
  );
}

export async function markConversationAsRead(
  conversationId: number,
): Promise<{ marked_read_count: number }> {
  return apiRequest<{ marked_read_count: number }>(
    `/conversations/${conversationId}/read`,
    {
      method: "POST",
    },
  );
}

export async function sendMessage(
  content: string,
  conversationId?: number,
  receiverId?: number,
): Promise<Message> {
  return apiRequest<Message>("/messages", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId,
      receiver_id: receiverId,
      content,
    }),
  });
}

export async function fetchUnreadCount(): Promise<UnreadSummary> {
  return apiRequest<UnreadSummary>("/messages/unread/count");
}

export async function fetchCampusUsers(
  skip = 0,
  limit = 100,
): Promise<CampusUser[]> {
  return apiRequest<CampusUser[]>(`/users?skip=${skip}&limit=${limit}`);
}
