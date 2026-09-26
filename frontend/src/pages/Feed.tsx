import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Globe,
  Users as UsersIcon,
  Image as ImageIcon,
  X,
  Trash2,
  FileText,
  Maximize2,
  Share2,
  Download,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Edit3,
  Lock,
  Unlock,
  MessageCircle,
  SendHorizontal,
  Search,
  Flag,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";
import { formatTimeAgo, parseDate } from "../utils/date";
import {
  fetchConversations,
  fetchCampusUsers,
  sendMessage as sendDirectMessage,
  getOrCreateDirectConversation,
  Conversation,
  CampusUser,
} from "../services/messaging";

const isDocumentUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split("?")[0];
  return (
    clean.endsWith(".pdf") ||
    clean.endsWith(".doc") ||
    clean.endsWith(".docx") ||
    clean.endsWith(".txt") ||
    clean.endsWith(".xls") ||
    clean.endsWith(".xlsx") ||
    clean.endsWith(".ppt") ||
    clean.endsWith(".pptx")
  );
};

const getFileName = (url: string): string => {
  const parts = url.split("/");
  return parts[parts.length - 1] || "Attachment";
};

const getFileExtension = (url: string): string => {
  const clean = url.split("?")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
};

const renderContentWithLinks = (content: string) => {
  if (!content) return null;
  const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#4B63D2] font-bold hover:underline break-all inline-flex items-center gap-1 bg-[#4B63D2]/10 hover:bg-[#4B63D2]/20 px-2 py-0.5 rounded-lg my-0.5 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 inline shrink-0" />
          <span>{part}</span>
        </a>
      );
    }
    return part;
  });
};

export interface AuthorProfile {
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
}

export interface PostAuthor {
  id: number;
  email: string;
  role?: { id: number; name: string } | null;
  profile?: AuthorProfile | null;
}

export interface CommentAuthor {
  id: number;
  email: string;
  profile?: AuthorProfile | null;
}

export interface CommentResponse {
  id: number;
  post_id: number;
  author_id: number;
  author: CommentAuthor | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PostResponse {
  id: number;
  author_id: number;
  author: PostAuthor | null;
  content: string;
  image_url: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export default function Feed() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [failedAvatars, setFailedAvatars] = useState<Record<number, boolean>>({});

  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role_id?: number;
    role?: { id: number; name: string };
    profile?: AuthorProfile | null;
  } | null>(null);

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "";
  const isSuperAdmin = roleName === "super admin" || roleName === "superadmin";
  const isSuperAdminOrAdmin =
    currentUser?.role_id === 1 ||
    roleName === "admin" ||
    isSuperAdmin;
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(
    null
  );
  const [activePdfModalUrl, setActivePdfModalUrl] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);

  // Pagination state
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  // Bookmarking / Saved Posts state
  const [savedPostIds, setSavedPostIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("knots_saved_posts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Comment Post Selection for Attached Side Drawer
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [cachedCommentPost, setCachedCommentPost] = useState<PostResponse | null>(null);

  const activeCommentPost = posts.find((p) => p.id === activeCommentPostId);

  useEffect(() => {
    if (activeCommentPost) {
      setCachedCommentPost(activeCommentPost);
    }
  }, [activeCommentPost]);

  const displayCommentPost = activeCommentPost || cachedCommentPost;

  const handleSelectPostComments = (postId: number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      if (!commentsByPost[postId]) {
        setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: true }));
        apiRequest<CommentResponse[]>(`/posts/${postId}/comments`)
          .then((comments) => {
            setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
          })
          .catch(() => {
            alert("Failed to load comments.");
          })
          .finally(() => {
            setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: false }));
          });
      }
    }
  };

  const handleToggleBookmark = (postId: number) => {
    setSavedPostIds((prev) => {
      const isSaved = prev.includes(postId);
      const updated = isSaved
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];
      try {
        localStorage.setItem("knots_saved_posts", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save post bookmark:", e);
      }
      return updated;
    });
  };

  // 3-Dots Menu & Comment Locking
  const [activePostMenuId, setActivePostMenuId] = useState<number | null>(null);
  const [lockedCommentPostIds, setLockedCommentPostIds] = useState<
    Record<number, boolean>
  >({});

  const handleToggleLockComments = (postId: number) => {
    setLockedCommentPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
    setActivePostMenuId(null);
  };

  // Edit Post state
  const [editingPost, setEditingPost] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSaveEditPost = async () => {
    if (!editingPost || !editingPost.content.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await apiRequest<PostResponse>(
        `/posts/${editingPost.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ content: editingPost.content.trim() }),
        }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, content: updated.content, updated_at: updated.updated_at }
            : p
        )
      );
      setEditingPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to update post.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Send in Chat state & handlers
  const [shareToChatPost, setShareToChatPost] = useState<PostResponse | null>(
    null
  );
  const [chatConversations, setChatConversations] = useState<Conversation[]>(
    []
  );
  const [chatCampusUsers, setChatCampusUsers] = useState<CampusUser[]>([]);
  const [isLoadingChatRecipients, setIsLoadingChatRecipients] = useState(false);
  const [chatRecipientSearch, setChatRecipientSearch] = useState("");
  const [sendingToChatId, setSendingToChatId] = useState<number | null>(null);
  const [chatShareToast, setChatShareToast] = useState<string | null>(null);

  const handleOpenSendToChat = async (post: PostResponse) => {
    setShareToChatPost(post);
    setChatRecipientSearch("");
    setIsLoadingChatRecipients(true);
    try {
      const [convs, users] = await Promise.all([
        fetchConversations(0, 30).catch(() => []),
        fetchCampusUsers(0, 50).catch(() => []),
      ]);
      setChatConversations(convs);
      setChatCampusUsers(users.filter((u) => u.id !== currentUser?.id));
    } catch (err) {
      console.error("Failed to load chat recipients:", err);
    } finally {
      setIsLoadingChatRecipients(false);
    }
  };

  const handleSendPostToConversation = async (conversationId: number) => {
    if (!shareToChatPost) return;
    setSendingToChatId(conversationId);
    try {
      const snippet =
        shareToChatPost.content.length > 120
          ? `${shareToChatPost.content.slice(0, 120)}...`
          : shareToChatPost.content;
      const authorName =
        shareToChatPost.author?.profile?.first_name ||
        shareToChatPost.author?.email.split("@")[0] ||
        "Campus Member";
      const messageContent = `[Shared Post #${shareToChatPost.id} by ${authorName}]: "${snippet}"\n\nView post: /feed#post-${shareToChatPost.id}`;
      await sendDirectMessage(messageContent, conversationId);
      setChatShareToast("Post shared to chat successfully!");
      setTimeout(() => setChatShareToast(null), 3000);
      setShareToChatPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to share post to conversation.");
    } finally {
      setSendingToChatId(null);
    }
  };

  const handleSendPostToUser = async (userId: number) => {
    if (!shareToChatPost) return;
    setSendingToChatId(userId);
    try {
      const conv = await getOrCreateDirectConversation(userId);
      const snippet =
        shareToChatPost.content.length > 120
          ? `${shareToChatPost.content.slice(0, 120)}...`
          : shareToChatPost.content;
      const authorName =
        shareToChatPost.author?.profile?.first_name ||
        shareToChatPost.author?.email.split("@")[0] ||
        "Campus Member";
      const messageContent = `[Shared Post #${shareToChatPost.id} by ${authorName}]: "${snippet}"\n\nView post: /feed#post-${shareToChatPost.id}`;
      await sendDirectMessage(messageContent, conv.id);
      setChatShareToast("Post shared to chat successfully!");
      setTimeout(() => setChatShareToast(null), 3000);
      setShareToChatPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to share post to user.");
    } finally {
      setSendingToChatId(null);
    }
  };

  // Close post menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        activePostMenuId !== null &&
        !(e.target as HTMLElement).closest(".post-menu-container")
      ) {
        setActivePostMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activePostMenuId]);

  // Post Reporting state & handlers
  const [reportingPost, setReportingPost] = useState<PostResponse | null>(null);
  const [reportCategory, setReportCategory] = useState("Inappropriate Content / Code of Conduct");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  const handleOpenReportModal = (post: PostResponse) => {
    setReportingPost(post);
    setReportCategory("Inappropriate Content / Code of Conduct");
    setReportDetails("");
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    setIsSubmittingReport(true);
    try {
      const fullReason = `${reportCategory}${reportDetails.trim() ? `: ${reportDetails.trim()}` : ""}`;
      try {
        await apiRequest(`/posts/${reportingPost.id}/flag`, {
          method: "POST",
          body: JSON.stringify({ reason: fullReason }),
        });
      } catch (err) {
        console.warn("Backend flag API warning:", err);
      }

      const authorDept =
        reportingPost.author?.profile?.department ||
        "Artificial Intelligence & Machine Learning";

      const newReportItem = {
        id: Date.now(),
        postId: reportingPost.id,
        authorName:
          `${reportingPost.author?.profile?.first_name || ""} ${reportingPost.author?.profile?.last_name || ""}`.trim() ||
          reportingPost.author?.email.split("@")[0] ||
          "Campus Member",
        authorRole: reportingPost.author?.role?.name || "STUDENT",
        authorEmail: reportingPost.author?.email || "",
        department: authorDept,
        content: reportingPost.content,
        imageUrl: reportingPost.image_url,
        likes: reportingPost.likes_count || 0,
        commentsCount: reportingPost.comments_count || 0,
        reportedBy:
          `${currentUser?.profile?.first_name || ""} ${currentUser?.profile?.last_name || ""}`.trim() ||
          currentUser?.email.split("@")[0] ||
          "Campus User",
        reporterRole: currentUser?.role?.name || "STUDENT",
        reporterEmail: currentUser?.email || "",
        reportReason: reportCategory,
        reportDetails: reportDetails.trim(),
        reportedAt: "Just now",
        status: "PENDING" as const,
      };

      try {
        const stored = localStorage.getItem("KNOTS_REPORTED_POSTS");
        const parsed = stored ? JSON.parse(stored) : [];
        const updated = [newReportItem, ...parsed.filter((r: any) => r.postId !== reportingPost.id)];
        localStorage.setItem("KNOTS_REPORTED_POSTS", JSON.stringify(updated));
      } catch {}

      window.dispatchEvent(
        new CustomEvent("knots-post-reported", { detail: newReportItem })
      );

      setReportSuccessToast(`Post reported to ${authorDept} Controller for safety review.`);
      setTimeout(() => setReportSuccessToast(null), 4000);
      setReportingPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to submit post report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Real-time listener for posts deleted by Department Controller
  useEffect(() => {
    const handlePostDeleted = (event: any) => {
      const deletedId = event.detail?.postId;
      if (deletedId) {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
      }
    };
    window.addEventListener("knots-post-deleted", handlePostDeleted);
    return () => window.removeEventListener("knots-post-deleted", handlePostDeleted);
  }, []);

  // Comments and Inputs State indexed by postId
  const [commentsByPost, setCommentsByPost] = useState<
    Record<number, CommentResponse[]>
  >({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState<
    Record<number, boolean>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>(
    {}
  );
  const [submittingCommentByPost, setSubmittingCommentByPost] = useState<
    Record<number, boolean>
  >({});
  const [likingPostIds, setLikingPostIds] = useState<Record<number, boolean>>({});

  const observerTarget = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const [newIncomingPosts, setNewIncomingPosts] = useState<PostResponse[]>([]);

  // Periodic interval to update relative timestamps live every 30s
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Background polling for real-time post discovery across users (LinkedIn Style)
  useEffect(() => {
    if (posts.length === 0) return;

    const pollTimer = setInterval(async () => {
      try {
        const latest = await apiRequest<PostResponse[]>(
          "/posts/feed?skip=0&limit=5"
        );
        if (Array.isArray(latest) && latest.length > 0) {
          const currentTopId = posts[0]?.id || 0;
          const freshPosts = latest.filter(
            (p) =>
              p.id > currentTopId &&
              !posts.some((existing) => existing.id === p.id)
          );
          if (freshPosts.length > 0) {
            setNewIncomingPosts(freshPosts);
          }
        }
      } catch (err) {
        // Silently skip poll error
      }
    }, 12000);

    return () => clearInterval(pollTimer);
  }, [posts]);

  const handleApplyNewPosts = () => {
    if (newIncomingPosts.length > 0) {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueIncoming = newIncomingPosts.filter(
          (p) => !existingIds.has(p.id)
        );
        return [...uniqueIncoming, ...prev].sort((a, b) => parseDate(b.created_at).getTime() - parseDate(a.created_at).getTime());
      });
      setNewIncomingPosts([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fetch initial feed posts
  const fetchFeed = async (reset = false) => {
    const currentSkip = reset ? 0 : skip;
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await apiRequest<PostResponse[]>(
        `/posts/feed?skip=${currentSkip}&limit=${LIMIT}`
      );

      if (reset) {
        setPosts(response.sort((a, b) => parseDate(b.created_at).getTime() - parseDate(a.created_at).getTime()));
        setSkip(LIMIT);
      } else {
        setPosts((prev) => [...prev, ...response].sort((a, b) => parseDate(b.created_at).getTime() - parseDate(a.created_at).getTime()));
        setSkip((prev) => prev + LIMIT);
      }

      if (response.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve the discussion feed.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest<{
        id: number;
        email: string;
        role_id?: number;
        role?: { id: number; name: string };
      }>("/users/me");
      setCurrentUser(response);
    } catch (err) {
      console.error("Failed to retrieve current user info:", err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    const isOwner = post?.author_id === currentUser?.id;
    const confirmMsg = isSuperAdmin
      ? "⚡ Super Admin Action: Are you sure you want to permanently remove this post across the platform?"
      : isSuperAdminOrAdmin && !isOwner
      ? "🛡️ Admin Action: Are you sure you want to remove this user's post?"
      : "Are you sure you want to delete your post?";

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await apiRequest(`/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      alert(err.message || "Failed to delete post.");
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await apiRequest(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete comment.");
    }
  };

  const handleSharePost = (post: PostResponse) => {
    const shareUrl = `${window.location.origin}/feed#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

  // Silent background sync for latest posts from other users in real time
  const syncLatestPosts = async () => {
    try {
      const latestPosts = await apiRequest<PostResponse[]>(
        `/posts/feed?skip=0&limit=15`
      );
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newIncoming = latestPosts.filter((p) => !existingIds.has(p.id));
        if (newIncoming.length > 0) {
          return [...newIncoming, ...prev];
        }
        // Also update likes/comments count for existing posts
        return prev.map((p) => {
          const updated = latestPosts.find((u) => u.id === p.id);
          if (updated) {
            return {
              ...p,
              likes_count: updated.likes_count,
              comments_count: updated.comments_count,
              is_liked: updated.is_liked,
            };
          }
          return p;
        });
      });
    } catch {
      // Silent in background sync
    }
  };

  useEffect(() => {
    fetchFeed(true);
    fetchCurrentUser();

    // Auto-sync feed every 6 seconds for real-time post & media visibility across users
    const interval = setInterval(() => {
      syncLatestPosts();
    }, 6000);

    const handlePostCreated = (e: any) => {
      if (e.detail) {
        setPosts((prev) => [e.detail, ...prev]);
      } else {
        fetchFeed(true);
      }
    };
    const handleRefreshFeed = () => fetchFeed(true);

    window.addEventListener("post-created", handlePostCreated);
    window.addEventListener("refresh-feed", handleRefreshFeed);

    return () => {
      clearInterval(interval);
      window.removeEventListener("post-created", handlePostCreated);
      window.removeEventListener("refresh-feed", handleRefreshFeed);
    };
  }, []);



  // Infinite Scroll logic using Intersection Observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, loading, skip]);

  // Like / Unlike action with debounce protection
  const handleLikeToggle = async (
    postId: number,
    isCurrentlyLiked: boolean
  ) => {
    if (likingPostIds[postId]) return;
    setLikingPostIds((prev) => ({ ...prev, [postId]: true }));

    // Optimistic Update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked
              ? Math.max(0, post.likes_count - 1)
              : post.likes_count + 1,
          };
        }
        return post;
      })
    );

    try {
      if (isCurrentlyLiked) {
        await apiRequest(`/posts/${postId}/like`, { method: "DELETE" });
      } else {
        await apiRequest(`/posts/${postId}/like`, { method: "POST" });
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.status === 404) {
        return;
      }
      // Revert on unexpected failure
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: isCurrentlyLiked,
              likes_count: isCurrentlyLiked
                ? post.likes_count + 1
                : Math.max(0, post.likes_count - 1),
            };
          }
          return post;
        })
      );
    } finally {
      setLikingPostIds((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Add a new comment
  const handleAddComment = async (e: React.FormEvent, postId: number) => {
    e.preventDefault();
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setSubmittingCommentByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await apiRequest<CommentResponse>(
        `/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

      // Update comment count on post
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return { ...post, comments_count: post.comments_count + 1 };
          }
          return post;
        })
      );
    } catch (err: any) {
      alert(err.message || "Failed to submit comment.");
    } finally {
      setSubmittingCommentByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Helper formatting functions
  const getInitials = (email: string | undefined) => {
    if (!email) return "?";
    const parts = email.split("@")[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getEmailPrefix = (email?: string) => {
    if (!email) return "Campus Member";
    const handle = email.split("@")[0];
    const clean = handle
      .replace(/[_.-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return clean || handle;
  };

  const hasInfinityBadge = (email?: string) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return (
      lower.includes("dean") ||
      lower.includes("prof") ||
      lower.includes("admin") ||
      lower.includes("lead") ||
      lower.includes("yashkapse")
    );
  };



  return (
    <div className="w-full">
      <div className="w-full flex justify-center items-start">
        {/* Main Feed Stream - Slides left smoothly with spring bezier when comment panel is opened */}
        <div
          className={`shrink-0 w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] space-y-6 ${
            activeCommentPostId
              ? "lg:max-w-[580px] xl:max-w-[660px]"
              : "max-w-2xl xl:max-w-3xl"
          }`}
        >
          {/* Real-time New Posts Discovery Banner (LinkedIn Style) */}
          {newIncomingPosts.length > 0 && (
            <div className="flex justify-center sticky top-20 z-20 py-2">
              <button
                type="button"
                onClick={handleApplyNewPosts}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5851A4] to-[#4B63D2] text-white rounded-full font-bold text-xs shadow-xl shadow-[#4B63D2]/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
              >
                <ArrowUp className="w-4 h-4 text-emerald-300" />
                <span>
                  {newIncomingPosts.length} new{" "}
                  {newIncomingPosts.length === 1 ? "post" : "posts"} in campus
                  feed • Click to view
                </span>
              </button>
            </div>
          )}

          {/* Main Feed Posts List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-4 bg-white rounded-2xl sm:rounded-3xl border border-[#EAE4F7]">
              <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
              <p className="text-[#5851A4] text-xs sm:text-sm font-semibold">
                Gathering latest campus discussions...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-[#1E2746] font-bold text-sm sm:text-base">
                Error Loading Feed
              </h3>
              <p className="text-[#5851A4] text-xs sm:text-sm max-w-md mx-auto font-medium">
                {error}
              </p>
              <button
                onClick={() => fetchFeed(true)}
                className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-[#EAE4F7] rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center space-y-4 shadow-sm">
              <MessageSquare className="w-12 h-12 text-[#B9B1D9] mx-auto" />
              <h3 className="text-[#1E2746] font-bold text-base sm:text-lg">No posts yet</h3>
              <p className="text-[#5851A4] text-xs sm:text-sm max-w-md mx-auto font-medium">
                The campus discussions are quiet. Be the first to share an update,
                study material, or project demo with your peers!
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {posts.map((post) => {
                  const isSaved = savedPostIds.includes(post.id);
                  const isCommentsLocked = !!lockedCommentPostIds[post.id];
                  const isAuthorOrAdmin =
                    isSuperAdminOrAdmin ||
                    roleName === "controller" ||
                    currentUser?.email?.toLowerCase().includes("controller") ||
                    post.author_id === currentUser?.id;
                  const isMenuOpen = activePostMenuId === post.id;

                  return (
                    <article
                      key={post.id}
                      id={`post-${post.id}`}
                      className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 transition-all duration-300 shadow-sm ${
                        activeCommentPostId === post.id
                          ? "border-[#4B63D2] ring-2 ring-[#4B63D2]/25 shadow-md"
                          : "border-[#EAE4F7] hover:border-[#D5CBEE] hover:shadow-md"
                      }`}
                    >
                      {/* Card Header: Author Profile Info */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={
                            post.author?.id
                              ? `/profile/${post.author.id}`
                              : "/profile"
                          }
                          className="flex items-center gap-3 group/author cursor-pointer"
                        >
                          {getMediaUrl(post.author?.profile?.profile_picture) &&
                          !failedAvatars[post.id] ? (
                            <img
                              src={getMediaUrl(
                                post.author?.profile?.profile_picture
                              )}
                              alt="Author Avatar"
                              onError={() =>
                                setFailedAvatars((prev) => ({
                                  ...prev,
                                  [post.id]: true,
                                }))
                              }
                              className="h-11 w-11 rounded-2xl object-cover border border-[#EAE4F7] shadow-sm group-hover/author:border-[#4B63D2] transition-colors"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#4B63D2]/20">
                              {getInitials(post.author?.email)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-[#1E2746] group-hover/author:text-[#4B63D2] transition-colors flex items-center gap-1.5">
                                <span>
                                  {post.author?.profile?.first_name ||
                                  post.author?.profile?.last_name
                                    ? `${
                                        post.author.profile.first_name || ""
                                      } ${
                                        post.author.profile.last_name || ""
                                      }`.trim()
                                    : getEmailPrefix(post.author?.email)}
                                </span>
                                {hasInfinityBadge(post.author?.email) && (
                                  <img
                                    src="/infinity-badge.png"
                                    className="h-4 w-4 object-contain inline-block ml-0.5 drop-shadow-sm"
                                    alt="Infinity Badge"
                                    title="Verified Campus Distinction / Leadership Position"
                                  />
                                )}
                              </h4>
                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  post.author?.email?.includes("alumni")
                                    ? "bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200 text-purple-800 shadow-xs flex items-center gap-1"
                                    : post.author?.email?.includes("prof")
                                    ? "bg-blue-50 border border-blue-200 text-blue-700"
                                    : "bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2]"
                                }`}
                              >
                                {post.author?.email?.includes("alumni") ? (
                                  <>
                                    <span>🎓</span>
                                    <span>Alumni • SBJIT</span>
                                  </>
                                ) : post.author?.email?.includes("prof") ? (
                                  "Faculty"
                                ) : (
                                  "Student"
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <p className="text-xs text-[#5851A4] font-semibold">
                                {formatTimeAgo(post.created_at)}
                              </p>
                              {post.author?.profile?.department && (
                                <>
                                  <span className="text-[#C8B6E2] text-[10px]">
                                    •
                                  </span>
                                  <span className="text-xs text-[#5851A4] font-medium">
                                    {post.author.profile.department}
                                  </span>
                                </>
                              )}

                            </div>
                          </div>
                        </Link>

                        {/* Top Action Buttons (3-Dots Menu, Share & Bookmark) */}
                        <div className="flex items-center gap-1 relative post-menu-container">
                          {/* 3-Dots Dropdown Trigger */}
                          <button
                            onClick={() =>
                              setActivePostMenuId(isMenuOpen ? null : post.id)
                            }
                            title="Post Options"
                            className="p-2 rounded-xl text-[#9188BE] hover:text-[#1E2746] hover:bg-[#FAF9FD] transition-all cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* 3-Dots Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white border border-[#EAE4F7] rounded-2xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-[#FAF9FD]">
                              {/* Edit Post (Author only) */}
                              {post.author_id === currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPost({
                                      id: post.id,
                                      content: post.content,
                                    });
                                    setActivePostMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#1E2746] hover:bg-[#FAF9FD] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#4B63D2]" />
                                  <span>Edit Post</span>
                                </button>
                              )}

                              {/* Toggle Comments Lock (Author or Admin) */}
                              {isAuthorOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleLockComments(post.id)
                                  }
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#1E2746] hover:bg-[#FAF9FD] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  {isCommentsLocked ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Turn On Comments</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Turn Off Comments</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Bookmark / Save Post */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleBookmark(post.id);
                                  setActivePostMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#1E2746] hover:bg-[#FAF9FD] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                {isSaved ? (
                                  <>
                                    <BookmarkCheck className="w-3.5 h-3.5 text-[#4B63D2]" />
                                    <span>Remove Bookmark</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="w-3.5 h-3.5 text-[#5851A4]" />
                                    <span>Save Post</span>
                                  </>
                                )}
                              </button>

                              {/* Report Post (Available to everyone) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePostMenuId(null);
                                  handleOpenReportModal(post);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Flag className="w-3.5 h-3.5 text-amber-600" />
                                <span>Report Post</span>
                              </button>

                              {/* Delete Post (Author or Admin) */}
                              {isAuthorOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePostMenuId(null);
                                    handleDeletePost(post.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Post</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body: Post Text Content with clickable link rendering */}
                      <div className="text-[#1E2746] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium pt-1">
                        {renderContentWithLinks(post.content)}
                      </div>

                      {/* Card Body: Attachment (Image, PDF/DOCX Document) */}
                      {post.image_url &&
                        (isDocumentUrl(post.image_url) ? (
                          <div className="my-3 p-4 sm:p-5 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#4B63D2]/40 transition-all shadow-xs">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20 flex items-center justify-center shrink-0 font-black text-xs uppercase tracking-wider shadow-xs">
                                {getFileExtension(post.image_url) === "PDF" ? (
                                  <FileText className="w-6 h-6 text-rose-500" />
                                ) : (
                                  <FileSpreadsheet className="w-6 h-6 text-[#4B63D2]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-[#1E2746] truncate">
                                  {getFileName(post.image_url)}
                                </p>
                                <span className="text-[11px] font-semibold text-[#5851A4]">
                                  Verified Document Attachment •{" "}
                                  {getFileExtension(post.image_url)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              {/* In-app Preview Button for PDFs */}
                              {getFileExtension(post.image_url) === "PDF" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivePdfModalUrl({
                                      url: getMediaUrl(post.image_url) || "",
                                      name: getFileName(post.image_url || ""),
                                    })
                                  }
                                  className="px-3.5 py-2 bg-white hover:bg-[#FAF9FD] text-[#4B63D2] border border-[#D5CBEE] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                              )}

                              {/* Direct Download/View in Tab Button */}
                              <a
                                href={getMediaUrl(post.image_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl shadow-md shadow-[#4B63D2]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-[#FFD21A]" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ) : !failedImages[post.id] ? (
                          <div
                            onClick={() =>
                              setActiveLightboxImage(
                                getMediaUrl(post.image_url) ?? null
                              )
                            }
                            className="relative rounded-2xl overflow-hidden border border-[#EAE4F7] bg-[#FAF9FD] my-2 cursor-pointer group hover:opacity-95 transition-all flex items-center justify-center p-1"
                          >
                            <img
                              src={getMediaUrl(post.image_url)}
                              alt="Post attachment"
                              className="w-auto max-w-full max-h-[360px] sm:max-h-[400px] object-contain rounded-xl shadow-xs"
                              loading="lazy"
                              onError={() => {
                                setFailedImages((prev) => ({
                                  ...prev,
                                  [post.id]: true,
                                }));
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center pointer-events-none">
                              <span className="opacity-0 group-hover:opacity-100 bg-[#1E2746]/90 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg transition-opacity flex items-center gap-1.5">
                                <Maximize2 className="w-3.5 h-3.5 text-[#FFD21A]" />{" "}
                                Click to view full image
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="my-2 p-3.5 rounded-2xl bg-[#FAF9FD] border border-[#EAE4F7] flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-5 h-5 text-[#4B63D2]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1E2746] truncate">
                                  {getFileName(post.image_url)}
                                </p>
                                <span className="text-[10px] font-semibold text-[#5851A4]">
                                  Image Attachment
                                </span>
                              </div>
                            </div>
                            <a
                              href={getMediaUrl(post.image_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                          </div>
                        ))}

                      {/* Card Actions: Likes, Comments, Bookmark, Send to Chat & Share */}
                      <div className="flex items-center justify-between border-t border-[#EAE4F7] pt-3.5 text-xs font-semibold flex-wrap gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {/* Like Button */}
                          <button
                            onClick={() =>
                              handleLikeToggle(post.id, post.is_liked)
                            }
                            className={`flex items-center gap-1.5 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-[#FAF9FD] cursor-pointer ${
                              post.is_liked
                                ? "text-rose-500 font-bold bg-rose-50"
                                : "text-[#5851A4] hover:text-[#1E2746]"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                post.is_liked
                                  ? "fill-rose-500 text-rose-500"
                                  : ""
                              }`}
                            />
                            <span>
                              {post.likes_count}{" "}
                              {post.likes_count === 1 ? "Like" : "Likes"}
                            </span>
                          </button>

                          {/* Comment Toggle Button */}
                          <button
                            onClick={() => handleSelectPostComments(post.id)}
                            className={`flex items-center gap-1.5 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-[#FAF9FD] cursor-pointer ${
                              activeCommentPostId === post.id
                                ? "text-[#4B63D2] font-bold bg-[#4B63D2]/15 ring-1 ring-[#4B63D2]/30"
                                : "text-[#5851A4] hover:text-[#1E2746]"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>
                              {post.comments_count}{" "}
                              {post.comments_count === 1
                                ? "Comment"
                                : "Comments"}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Bookmark Button */}
                          <button
                            onClick={() => handleToggleBookmark(post.id)}
                            title={isSaved ? "Saved" : "Save post"}
                            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                              isSaved
                                ? "text-[#4B63D2] font-bold bg-[#4B63D2]/10"
                                : "text-[#5851A4] hover:text-[#4B63D2] hover:bg-[#FAF9FD]"
                            }`}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 fill-[#4B63D2] text-[#4B63D2]" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                              {isSaved ? "Saved" : "Save"}
                            </span>
                          </button>

                          {/* Send in Chat Button */}
                          <button
                            onClick={() => handleOpenSendToChat(post)}
                            title="Send post directly in Messages"
                            className="flex items-center gap-1 text-[#5851A4] hover:text-[#4B63D2] font-bold py-1.5 px-2.5 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4 text-[#4B63D2]" />
                            <span className="hidden sm:inline">
                              Send in Chat
                            </span>
                          </button>

                          {/* Copy Link / Share Button */}
                          <button
                            onClick={() => handleSharePost(post)}
                            className="flex items-center gap-1 text-[#5851A4] hover:text-[#4B63D2] font-bold py-1.5 px-2.5 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer relative"
                          >
                            {copiedPostId === post.id ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                            <span>Share</span>
                            {copiedPostId === post.id && (
                              <span className="absolute -top-7 right-0 bg-[#1E2746] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                                Link Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

              {/* Observer Sentinel Element for Infinite Scroll */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-6">
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-[#4B63D2] text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading more discussions...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => fetchFeed(false)}
                      className="px-5 py-2.5 bg-white border border-[#EAE4F7] hover:bg-[#FAF9FD] rounded-xl text-xs text-[#5851A4] font-bold transition-all hover:text-[#1E2746] shadow-sm cursor-pointer"
                    >
                      Load More Posts
                    </button>
                  )}
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="text-center py-6 text-xs text-[#5851A4] font-semibold">
                  🎉 You're all caught up with the campus feed!
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ATTACHED SLIDING COMMENT PANEL (Attached to right border of feed)         */}
        {/* ========================================================================= */}
        {displayCommentPost && (
          <>
            {/* Desktop Attached Right-Hand Panel with Smooth Premium Transition */}
            <div
              className={`hidden lg:block shrink-0 sticky top-24 z-20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                activeCommentPostId
                  ? "w-[380px] xl:w-[420px] opacity-100 translate-x-0 ml-4 lg:ml-6"
                  : "w-0 opacity-0 translate-x-8 ml-0 pointer-events-none"
              }`}
            >
              <aside className="w-[380px] xl:w-[420px] bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl shadow-xl flex flex-col h-[calc(100vh-220px)] max-h-[calc(100dvh-220px)] min-h-[380px] overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between bg-[#FAF9FD] dark:bg-[#0F172A] shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9] flex items-center gap-2">
                        <span>Comments</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#4B63D2] text-white">
                          {displayCommentPost.comments_count}
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8] font-semibold truncate">
                        {displayCommentPost.author?.profile?.first_name || displayCommentPost.author?.email.split("@")[0]}'s post
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveCommentPostId(null)}
                    title="Close comments"
                    className="p-1.5 rounded-xl text-[#9188BE] hover:text-[#1E2746] hover:bg-[#EAE4F7] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Snippet Preview */}
                <div className="p-3 mx-4 mt-3 bg-[#FAF9FD] dark:bg-[#1E293B]/70 border border-[#EAE4F7] dark:border-[#334155] rounded-2xl text-xs space-y-1 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#4B63D2]">
                    <span>Post Snippet</span>
                    <span>•</span>
                    <span className="text-[#5851A4] dark:text-[#94A3B8] font-normal">{formatTimeAgo(displayCommentPost.created_at)}</span>
                  </div>
                  <p className="text-[#1E2746] dark:text-[#F1F5F9] font-medium line-clamp-2">
                    {displayCommentPost.content}
                  </p>
                </div>

                {/* Scrollable Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingCommentsByPost[displayCommentPost.id] ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-xs text-[#5851A4]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#4B63D2]" />
                      <span>Loading comments...</span>
                    </div>
                  ) : !commentsByPost[displayCommentPost.id] || commentsByPost[displayCommentPost.id].length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <MessageSquare className="w-8 h-8 text-[#C8B6E2] mx-auto" />
                      <p className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">No comments yet</p>
                      <p className="text-[11px] text-[#5851A4] dark:text-[#94A3B8]">Be the first to join the conversation!</p>
                    </div>
                  ) : (
                    commentsByPost[displayCommentPost.id].map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-[#FAF9FD] dark:bg-[#1E293B]/60 rounded-2xl p-3 border border-[#EAE4F7] dark:border-[#334155] text-xs space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={comment.author_id ? `/profile/${comment.author_id}` : "/profile"}
                            className="flex items-center gap-2 font-black text-[#4B63D2] hover:underline"
                          >
                            {getMediaUrl(comment.author?.profile?.profile_picture) ? (
                              <img
                                src={getMediaUrl(comment.author?.profile?.profile_picture)}
                                alt="Commenter Avatar"
                                className="h-6 w-6 rounded-full object-cover border border-[#EAE4F7]"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center text-white text-[10px] font-bold">
                                {getInitials(comment.author?.email)}
                              </div>
                            )}
                            <span className="truncate max-w-[150px]">
                              {comment.author?.profile?.first_name || comment.author?.profile?.last_name
                                ? `${comment.author?.profile?.first_name || ""} ${comment.author?.profile?.last_name || ""}`.trim()
                                : getEmailPrefix(comment.author?.email)}
                            </span>
                          </Link>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[#9188BE] text-[10px] font-medium">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                            {(isSuperAdminOrAdmin ||
                              comment.author_id === currentUser?.id ||
                              displayCommentPost.author_id === currentUser?.id) && (
                              <button
                                onClick={() => handleDeleteComment(displayCommentPost.id, comment.id)}
                                title="Delete comment"
                                className="opacity-0 group-hover:opacity-100 text-[#9188BE] hover:text-rose-600 transition-all p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[#1E2746] dark:text-[#F1F5F9] leading-relaxed break-words font-medium pl-8">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Sticky Bottom Comment Composer */}
                <form
                  onSubmit={(e) => handleAddComment(e, displayCommentPost.id)}
                  className="p-3 sm:p-3.5 border-t border-[#EAE4F7] dark:border-[#1F2937] bg-white dark:bg-[#111827] flex items-center gap-2 shrink-0 rounded-b-3xl"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(currentUser?.email)}
                  </div>
                  <input
                    type="text"
                    value={commentInputs[displayCommentPost.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [displayCommentPost.id]: e.target.value,
                      }))
                    }
                    placeholder="Add to discussion..."
                    className="flex-1 bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-xl px-3 py-2 text-xs text-[#1E2746] dark:text-[#F1F5F9] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
                  />
                  <button
                    type="submit"
                    disabled={
                      submittingCommentByPost[displayCommentPost.id] ||
                      !(commentInputs[displayCommentPost.id] || "").trim()
                    }
                    className="px-3.5 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {submittingCommentByPost[displayCommentPost.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
                    )}
                  </button>
                </form>
              </aside>
            </div>

            {/* Mobile Slide-over Drawer (< lg) */}
            {activeCommentPostId && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-white dark:bg-[#111827] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pb-20">
                  {/* Header */}
                  <div className="p-4 border-b border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between bg-[#FAF9FD] dark:bg-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#4B63D2]" />
                      <h3 className="text-sm font-black text-[#1E2746] dark:text-[#F1F5F9]">
                        Comments ({displayCommentPost.comments_count})
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveCommentPostId(null)}
                      className="p-1.5 rounded-xl text-[#9188BE] hover:text-[#1E2746]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingCommentsByPost[displayCommentPost.id] ? (
                      <div className="flex items-center justify-center py-12 gap-2 text-xs text-[#5851A4]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#4B63D2]" />
                        <span>Loading comments...</span>
                      </div>
                    ) : !commentsByPost[displayCommentPost.id] || commentsByPost[displayCommentPost.id].length === 0 ? (
                      <p className="text-[#5851A4] text-xs text-center py-8 italic">No comments yet</p>
                    ) : (
                      commentsByPost[displayCommentPost.id].map((comment) => (
                        <div key={comment.id} className="bg-[#FAF9FD] dark:bg-[#1E293B]/60 p-3 rounded-2xl border border-[#EAE4F7] dark:border-[#334155] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#4B63D2]">
                              {comment.author?.profile?.first_name || comment.author?.email.split("@")[0]}
                            </span>
                            <span className="text-[10px] text-[#9188BE]">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-[#1E2746] dark:text-[#F1F5F9] font-medium">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={(e) => handleAddComment(e, displayCommentPost.id)}
                    className="p-3 border-t border-[#EAE4F7] dark:border-[#1F2937] flex items-center gap-2 bg-white dark:bg-[#111827]"
                  >
                    <input
                      type="text"
                      value={commentInputs[displayCommentPost.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [displayCommentPost.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="flex-1 bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] rounded-xl px-3 py-2 text-xs"
                    />
                    <button type="submit" className="p-2 bg-[#4B63D2] text-white rounded-xl">
                      <Send className="w-4 h-4 text-[#FFD21A]" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EDIT POST MODAL                                                           */}
      {/* ========================================================================= */}
      {editingPost && (
        <div className="fixed inset-0 bg-[#1E2746]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAE4F7] w-full max-w-lg overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#4B63D2]" />
                <h3 className="text-base font-black text-[#1E2746]">
                  Edit Post
                </h3>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-xl text-[#9188BE] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editingPost.content}
              onChange={(e) =>
                setEditingPost({ ...editingPost, content: e.target.value })
              }
              rows={5}
              className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-2xl p-3.5 text-[#1E2746] text-xs sm:text-sm placeholder-[#9188BE] focus:ring-2 focus:ring-[#4B63D2]/20 focus:border-[#4B63D2] focus:outline-none transition-all font-medium resize-none"
              placeholder="Edit your post content..."
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] border border-[#EAE4F7] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit || !editingPost.content.trim()}
                onClick={handleSaveEditPost}
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-md shadow-[#4B63D2]/20 flex items-center gap-2 cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD21A]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEND IN CHAT MODAL                                                        */}
      {/* ========================================================================= */}
      {shareToChatPost && (
        <div className="fixed inset-0 bg-[#1E2746]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAE4F7] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#EAE4F7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#4B63D2]/10 text-[#4B63D2]">
                  <SendHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E2746]">
                    Send Post in Chat
                  </h3>
                  <p className="text-[11px] text-[#5851A4] font-medium">
                    Share with a classmate, alumni, faculty, or group
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareToChatPost(null)}
                className="p-1 rounded-xl text-[#9188BE] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Preview Snippet */}
            <div className="p-3.5 mx-5 mt-4 bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-bold text-[#4B63D2] uppercase tracking-wider">
                Post Preview
              </span>
              <p className="text-[#1E2746] font-medium line-clamp-2">
                {shareToChatPost.content}
              </p>
            </div>

            {/* Recipient Search & List */}
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
                <input
                  type="text"
                  placeholder="Search conversations or campus members..."
                  value={chatRecipientSearch}
                  onChange={(e) => setChatRecipientSearch(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5851A4]">
                  Recent Chats & Connections
                </p>

                {isLoadingChatRecipients ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-[#5851A4]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4B63D2]" />
                    <span>Loading recipients...</span>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {/* Active Conversations */}
                    {chatConversations
                      .filter((c) => {
                        const name = c.is_group
                          ? c.name || "Group"
                          : c.participants?.find(
                              (p) => p.user_id !== currentUser?.id
                            )?.user?.email || "";
                        return name
                          .toLowerCase()
                          .includes(chatRecipientSearch.toLowerCase());
                      })
                      .map((conv) => {
                        const title = conv.is_group
                          ? conv.name || `Group #${conv.id}`
                          : conv.participants?.find(
                              (p) => p.user_id !== currentUser?.id
                            )?.user?.email.split("@")[0] ||
                            `Chat #${conv.id}`;
                        const isSending = sendingToChatId === conv.id;

                        return (
                          <div
                            key={`conv-${conv.id}`}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF9FD] border border-transparent hover:border-[#EAE4F7] transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#5851A4] to-[#4B63D2] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {conv.is_group ? (
                                  <UsersIcon className="w-4 h-4" />
                                ) : (
                                  title.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1E2746] truncate capitalize">
                                  {title}
                                </p>
                                <p className="text-[10px] text-[#5851A4] font-medium">
                                  {conv.is_group
                                    ? "Group Chat"
                                    : "Direct Message"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isSending}
                              onClick={() =>
                                handleSendPostToConversation(conv.id)
                              }
                              className="px-3 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Send</span>
                                  <Send className="w-3 h-3 text-[#FFD21A]" />
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}

                    {/* Campus Users candidates */}
                    {chatCampusUsers
                      .filter((u) =>
                        u.email
                          .toLowerCase()
                          .includes(chatRecipientSearch.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((u) => {
                        const isSending = sendingToChatId === u.id;
                        const name = u.email
                          .split("@")[0]
                          .replace(/[._]/g, " ");

                        return (
                          <div
                            key={`user-${u.id}`}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF9FD] border border-transparent hover:border-[#EAE4F7] transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-xl bg-[#EAE4F7] text-[#4B63D2] flex items-center justify-center font-bold text-xs shrink-0 capitalize">
                                {name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1E2746] truncate capitalize">
                                  {name}
                                </p>
                                <p className="text-[10px] text-[#5851A4] font-medium truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isSending}
                              onClick={() => handleSendPostToUser(u.id)}
                              className="px-3 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Send</span>
                                  <Send className="w-3 h-3 text-[#FFD21A]" />
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {chatShareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E2746] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{chatShareToast}</span>
        </div>
      )}

      {/* Floating Report Post Success Toast */}
      {reportSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E2746] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 border border-amber-400/30">
          <Flag className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{reportSuccessToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT POST MODAL (SUBMITS TO DEPARTMENT CONTROLLER)                      */}
      {/* ========================================================================= */}
      {reportingPost && (
        <div className="fixed inset-0 bg-[#1E2746]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-[#EAE4F7] dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#EAE4F7] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E2746] dark:text-white">
                    Report Post to Department Controller
                  </h3>
                  <p className="text-[11px] text-[#5851A4] dark:text-slate-400 font-medium">
                    Reviewed by the author's Department Controller for campus safety
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportingPost(null)}
                className="p-1 rounded-xl text-[#9188BE] hover:text-[#1E2746] hover:bg-[#FAF9FD] dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 overflow-y-auto">
              {/* Post Snippet */}
              <div className="p-3.5 bg-[#FAF9FD] dark:bg-slate-800/60 border border-[#EAE4F7] dark:border-slate-700 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#4B63D2]">
                  <span>Post Author: {reportingPost.author?.profile?.first_name ? `${reportingPost.author.profile.first_name} ${reportingPost.author.profile.last_name || ""}`.trim() : reportingPost.author?.email}</span>
                  <span className="bg-blue-50 text-[#4B63D2] px-2 py-0.5 rounded-full font-bold">
                    Dept: {reportingPost.author?.profile?.department || "AIML"}
                  </span>
                </div>
                <p className="text-[#1E2746] dark:text-slate-200 font-medium line-clamp-2 pt-0.5">
                  "{reportingPost.content}"
                </p>
              </div>

              {/* Reason Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1E2746] dark:text-slate-200 block">
                  Why are you reporting this post? *
                </label>
                <div className="space-y-2">
                  {[
                    "Inappropriate Content / Code of Conduct",
                    "Harassment, Bullying, or Hate Speech",
                    "Academic Dishonesty / Unauthorized Exam Material",
                    "Spam, Scam, or Misinformation",
                    "Other Department Safety Violation",
                  ].map((category) => (
                    <label
                      key={category}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        reportCategory === category
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 text-amber-900 dark:text-amber-200 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-[#EAE4F7] dark:border-slate-700 text-[#1E2746] dark:text-slate-300 hover:border-amber-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportCategory"
                        value={category}
                        checked={reportCategory === category}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5851A4] dark:text-slate-300 block">
                  Additional Details or Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional remarks for the department controller..."
                  className="w-full bg-[#FAF9FD] dark:bg-slate-800 border border-[#D5CBEE] dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 rounded-xl p-3 text-xs text-[#1E2746] dark:text-white placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] font-medium resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5CBEE] text-xs font-bold text-[#5851A4] hover:bg-[#FAF9FD] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black transition shadow-md shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP PDF VIEWER MODAL                                                   */}
      {/* ========================================================================= */}
      {activePdfModalUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAE4F7]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EAE4F7] flex items-center justify-between bg-[#FAF9FD]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-[#1E2746] truncate">
                    {activePdfModalUrl.name}
                  </h3>
                  <p className="text-[11px] text-[#5851A4] font-semibold">
                    Document Viewer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePdfModalUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={activePdfModalUrl.name}
                  className="px-3.5 py-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActivePdfModalUrl(null)}
                  className="p-2 text-[#9188BE] hover:text-[#1E2746] hover:bg-[#EAE4F7] rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Embedded PDF iframe */}
            <div className="flex-1 w-full bg-slate-100 relative">
              <iframe
                src={activePdfModalUrl.url}
                title={activePdfModalUrl.name}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SIZE PHOTO LIGHTBOX MODAL                                             */}
      {/* ========================================================================= */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-rose-400 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeLightboxImage}
            alt="Full-size Post View"
            className="max-w-full max-h-[92vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </div>
  );
}
