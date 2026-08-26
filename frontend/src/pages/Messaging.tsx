import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as sendRestMessage,
  createGroupConversation,
  markConversationAsRead,
  Conversation,
  Message,
} from "../services/messaging";
import { wsClient } from "../services/websocket";
import { parseDate, formatDateDivider, formatTime as formatMessageTime } from "../utils/date";

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
    name: "Tech & Work",
    emojis: [
      "🚀",
      "💻",
      "🎯",
      "📌",
      "📝",
      "⚡",
      "☕",
      "📱",
      "🔒",
      "📊",
      "🌐",
      "💻",
    ],
  },
];

// Quick Reactions for Message Hover Bar
const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "💡"];

export default function Messaging() {
  const location = useLocation();
  const targetUserId = (location.state as { targetUserId?: number })?.targetUserId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

  // Emoji Picker & Reaction State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys");
  const [messageReactions, setMessageReactions] = useState<
    Record<number, Record<string, number>>
  >({});
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  // Modal State for New Group Chat
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participantIdsStr, setParticipantIdsStr] = useState("");

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

  // 1. Fetch initial conversations & connect WS
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
      setConversations((prevConvs) =>
        prevConvs.map((conv) => {
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
        }),
      );
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

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const loadConversations = async () => {
    try {
      setIsLoadingConvs(true);
      const data = await fetchConversations();
      if (data.length > 0) {
        let foundConvId = data[0].id;
        if (targetUserId) {
          const matching = data.find((c) =>
            c.participants?.some((p) => p.user_id === targetUserId)
          );
          if (matching) foundConvId = matching.id;
        }
        selectConversation(foundConvId);
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
      // Enrich with status
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
    if (!inputContent.trim() || activeConvId === null) return;

    const text = inputContent.trim();
    setInputContent("");
    setShowEmojiPicker(false);

    // Optimistic local message
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: 1, // Active user mock id
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Broadcast stop typing
    wsClient.sendTyping(activeConvId, false);

    // Try WebSocket send first, fallback to REST if disconnected
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
      } catch (err) {
        console.error("Failed to send message via REST fallback:", err);
      }
    } else {
      // Transition optimistic status to delivered after slight delay
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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !participantIdsStr.trim()) return;

    const pIds = participantIdsStr
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((num) => !isNaN(num));

    try {
      const newGroup = await createGroupConversation(groupName.trim(), pIds);
      setConversations((prev) => [newGroup, ...prev]);
      setIsModalOpen(false);
      setGroupName("");
      setParticipantIdsStr("");
      selectConversation(newGroup.id);
    } catch (err) {
      console.error("Failed to create group conversation:", err);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter((c) => {
    const nameStr = c.name || `Conversation #${c.id}`;
    return nameStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Delivery status badge renderer
  const renderDeliveryStatus = (msg: Message) => {
    if (msg.status === "sending") {
      return (
        <span
          title="Sending message..."
          className="text-slate-400 text-[10px] animate-pulse"
        >
          ⏳
        </span>
      );
    }
    if (msg.status === "read" || msg.is_read) {
      return (
        <span
          title={
            msg.read_at ? `Read at ${formatMessageTime(msg.read_at)}` : "Read"
          }
          className="text-indigo-300 font-bold text-[10px]"
        >
          ✓✓
        </span>
      );
    }
    return (
      <span title="Delivered" className="text-slate-400 text-[10px]">
        ✓✓
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden flex h-[680px] shadow-sm">
      {/* Sidebar List */}
      <div className="w-80 border-r border-[#EAE4F7] bg-[#FAF9FD] flex flex-col">
        <div className="p-4 border-b border-[#EAE4F7] flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-[#1E2746]">Messages</h3>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isWsConnected
                  ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm"
                  : "bg-rose-500"
              }`}
              title={isWsConnected ? "Real-Time Connected" : "Disconnected"}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            + New Chat
          </button>
        </div>

        <div className="p-3 border-b border-[#EAE4F7]">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#D5CBEE] rounded-xl px-3 py-2 text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2]"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#EAE4F7]">
          {isLoadingConvs ? (
            <div className="p-6 text-center text-xs text-[#5851A4] font-medium">
              Loading chats...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5851A4] font-medium">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isActive = chat.id === activeConvId;
              const title =
                chat.name ||
                (chat.is_group
                  ? `Group #${chat.id}`
                  : `Direct Chat #${chat.id}`);
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
                  <div className="h-10 w-10 rounded-2xl bg-[#C8B6E2]/30 border border-[#C8B6E2] flex items-center justify-center font-bold text-xs text-[#4B63D2] shrink-0">
                    {title.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-xs font-bold text-[#1E2746] truncate">
                        {title}
                      </h4>
                      {chat.last_message && (
                        <span className="text-[10px] text-[#9188BE] font-medium">
                          {formatMessageTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-[#5851A4] truncate font-medium">
                        {chat.last_message
                          ? chat.last_message.content
                          : "No messages yet"}
                      </p>
                      {chat.unread_count > 0 && (
                        <span className="bg-[#4B63D2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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

      {/* Main Conversation Thread */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeConv ? (
          <>
            <div className="h-14 border-b border-[#EAE4F7] px-6 flex items-center justify-between bg-white">
              <div>
                <h4 className="text-sm font-bold text-[#1E2746]">
                  {activeConv.name ||
                    (activeConv.is_group
                      ? `Group #${activeConv.id}`
                      : `Direct Chat #${activeConv.id}`)}
                </h4>
                <p className="text-[10px] text-[#5851A4] font-medium">
                  {activeConv.participants?.length || 2} participants
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                Active
              </span>
            </div>

            {/* Message History Window */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[#F8F6FD]">
              {isLoadingMsgs ? (
                <div className="p-6 text-center text-xs text-[#5851A4]">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5851A4] font-medium">
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSentByMe = msg.sender_id === 1; // Current active user mock id
                  const prevMsg = messages[idx - 1];
                  const currentDateDivider = formatDateDivider(msg.created_at);
                  const prevDateDivider = prevMsg
                    ? formatDateDivider(prevMsg.created_at)
                    : null;
                  const showDateSeparator =
                    currentDateDivider !== prevDateDivider;

                  const reactionsObj = messageReactions[msg.id] || {};
                  const activeReactions = Object.entries(reactionsObj).filter(
                    ([, count]) => count > 0,
                  );

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
                        className={`group relative flex gap-2.5 ${isSentByMe ? "justify-end" : "justify-start"}`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        {!isSentByMe && (
                          <div className="h-7 w-7 rounded-xl bg-[#C8B6E2]/30 border border-[#C8B6E2] flex items-center justify-center text-[10px] font-bold text-[#4B63D2] self-end mb-1">
                            U{msg.sender_id}
                          </div>
                        )}

                        <div className="relative max-w-md">
                          {/* Quick Emoji Reaction Overlay Bar */}
                          {hoveredMessageId === msg.id && (
                            <div
                              className={`absolute -top-7 ${
                                isSentByMe ? "right-0" : "left-0"
                              } bg-white/95 backdrop-blur border border-[#EAE4F7] rounded-full px-2 py-0.5 flex gap-1 z-10 shadow-md animate-in fade-in duration-150`}
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

                          <div
                            className={`p-3.5 rounded-2xl text-xs ${
                              isSentByMe
                                ? "bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white rounded-tr-none shadow-sm"
                                : "bg-white border border-[#EAE4F7] text-[#1E2746] rounded-tl-none shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed font-medium">
                              {msg.content}
                            </p>
                            <div
                              className={`mt-1 text-[9px] flex justify-end items-center gap-1.5 ${
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

                          {/* Reaction count badges below message bubble */}
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
                                  className="bg-white border border-[#EAE4F7] text-[10px] px-2 py-0.5 rounded-full text-[#1E2746] flex items-center gap-1 hover:border-[#4B63D2] transition-all shadow-sm"
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

            {/* Floating Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-16 right-6 w-72 bg-white border border-[#EAE4F7] rounded-2xl p-3 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex border-b border-[#EAE4F7] pb-2 mb-2 gap-1 overflow-x-auto">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setActiveEmojiCategory(cat.name)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        activeEmojiCategory === cat.name
                          ? "bg-[#4B63D2] text-white"
                          : "text-[#5851A4] hover:bg-[#FAF9FD]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1">
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
              className="p-4 border-t border-[#EAE4F7] flex gap-2.5 items-center bg-white relative"
            >
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2 rounded-xl text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                  showEmojiPicker ? "bg-[#FAF9FD] text-[#4B63D2]" : ""
                }`}
                title="Toggle Emoji Picker"
              >
                😊
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={inputContent}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
              />

              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#5851A4] font-medium">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* New Group Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E2746]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-[#1E2746] mb-4">
              Create Group Conversation
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Study Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-1">
                  Participant User IDs (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2, 3, 4"
                  value={participantIdsStr}
                  onChange={(e) => setParticipantIdsStr(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#5851A4] hover:bg-[#FAF9FD] transition-all font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

