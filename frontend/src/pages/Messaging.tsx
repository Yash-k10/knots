import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  Mic,
  MicOff,
  Paperclip,
  Play,
  Pause,
  Reply,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Share2,
  AlertCircle,
} from "lucide-react";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as sendRestMessage,
  getOrCreateDirectConversation,
  createGroupConversation,
  markConversationAsRead,
  fetchCampusUsers,
  uploadChatAttachment,
  deleteChatMessage,
  Conversation,
  Message,
  CampusUser,
} from "../services/messaging";
import { apiRequest, getMediaUrl } from "../services/api";
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

export const COMMUNICATION_HIERARCHY: Record<string, string[]> = {
  student: ["faculty", "alumni"],
  faculty: ["student", "students", "hod", "controller", "alumni"],
  hod: ["faculty", "controller", "alumni", "tpo", "dean"],
  controller: ["faculty", "hod", "alumni"],
  alumni: ["student", "students", "faculty", "controller", "tpo"],
  tpo: [
    "central admin",
    "admin",
    "super admin",
    "superadmin",
    "management",
    "dean",
    "principal",
    "alumni",
    "hod",
  ],
  dean: ["hod", "tpo", "principal", "ceo"],
  principal: ["tpo", "dean", "ceo"],
  ceo: ["principal"],
  "central admin": [
    "tpo",
    "dean",
    "principal",
    "controller",
    "hod",
    "faculty",
    "alumni",
    "student",
    "students",
    "admin",
    "super admin",
    "superadmin",
    "ceo",
  ],
  admin: [
    "tpo",
    "dean",
    "principal",
    "controller",
    "hod",
    "faculty",
    "alumni",
    "student",
    "students",
    "central admin",
    "super admin",
    "superadmin",
    "ceo",
  ],
  "super admin": ["*"],
  superadmin: ["*"],
  management: ["*"],
};

export const canMessageUser = (
  senderRole?: string,
  recipientRole?: string,
): boolean => {
  if (!senderRole || !recipientRole) return false;
  const sRole = senderRole.toLowerCase().trim();
  const rRole = recipientRole.toLowerCase().trim();
  const allowed = COMMUNICATION_HIERARCHY[sRole] || [];
  if (allowed.includes("*")) return true;
  return allowed.includes(rRole);
};

// --- Custom Audio Voice Note Player Component ---
function VoiceNotePlayer({
  src,
  isSentByMe,
}: {
  src: string;
  isSentByMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const fullUrl = getMediaUrl(src);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error("Play error:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-xl my-1 min-w-[220px] max-w-xs ${
        isSentByMe ? "bg-white/15 text-white" : "bg-[#FAF9FD] text-[#1E2746] border border-[#EAE4F7]"
      }`}
    >
      <audio
        ref={audioRef}
        src={fullUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${
          isSentByMe
            ? "bg-white text-[#4B63D2] hover:bg-white/90"
            : "bg-[#4B63D2] text-white hover:bg-[#3E53BE]"
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#FFD21A] bg-black/20"
        />
        <div className="flex justify-between text-[10px] opacity-80 mt-0.5 font-medium">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Messaging() {
  const location = useLocation();
  const navigate = useNavigate();
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

  // 4. In-Chat Search & Reply States
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // 5. Voice Note Recording States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // 6. File Upload State & Lightbox
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 7. New Chat Modal States (Direct & Group)
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
    if (!inChatSearchQuery) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers, inChatSearchQuery]);

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
    setReplyingToMessage(null);
    setIsSearchInChatOpen(false);
    setInChatSearchQuery("");
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

  const sendMessageContent = async (rawContent: string) => {
    if (!rawContent.trim() || activeConvId === null || !currentUser) return;

    let finalContent = rawContent.trim();
    if (replyingToMessage) {
      const replySender =
        replyingToMessage.sender_id === currentUser.id
          ? "You"
          : activeConv?.participants?.find((p) => p.user_id === replyingToMessage.sender_id)?.user?.email?.split("@")[0] || "User";
      const snippet = replyingToMessage.content.slice(0, 60).replace(/\n/g, " ");
      finalContent = `[Replying to @${replySender}: "${snippet}"]\n${finalContent}`;
      setReplyingToMessage(null);
    }

    // Optimistic local message
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: currentUser.id,
      content: finalContent,
      is_read: false,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    wsClient.sendTyping(activeConvId, false);

    // Try WebSocket send first, fallback to REST
    const sentWs = wsClient.sendChatMessage(finalContent, activeConvId);
    if (!sentWs) {
      try {
        const restMsg = await sendRestMessage(finalContent, activeConvId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...restMsg, status: restMsg.is_read ? "read" : "delivered" }
              : m,
          ),
        );
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;
    const text = inputContent;
    setInputContent("");
    setShowEmojiPicker(false);
    await sendMessageContent(text);
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

  const handleDeleteMessage = async (msgId: number) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteChatMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Could not delete message. Please try again.");
    }
  };

  // --- Voice Note Recording Handlers ---
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Audio recording permission denied or not supported:", err);
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopAndSendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !isRecordingVoice) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
        type: "audio/webm",
      });

      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      try {
        setIsUploadingAttachment(true);
        const attachmentUrl = await uploadChatAttachment(audioFile);
        await sendMessageContent(`[Voice Note] ${attachmentUrl}`);
      } catch (err) {
        console.error("Failed to upload voice note:", err);
        alert("Failed to send voice note. Please try again.");
      } finally {
        setIsUploadingAttachment(false);
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecordingVoice(false);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // --- File & Image Attachment Upload Handlers ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeConvId === null) return;

    try {
      setIsUploadingAttachment(true);
      const attachmentUrl = await uploadChatAttachment(file);
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

      if (isImage) {
        await sendMessageContent(`[Image] ${attachmentUrl}|${file.name}`);
      } else {
        const sizeKb = Math.round(file.size / 1024);
        await sendMessageContent(`[Document] ${attachmentUrl}|${file.name}|${sizeKb} KB`);
      }
    } catch (err) {
      console.error("Attachment upload failed:", err);
      alert("Failed to upload attachment. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

  // Filtered Campus Directory in Modal (Strict Communication Hierarchy)
  const filteredCampusUsers = useMemo(() => {
    const senderRole = currentUser?.role?.name || "Student";

    return campusUsers.filter((u) => {
      const matchesSearch = u.email
        .toLowerCase()
        .includes(userSearchQuery.toLowerCase());
      const roleName = u.role?.name || "Student";
      const matchesRole =
        selectedUserRoleFilter === "ALL" ||
        roleName.toLowerCase() === selectedUserRoleFilter.toLowerCase();

      const isHierarchyPermitted = canMessageUser(senderRole, roleName);
      return matchesSearch && matchesRole && isHierarchyPermitted;
    });
  }, [campusUsers, userSearchQuery, selectedUserRoleFilter, currentUser]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeConvInfo = activeConv ? getDirectChatInfo(activeConv) : null;

  // Filtered Messages in Active Chat when in-chat search is active
  const filteredMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return messages;
    return messages.filter((m) =>
      m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase().trim()),
    );
  }, [messages, inChatSearchQuery]);

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

  // --- Rich Message Body Content Renderer ---
  const renderMessageContent = (content: string, isSentByMe: boolean) => {
    // 1. Quoted Reply Header check
    let replySnippet: { author: string; text: string } | null = null;
    let mainBody = content;

    const replyMatch = content.match(/^\[Replying to @(.*?):\s*"(.*?)"\]\n([\s\S]*)$/);
    if (replyMatch) {
      replySnippet = {
        author: replyMatch[1],
        text: replyMatch[2],
      };
      mainBody = replyMatch[3];
    }

    // 2. Shared Post Card Check
    const postShareMatch = mainBody.match(/^\[Shared Post #(\d+) by (.*?)\]:\s*"(.*?)"\n\nView post:\s*(\/feed#post-\d+)$/);
    if (postShareMatch) {
      const postId = postShareMatch[1];
      const author = postShareMatch[2];
      const snippet = postShareMatch[3];

      return (
        <div>
          {replySnippet && (
            <div className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 ${
              isSentByMe ? "bg-white/10 border-[#FFD21A] text-white/90" : "bg-[#FAF9FD] border-[#4B63D2] text-[#5851A4]"
            }`}>
              <span className="font-bold">Replying to @{replySnippet.author}:</span> {replySnippet.text}
            </div>
          )}

          <div className="bg-white text-[#1E2746] rounded-2xl border border-[#D5CBEE] p-3 shadow-md my-1 space-y-2 max-w-sm">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-1.5">
              <span className="text-[10px] font-black uppercase text-[#4B63D2] flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Shared Feed Post
              </span>
              <span className="text-[10px] font-bold text-[#5851A4]">
                by {author}
              </span>
            </div>
            <p className="text-xs text-[#1E2746] italic line-clamp-3">
              "{snippet}"
            </p>
            <button
              type="button"
              onClick={() => navigate(`/feed#post-${postId}`)}
              className="w-full py-1.5 px-3 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span>View Post in Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // 3. Voice Note Check
    const voiceNoteMatch = mainBody.match(/^\[Voice Note\]\s*(.+)$/);
    if (voiceNoteMatch) {
      return (
        <div>
          {replySnippet && (
            <div className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 ${
              isSentByMe ? "bg-white/10 border-[#FFD21A] text-white/90" : "bg-[#FAF9FD] border-[#4B63D2] text-[#5851A4]"
            }`}>
              <span className="font-bold">Replying to @{replySnippet.author}:</span> {replySnippet.text}
            </div>
          )}
          <VoiceNotePlayer src={voiceNoteMatch[1]} isSentByMe={isSentByMe} />
        </div>
      );
    }

    // 4. Image Attachment Check
    const imageMatch = mainBody.match(/^\[Image\]\s*(.+?)(?:\|(.*))?$/);
    if (imageMatch) {
      const imgUrl = getMediaUrl(imageMatch[1]);
      const imgName = imageMatch[2] || "Image Attachment";

      return (
        <div>
          {replySnippet && (
            <div className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 ${
              isSentByMe ? "bg-white/10 border-[#FFD21A] text-white/90" : "bg-[#FAF9FD] border-[#4B63D2] text-[#5851A4]"
            }`}>
              <span className="font-bold">Replying to @{replySnippet.author}:</span> {replySnippet.text}
            </div>
          )}
          <div className="rounded-xl overflow-hidden border border-black/10 my-1 max-w-xs group relative cursor-pointer" onClick={() => setSelectedLightboxImage(imgUrl || null)}>
            <img
              src={imgUrl}
              alt={imgName}
              className="w-full h-auto max-h-60 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <span className="text-xs font-bold bg-black/60 px-3 py-1 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> View Full Image
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 5. Document Attachment Check
    const docMatch = mainBody.match(/^\[Document\]\s*(.+?)(?:\|(.*?))?(?:\|(.*?))?$/);
    if (docMatch) {
      const docUrl = getMediaUrl(docMatch[1]);
      const docName = docMatch[2] || "Document";
      const docSize = docMatch[3] || "";

      return (
        <div>
          {replySnippet && (
            <div className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 ${
              isSentByMe ? "bg-white/10 border-[#FFD21A] text-white/90" : "bg-[#FAF9FD] border-[#4B63D2] text-[#5851A4]"
            }`}>
              <span className="font-bold">Replying to @{replySnippet.author}:</span> {replySnippet.text}
            </div>
          )}
          <div
            className={`flex items-center justify-between gap-3 p-3 rounded-2xl my-1 max-w-sm ${
              isSentByMe ? "bg-white/15 text-white border border-white/20" : "bg-[#FAF9FD] text-[#1E2746] border border-[#EAE4F7]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#4B63D2]/20 flex items-center justify-center text-[#4B63D2] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{docName}</p>
                {docSize && <p className="text-[10px] opacity-75">{docSize}</p>}
              </div>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={docName}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-transform active:scale-95 ${
                isSentByMe ? "bg-white text-[#4B63D2] hover:bg-white/90" : "bg-[#4B63D2] text-white hover:bg-[#3E53BE]"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    // 6. Regular Text Message
    return (
      <div>
        {replySnippet && (
          <div className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 ${
            isSentByMe ? "bg-white/10 border-[#FFD21A] text-white/90" : "bg-[#FAF9FD] border-[#4B63D2] text-[#5851A4]"
          }`}>
            <span className="font-bold">Replying to @{replySnippet.author}:</span> {replySnippet.text}
          </div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed font-medium">
          {mainBody}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden flex h-[calc(100vh-140px)] min-h-[580px] shadow-sm">
      {/* Hidden File Input for Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. SIDEBAR CONVERSATIONS LIST (WhatsApp Style)                            */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-84 lg:w-96 border-r border-[#EAE4F7] bg-[#FAF9FD] flex flex-col shrink-0 ${
          activeConvId !== null ? "hidden md:flex" : "flex"
        }`}
      >
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] text-[10px] font-bold cursor-pointer"
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
      <div
        className={`flex-1 flex flex-col bg-white relative ${
          activeConvId === null ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConv && activeConvInfo ? (
          <>
            {/* Chat Thread Header */}
            <div className="h-16 border-b border-[#EAE4F7] px-4 sm:px-6 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-xl text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-colors"
                  title="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
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
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-[#1E2746] capitalize truncate">
                      {activeConvInfo.title}
                    </h4>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${getRoleBadgeStyle(
                        activeConvInfo.role,
                      )}`}
                    >
                      {activeConvInfo.role}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#5851A4] font-medium truncate max-w-[180px] sm:max-w-sm">
                    {activeConvInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Chat Action Header buttons (Search In-Thread, Active Status) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSearchInChatOpen((prev) => !prev)}
                  className={`p-2 rounded-xl text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                    isSearchInChatOpen ? "bg-[#FAF9FD] text-[#4B63D2]" : ""
                  }`}
                  title="Search in this conversation"
                >
                  <Search className="w-4 h-4" />
                </button>

                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>

            {/* In-Thread Search Bar Dropdown */}
            {isSearchInChatOpen && (
              <div className="bg-[#FAF9FD] border-b border-[#EAE4F7] px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search keywords in this thread (e.g. SIH, internship, project)..."
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#D5CBEE] focus:border-[#4B63D2] rounded-xl pl-9 pr-8 py-1.5 text-xs font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none"
                  />
                  {inChatSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setInChatSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] text-[10px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {inChatSearchQuery && (
                  <span className="text-[11px] font-bold text-[#5851A4] shrink-0">
                    {filteredMessages.length} match(es)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchInChatOpen(false);
                    setInChatSearchQuery("");
                  }}
                  className="p-1 rounded-lg text-[#9188BE] hover:text-[#1E2746] hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Message History Feed */}
            <div className="flex-1 p-6 space-y-3.5 overflow-y-auto bg-[#F8F6FD] relative">
              {isLoadingMsgs ? (
                <div className="p-8 text-center text-xs text-[#5851A4] flex flex-col items-center gap-2">
                  <div className="h-5 w-5 border-2 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
                  <span>Loading message thread...</span>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-[#5851A4]">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#EAE4F7] flex items-center justify-center shadow-sm text-[#4B63D2]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2746]">
                      {inChatSearchQuery ? "No matching messages found" : "No messages yet"}
                    </h4>
                    <p className="text-xs text-[#5851A4] max-w-xs mt-1">
                      {inChatSearchQuery
                        ? "Try searching with a different keyword."
                        : `Say hello to ${activeConvInfo.title} to start the conversation!`}
                    </p>
                  </div>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isSentByMe = Boolean(
                    currentUser && msg.sender_id === currentUser.id,
                  );
                  const prevMsg = filteredMessages[idx - 1];
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
                          {/* Hover Message Action Bar (Reply, Delete, Quick Reactions) */}
                          {hoveredMessageId === msg.id && (
                            <div
                              className={`absolute -top-7 ${
                                isSentByMe ? "right-0" : "left-0"
                              } bg-white/95 backdrop-blur border border-[#EAE4F7] rounded-full px-2 py-0.5 flex items-center gap-1 z-20 shadow-md animate-in fade-in duration-150`}
                            >
                              {/* Quick Reactions */}
                              {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
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

                              <div className="w-[1px] h-3 bg-[#EAE4F7] mx-0.5" />

                              {/* Reply Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToMessage(msg);
                                  inputRef.current?.focus();
                                }}
                                className="text-[#5851A4] hover:text-[#4B63D2] p-1 rounded-full transition-colors cursor-pointer"
                                title="Reply to message"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button (Only for own messages) */}
                              {isSentByMe && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-[#5851A4] hover:text-rose-600 p-1 rounded-full transition-colors cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
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

                            {renderMessageContent(msg.content, isSentByMe)}

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

            {/* Quoted Message Preview Banner above Input */}
            {replyingToMessage && (
              <div className="bg-[#FAF9FD] border-t border-[#EAE4F7] px-4 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 border-l-4 border-[#4B63D2] pl-2 min-w-0">
                  <Reply className="w-4 h-4 text-[#4B63D2] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#4B63D2] truncate text-[11px]">
                      Replying to {replyingToMessage.sender_id === currentUser?.id ? "Yourself" : "Message"}
                    </p>
                    <p className="text-[#5851A4] truncate text-[10px]">
                      {replyingToMessage.content}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMessage(null)}
                  className="p-1 text-[#9188BE] hover:text-[#1E2746] rounded-lg hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
            <div className="p-3 sm:p-4 border-t border-[#EAE4F7] bg-white">
              {isRecordingVoice ? (
                /* Voice Recording Live Bar */
                <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-700">
                      Recording Voice Note ({recordingSeconds}s)...
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopAndSendVoiceRecording}
                      disabled={isUploadingAttachment}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#4B63D2] hover:bg-[#3E53BE] text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isUploadingAttachment ? "Sending..." : "Send Note"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 items-center"
                >
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                    className="p-2.5 rounded-xl text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                    title="Attach Image or Document"
                  >
                    {isUploadingAttachment ? (
                      <div className="h-5 w-5 border-2 border-[#4B63D2] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>

                  {/* Emoji Picker Button */}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/10 font-medium"
                  />

                  {/* Voice Note Record Trigger Button */}
                  {!inputContent.trim() && (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="p-2.5 rounded-xl text-[#4B63D2] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                      title="Record Voice Note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}

                  {/* Send Button */}
                  {inputContent.trim() && (
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#3E53BE] hover:to-[#4B63D2] px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              )}
            </div>
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
      {/* 3. LIGHTBOX MODAL FOR IMAGES                                              */}
      {/* ========================================================================= */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 bg-[#1E2746]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedLightboxImage}
              alt="Full Preview"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NEW CHAT / USER DIRECTORY MODAL (WhatsApp Style)                       */}
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
                              className="hover:text-rose-600 ml-0.5 cursor-pointer"
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
                  <div className="p-6 text-center text-xs text-[#5851A4] font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>No members match your search query or hierarchy permissions.</span>
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
                              className="text-[11px] font-bold text-[#4B63D2] hover:underline cursor-pointer"
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
