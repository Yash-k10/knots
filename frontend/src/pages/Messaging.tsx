import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Users,
  User as UserIcon,
  Send,
  Smile,
  CheckCheck,
  Clock,
  X,
  MessageSquare,
  Sparkles,
  Check,
} from "lucide-react";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as sendRestMessage,
  getOrCreateDirectConversation,
  createGroupConversation,
  markConversationAsRead,
  fetchCampusUsers,
  Conversation,
  Message,
  CampusUser,
} from "../services/messaging";
import { apiRequest } from "../services/api";
import { wsClient } from "../services/websocket";
import {
  parseDate,
  formatDateDivider,
  formatTime as formatMessageTime,
} from "../utils/date";

const formatFullTooltip = (dateStr: string): string => {
  try {
    const date = parseDate(dateStr);
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

// Categorized Emojis for Popover Picker
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😊",
      "😂",
      "🥰",
      "😎",
      "🤩",
      "😜",
      "🥳",
      "😇",
      "🤖",
      "🤯",
      "😍",
      "🤔",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍",
      "👎",
      "🙌",
      "👏",
      "🤝",
      "✌️",
      "🙏",
      "💡",
      "🔥",
      "❤️",
      "💪",
      "👌",
    ],
  },
  {
    name: "Hearts & Fun",
    emojis: [
      "❤️",
      "💖",
      "💙",
      "💜",
      "🖤",
      "💯",
      "✨",
      "🎉",
      "🌟",
      "💥",
      "🎈",
      "🏆",
    ],
  },
  {
    name: "Campus & Tech",
    emojis: [
      "📚",
      "🎓",
      "🚀",
      "💻",
      "🎯",
      "📌",
      "📝",
      "⚡",
      "☕",
      "📱",
      "📊",
      "🏛️",
    ],
  },
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "💡"];

type ChatFilter = "all" | "direct" | "group";

export default function Messaging() {
  const location = useLocation();
  const targetUserId = (location.state as { targetUserId?: number })
    ?.targetUserId;

  // 1. Current Authenticated User
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role?: { name: string };
  } | null>(null);

  // 2. Conversation & Message States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatFilter, setChatFilter] = useState<ChatFilter>("all");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

  // 3. Emoji Picker & Reactions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys");
  const [messageReactions, setMessageReactions] = useState<
    Record<number, Record<string, number>>
  >({});
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  // 4. New Chat Modal States (Direct & Group)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"direct" | "group">("direct");
  const [campusUsers, setCampusUsers] = useState<CampusUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserRoleFilter, setSelectedUserRoleFilter] = useState("ALL");

  // Group creation fields
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<
    number[]
  >([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch Current User on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userRes = await apiRequest<{
          id: number;
          email: string;
          role?: { name: string };
        }>("/users/me");
        setCurrentUser(userRes);
      } catch (err) {
        console.error("Failed to load current user for messaging:", err);
      }
    };
    loadCurrentUser();
  }, []);

  // Initial Load Conversations & Connect WebSocket
  useEffect(() => {
    loadConversations();
    wsClient.connect();

    const unsubConnection = wsClient.onConnection((status) => {
      setIsWsConnected(status);
    });

    const unsubMessage = wsClient.onMessage((newMsg) => {
      const incoming: Message = {
        ...newMsg,
        status: "delivered",
      };
      setMessages((prevMsgs) => {
        if (
          incoming.conversation_id === activeConvId &&
          !prevMsgs.some((m) => m.id === incoming.id)
        ) {
          return [...prevMsgs, incoming];
        }
        return prevMsgs;
      });

      // Update sidebar conversation list
      setConversations((prevConvs) => {
        const exists = prevConvs.some(
          (c) => c.id === incoming.conversation_id,
        );
        if (!exists) {
          // Re-fetch conversation list to populate full object
          loadConversations();
          return prevConvs;
        }
        return prevConvs.map((conv) => {
          if (conv.id === incoming.conversation_id) {
            return {
              ...conv,
              last_message: incoming,
              updated_at: incoming.created_at,
              unread_count:
                conv.id === activeConvId
                  ? conv.unread_count
                  : conv.unread_count + 1,
            };
          }
          return conv;
        });
      });
    });

    const unsubTyping = wsClient.onTyping(({ conversation_id, is_typing }) => {
      if (conversation_id === activeConvId) {
        setTypingUsers((prev) => ({ ...prev, [conversation_id]: is_typing }));
      }
    });

    return () => {
      unsubConnection();
      unsubMessage();
      unsubTyping();
    };
  }, [activeConvId]);

  // Handle route state targetUserId (e.g. from profiles / directory)
  useEffect(() => {
    if (targetUserId && currentUser && targetUserId !== currentUser.id) {
      handleStartDirectChat(targetUserId);
    }
  }, [targetUserId, currentUser]);

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const loadConversations = async () => {
    try {
      setIsLoadingConvs(true);
      const data = await fetchConversations();
      setConversations(data);
      if (data.length > 0 && activeConvId === null) {
        selectConversation(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const selectConversation = async (convId: number) => {
    setActiveConvId(convId);
    setIsLoadingMsgs(true);
    try {
      const msgs = await fetchConversationMessages(convId);
      const enriched = msgs.map((m) => ({
        ...m,
        status: m.is_read ? ("read" as const) : ("delivered" as const),
      }));
      setMessages(enriched);
      await markConversationAsRead(convId);
      wsClient.markRead(convId);

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)),
      );
    } catch (err) {
      console.error("Failed to load messages for conversation:", err);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || activeConvId === null || !currentUser) return;

    const text = inputContent.trim();
    setInputContent("");
    setShowEmojiPicker(false);

    // Optimistic local message
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: currentUser.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Broadcast stop typing
    wsClient.sendTyping(activeConvId, false);

    // Try WebSocket send first, fallback to REST
    const sentWs = wsClient.sendChatMessage(text, activeConvId);
    if (!sentWs) {
      try {
        const restMsg = await sendRestMessage(text, activeConvId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...restMsg, status: restMsg.is_read ? "read" : "delivered" }
              : m,
          ),
        );
        // Refresh sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, last_message: restMsg, updated_at: restMsg.created_at }
              : c,
          ),
        );
      } catch (err) {
        console.error("Failed to send message via REST fallback:", err);
      }
    } else {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: "delivered" } : m,
          ),
        );
      }, 400);
    }
  };

  const handleInputChange = (val: string) => {
    setInputContent(val);
    if (activeConvId !== null) {
      wsClient.sendTyping(activeConvId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsClient.sendTyping(activeConvId, false);
      }, 2000);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleToggleReaction = (msgId: number, emoji: string) => {
    setMessageReactions((prev) => {
      const currentMap = prev[msgId] || {};
      const currentCount = currentMap[emoji] || 0;
      return {
        ...prev,
        [msgId]: {
          ...currentMap,
          [emoji]: currentCount > 0 ? currentCount - 1 : currentCount + 1,
        },
      };
    });
  };

  // Open New Chat Modal & load campus directory
  const handleOpenNewChatModal = async () => {
    setIsModalOpen(true);
    setModalTab("direct");
    setGroupName("");
    setSelectedGroupMemberIds([]);
    setUserSearchQuery("");
    setIsLoadingUsers(true);
    try {
      const users = await fetchCampusUsers(0, 100);
      // Filter out current user from candidate list
      const otherUsers = users.filter((u) => u.id !== currentUser?.id);
      setCampusUsers(otherUsers);
    } catch (err) {
      console.error("Failed to load campus users for new chat:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Start a Direct 1-on-1 Chat
  const handleStartDirectChat = async (targetId: number) => {
    try {
      const conv = await getOrCreateDirectConversation(targetId);
      setIsModalOpen(false);
      // Add to conversations list if not present
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) {
          return prev;
        }
        return [conv, ...prev];
      });
      selectConversation(conv.id);
    } catch (err) {
      console.error("Failed to initiate direct conversation:", err);
      alert("Could not start conversation. Please try again.");
    }
  };

  // Create a Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    if (selectedGroupMemberIds.length === 0) {
      alert("Please select at least 1 member to create a group.");
      return;
    }

    setIsCreatingGroup(true);
    try {
      const newGroup = await createGroupConversation(
        groupName.trim(),
        selectedGroupMemberIds,
      );
      setConversations((prev) => [newGroup, ...prev]);
      setIsModalOpen(false);
      setGroupName("");
      setSelectedGroupMemberIds([]);
      selectConversation(newGroup.id);
    } catch (err: any) {
      console.error("Failed to create group conversation:", err);
      alert(err.message || "Failed to create group conversation.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleGroupMember = (userId: number) => {
    setSelectedGroupMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Helper to get other user details for a direct conversation
  const getDirectChatInfo = (conv: Conversation) => {
    if (conv.is_group) {
      return {
        title: conv.name || `Group Chat #${conv.id}`,
        subtitle: `${conv.participants?.length || 0} participants`,
        role: "Group",
        initials: (conv.name || "GP").substring(0, 2).toUpperCase(),
        isGroup: true,
      };
    }

    const otherParticipant = conv.participants?.find(
      (p) => p.user_id !== currentUser?.id,
    );
    const email = otherParticipant?.user?.email || `User #${otherParticipant?.user_id || "Direct"}`;
    const cleanName = email.split("@")[0].replace(/[._]/g, " ");
    const roleName = otherParticipant?.user?.role?.name || "Campus Member";

    return {
      title: cleanName,
      email: email,
      subtitle: `${roleName} • ${email}`,
      role: roleName,
      initials: (cleanName || "US").substring(0, 2).toUpperCase(),
      isGroup: false,
    };
  };

  // Filtered Conversations in Sidebar
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const info = getDirectChatInfo(c);
      const matchesSearch =
        info.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (info.email &&
          info.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.last_message?.content &&
          c.last_message.content
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (chatFilter === "direct") return !c.is_group;
      if (chatFilter === "group") return c.is_group;
      return true;
    });
  }, [conversations, searchQuery, chatFilter, currentUser]);

  // Filtered Campus Directory in Modal
  const filteredCampusUsers = useMemo(() => {
    return campusUsers.filter((u) => {
      const matchesSearch = u.email
        .toLowerCase()
        .includes(userSearchQuery.toLowerCase());
      const roleName = u.role?.name || "Member";
      const matchesRole =
        selectedUserRoleFilter === "ALL" ||
        roleName.toLowerCase() === selectedUserRoleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [campusUsers, userSearchQuery, selectedUserRoleFilter]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeConvInfo = activeConv ? getDirectChatInfo(activeConv) : null;

  // Delivery status badge
  const renderDeliveryStatus = (msg: Message) => {
    if (msg.status === "sending") {
      return <Clock className="w-3 h-3 text-slate-300 animate-spin" />;
    }
    if (msg.status === "read" || msg.is_read) {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-400 font-bold" />;
    }
    return <CheckCheck className="w-3.5 h-3.5 text-white/70" />;
  };

  // Role Badge Helper
  const getRoleBadgeStyle = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
      case "super admin":
        return "bg-rose-500/10 text-rose-600 border border-rose-200";
      case "controller":
      case "management":
        return "bg-amber-500/10 text-amber-700 border border-amber-200";
      case "faculty":
        return "bg-purple-500/10 text-purple-700 border border-purple-200";
      case "alumni":
        return "bg-blue-500/10 text-blue-700 border border-blue-200";
      default:
        return "bg-emerald-500/10 text-emerald-700 border border-emerald-200";
    }
  };

  return (
    <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden flex h-[720px] shadow-sm">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR CONVERSATIONS LIST (WhatsApp Style)                            */}
      {/* ========================================================================= */}
      <div className="w-84 sm:w-96 border-r border-[#EAE4F7] bg-[#FAF9FD] flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#EAE4F7] flex justify-between items-center bg-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-[#4B63D2] to-[#7B8FE8] flex items-center justify-center text-white font-bold shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#1E2746]">
                  Messages
                </h3>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isWsConnected
                      ? "bg-emerald-500 ring-2 ring-emerald-200"
                      : "bg-amber-500"
                  }`}
                  title={
                    isWsConnected ? "Live Connected" : "Connecting..."
                  }
                />
              </div>
              <p className="text-[10px] text-[#5851A4] font-medium">
                {currentUser?.email || "Campus Chat"}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewChatModal}
            className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#EAE4F7] bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
            <input
              type="text"
              placeholder="Search chats or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs: All, Direct, Groups */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-1">
            {[
              { key: "all", label: "All" },
              { key: "direct", label: "Direct 1-on-1" },
              { key: "group", label: "Groups" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setChatFilter(tab.key as ChatFilter)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  chatFilter === tab.key
                    ? "bg-[#4B63D2] text-white shadow-sm"
                    : "bg-[#FAF9FD] text-[#5851A4] hover:bg-white hover:text-[#1E2746]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EAE4F7]">
          {isLoadingConvs ? (
            <div className="p-8 text-center text-xs text-[#5851A4] font-medium flex flex-col items-center gap-2">
              <div className="h-5 w-5 border-2 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
              <span>Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5851A4] font-medium space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#EAE4F7]/50 flex items-center justify-center mx-auto text-[#9188BE]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-bold text-[#1E2746]">No conversations yet</p>
              <p className="text-[11px]">
                Click <strong>+ New Chat</strong> to message classmates,
                faculty, or create a group!
              </p>
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isActive = chat.id === activeConvId;
              const info = getDirectChatInfo(chat);
              return (
                <div
                  key={chat.id}
                  onClick={() => selectConversation(chat.id)}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-all ${
                    isActive
                      ? "bg-white border-l-4 border-[#4B63D2] shadow-sm"
                      : "hover:bg-white/80"
                  }`}
                >
                  {/* Chat Avatar */}
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                      info.isGroup
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                        : "bg-[#EAE4F7] text-[#4B63D2] border border-[#D5CBEE]"
                    }`}
                  >
                    {info.isGroup ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      info.initials
                    )}
                  </div>

                  {/* Chat Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold text-[#1E2746] truncate capitalize">
                        {info.title}
                      </h4>
                      {chat.last_message && (
                        <span className="text-[10px] text-[#9188BE] font-medium shrink-0 ml-1">
                          {formatMessageTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${getRoleBadgeStyle(
                          info.role,
                        )}`}
                      >
                        {info.role}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-[#5851A4] truncate font-medium max-w-[200px]">
                        {chat.last_message
                          ? chat.last_message.content
                          : "No messages yet"}
                      </p>
                      {chat.unread_count > 0 && (
                        <span className="bg-[#4B63D2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE CHAT THREAD WINDOW                                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeConv && activeConvInfo ? (
          <>
            {/* Chat Thread Header */}
            <div className="h-16 border-b border-[#EAE4F7] px-6 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-sm ${
                    activeConvInfo.isGroup
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      : "bg-[#EAE4F7] text-[#4B63D2] border border-[#D5CBEE]"
                  }`}
                >
                  {activeConvInfo.isGroup ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    activeConvInfo.initials
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[#1E2746] capitalize">
                      {activeConvInfo.title}
                    </h4>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getRoleBadgeStyle(
                        activeConvInfo.role,
                      )}`}
                    >
                      {activeConvInfo.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5851A4] font-medium truncate max-w-sm">
                    {activeConvInfo.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>

            {/* Message History Feed */}
            <div className="flex-1 p-6 space-y-3.5 overflow-y-auto bg-[#F8F6FD] relative">
              {isLoadingMsgs ? (
                <div className="p-8 text-center text-xs text-[#5851A4] flex flex-col items-center gap-2">
                  <div className="h-5 w-5 border-2 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
                  <span>Loading message thread...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-[#5851A4]">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#EAE4F7] flex items-center justify-center shadow-sm text-[#4B63D2]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2746]">
                      No messages yet
                    </h4>
                    <p className="text-xs text-[#5851A4] max-w-xs mt-1">
                      Say hello to {activeConvInfo.title} to start the
                      conversation!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSentByMe =
                    currentUser && msg.sender_id === currentUser.id;
                  const prevMsg = messages[idx - 1];
                  const currentDateDivider = formatDateDivider(msg.created_at);
                  const prevDateDivider = prevMsg
                    ? formatDateDivider(prevMsg.created_at)
                    : null;
                  const showDateSeparator =
                    currentDateDivider !== prevDateDivider;

                  const reactionsObj = messageReactions[msg.id] || {};
                  const activeReactions = Object.entries(
                    reactionsObj,
                  ).filter(([, count]) => count > 0);

                  // Find sender name for group chats
                  const senderParticipant = activeConv.participants?.find(
                    (p) => p.user_id === msg.sender_id,
                  );
                  const senderEmail =
                    senderParticipant?.user?.email || `User #${msg.sender_id}`;
                  const senderName = senderEmail
                    .split("@")[0]
                    .replace(/[._]/g, " ");

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Date separator divider */}
                      {showDateSeparator && (
                        <div className="flex justify-center my-3">
                          <span className="bg-white border border-[#EAE4F7] text-[#5851A4] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                            {currentDateDivider}
                          </span>
                        </div>
                      )}

                      <div
                        className={`group relative flex gap-2 ${
                          isSentByMe ? "justify-end" : "justify-start"
                        }`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        {/* Avatar for received messages in group chats */}
                        {!isSentByMe && activeConv.is_group && (
                          <div
                            className="h-7 w-7 rounded-xl bg-[#C8B6E2]/40 border border-[#C8B6E2] flex items-center justify-center text-[10px] font-bold text-[#4B63D2] self-end mb-1 capitalize"
                            title={senderEmail}
                          >
                            {senderName.substring(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div className="relative max-w-md">
                          {/* Quick Emoji Reaction Bar (Hover) */}
                          {hoveredMessageId === msg.id && (
                            <div
                              className={`absolute -top-7 ${
                                isSentByMe ? "right-0" : "left-0"
                              } bg-white/95 backdrop-blur border border-[#EAE4F7] rounded-full px-2 py-0.5 flex gap-1 z-20 shadow-md animate-in fade-in duration-150`}
                            >
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() =>
                                    handleToggleReaction(msg.id, emoji)
                                  }
                                  className="hover:scale-125 transition-transform text-xs p-0.5 cursor-pointer"
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Message Bubble (WhatsApp Style) */}
                          <div
                            className={`p-3.5 rounded-2xl text-xs shadow-sm transition-all ${
                              isSentByMe
                                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-tr-none"
                                : "bg-white border border-[#EAE4F7] text-[#1E2746] rounded-tl-none"
                            }`}
                          >
                            {/* Group Sender Label */}
                            {!isSentByMe && activeConv.is_group && (
                              <p className="text-[10px] font-bold text-[#4B63D2] mb-1 capitalize">
                                {senderName}
                              </p>
                            )}

                            <p className="whitespace-pre-wrap leading-relaxed font-medium">
                              {msg.content}
                            </p>

                            <div
                              className={`mt-1.5 text-[9px] flex justify-end items-center gap-1.5 font-medium ${
                                isSentByMe
                                  ? "text-white/80"
                                  : "text-[#9188BE]"
                              }`}
                            >
                              <span title={formatFullTooltip(msg.created_at)}>
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isSentByMe && renderDeliveryStatus(msg)}
                            </div>
                          </div>

                          {/* Reactions Badges */}
                          {activeReactions.length > 0 && (
                            <div
                              className={`flex flex-wrap gap-1 mt-1 ${
                                isSentByMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              {activeReactions.map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() =>
                                    handleToggleReaction(msg.id, emoji)
                                  }
                                  className="bg-white border border-[#EAE4F7] text-[10px] px-2 py-0.5 rounded-full text-[#1E2746] flex items-center gap-1 hover:border-[#4B63D2] transition-all shadow-sm cursor-pointer"
                                >
                                  <span>{emoji}</span>
                                  <span className="font-bold text-[#4B63D2]">
                                    {count}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing Indicator */}
              {activeConvId && typingUsers[activeConvId] && (
                <div className="flex items-center gap-2 text-xs text-[#5851A4] italic font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#4B63D2] animate-ping" />
                  Someone is typing...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-20 right-6 w-72 bg-white border border-[#EAE4F7] rounded-2xl p-3 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex border-b border-[#EAE4F7] pb-2 mb-2 gap-1 overflow-x-auto">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setActiveEmojiCategory(cat.name)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        activeEmojiCategory === cat.name
                          ? "bg-[#4B63D2] text-white shadow-sm"
                          : "text-[#5851A4] hover:bg-[#FAF9FD]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1">
                  {EMOJI_CATEGORIES.find(
                    (c) => c.name === activeEmojiCategory,
                  )?.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="h-8 w-8 text-base flex items-center justify-center rounded-lg hover:bg-[#FAF9FD] hover:scale-110 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-[#EAE4F7] flex gap-2.5 items-center bg-white"
            >
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2.5 rounded-xl text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                  showEmojiPicker ? "bg-[#FAF9FD] text-[#4B63D2]" : ""
                }`}
                title="Choose Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={`Message ${activeConvInfo.title}...`}
                value={inputContent}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/10 font-medium"
              />

              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3E53BE] hover:to-[#4B63D2] disabled:opacity-40 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 text-[#5851A4]">
            <div className="h-16 w-16 rounded-3xl bg-[#FAF9FD] border border-[#EAE4F7] flex items-center justify-center text-[#4B63D2] shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1E2746]">
                Welcome to Campus Messages
              </h3>
              <p className="text-xs text-[#5851A4] max-w-sm mt-1">
                Select a conversation on the left, or click{" "}
                <strong>+ New Chat</strong> to search for classmates, faculty, or
                create a group.
              </p>
            </div>
            <button
              onClick={handleOpenNewChatModal}
              className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start a New Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. NEW CHAT / USER DIRECTORY MODAL (WhatsApp Style)                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E2746]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE4F7] flex items-center justify-between bg-white">
              <div>
                <h3 className="text-base font-black text-[#1E2746]">
                  {modalTab === "direct"
                    ? "Start 1-on-1 Direct Chat"
                    : "Create Campus Group Chat"}
                </h3>
                <p className="text-[11px] text-[#5851A4] font-medium">
                  {modalTab === "direct"
                    ? "Select a student, faculty member, or controller"
                    : "Give your group a name and choose participants"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9188BE] hover:text-[#1E2746] rounded-xl hover:bg-[#FAF9FD] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-[#EAE4F7] bg-[#FAF9FD] p-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTab("direct")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalTab === "direct"
                    ? "bg-white text-[#4B63D2] shadow-sm border border-[#EAE4F7]"
                    : "text-[#5851A4] hover:text-[#1E2746]"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>1-on-1 Direct Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("group")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalTab === "group"
                    ? "bg-white text-[#4B63D2] shadow-sm border border-[#EAE4F7]"
                    : "text-[#5851A4] hover:text-[#1E2746]"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Group Chat</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {modalTab === "group" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE Final Year Projects, Coding Club..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
                  />

                  {selectedGroupMemberIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="text-[11px] font-bold text-[#5851A4] py-1">
                        Selected ({selectedGroupMemberIds.length}):
                      </span>
                      {selectedGroupMemberIds.map((id) => {
                        const userObj = campusUsers.find((u) => u.id === id);
                        return (
                          <span
                            key={id}
                            className="bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                          >
                            <span>
                              {userObj?.email.split("@")[0] || `User #${id}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleGroupMember(id)}
                              className="hover:text-rose-600 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* User Search & Role Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider">
                    {modalTab === "direct"
                      ? "Find Campus Member"
                      : "Select Group Participants"}
                  </label>
                  <span className="text-[10px] text-[#5851A4] font-medium">
                    {filteredCampusUsers.length} members found
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type="text"
                    placeholder="Search by name or @sbjit.edu.in email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2]"
                  />
                </div>

                {/* Role Chips filter */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    "ALL",
                    "Student",
                    "Faculty",
                    "Controller",
                    "Management",
                    "Alumni",
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedUserRoleFilter(role)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                        selectedUserRoleFilter === role
                          ? "bg-[#4B63D2] text-white shadow-sm"
                          : "bg-[#FAF9FD] text-[#5851A4] hover:bg-[#EAE4F7]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Candidates Directory List */}
              <div className="border border-[#EAE4F7] rounded-2xl divide-y divide-[#EAE4F7] max-h-64 overflow-y-auto bg-white">
                {isLoadingUsers ? (
                  <div className="p-6 text-center text-xs text-[#5851A4] flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
                    <span>Loading campus directory...</span>
                  </div>
                ) : filteredCampusUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#5851A4] font-medium">
                    No members match your search query.
                  </div>
                ) : (
                  filteredCampusUsers.map((user) => {
                    const isSelected = selectedGroupMemberIds.includes(user.id);
                    const cleanName = user.email
                      .split("@")[0]
                      .replace(/[._]/g, " ");
                    const roleName = user.role?.name || "Member";

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (modalTab === "direct") {
                            handleStartDirectChat(user.id);
                          } else {
                            toggleGroupMember(user.id);
                          }
                        }}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#4B63D2]/5"
                            : "hover:bg-[#FAF9FD]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-[#EAE4F7] text-[#4B63D2] flex items-center justify-center font-bold text-xs shrink-0 capitalize">
                            {cleanName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#1E2746] truncate capitalize">
                              {cleanName}
                            </h5>
                            <p className="text-[10px] text-[#5851A4] truncate font-medium">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getRoleBadgeStyle(
                              roleName,
                            )}`}
                          >
                            {roleName}
                          </span>

                          {modalTab === "group" ? (
                            <div
                              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[#4B63D2] border-[#4B63D2] text-white"
                                  : "border-[#D5CBEE] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="text-[11px] font-bold text-[#4B63D2] hover:underline"
                            >
                              Chat →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            {modalTab === "group" && (
              <div className="p-4 border-t border-[#EAE4F7] flex items-center justify-between bg-[#FAF9FD]">
                <span className="text-xs text-[#5851A4] font-medium">
                  {selectedGroupMemberIds.length} participant(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#5851A4] hover:bg-white border border-[#D5CBEE] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={
                      isCreatingGroup ||
                      !groupName.trim() ||
                      selectedGroupMemberIds.length === 0
                    }
                    className="bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-40 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCreatingGroup ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    <span>Create Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
