import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
  Users as UsersIcon,
  Lock,
  Image,
  X,
  GraduationCap,
  Check,
  Trash2,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";
import TiesRecommendations from "../components/feed/TiesRecommendations";
import { formatTimeAgo } from "../utils/date";



export interface PostAuthor {
  id: number;
  email: string;
}

export interface CommentAuthor {
  id: number;
  email: string;
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

  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role_id?: number;
    role?: { id: number; name: string };
  } | null>(null);

  const roleName = currentUser?.role?.name?.toLowerCase().trim() || "";
  const isSuperAdmin = roleName === "super admin" || roleName === "superadmin";
  const isSuperAdminOrAdmin =
    currentUser?.role_id === 1 ||
    roleName === "admin" ||
    isSuperAdmin;

  // Create post states
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState("PUBLIC");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  // Filter tab state ("ALL", "PUBLIC", "STUDENTS_ONLY", "STUDENTS_AND_ALUMNI")
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Comments and Inputs State indexed by postId
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>(
    {},
  );
  const [commentsByPost, setCommentsByPost] = useState<
    Record<number, CommentResponse[]>
  >({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState<
    Record<number, boolean>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>(
    {},
  );
  const [submittingCommentByPost, setSubmittingCommentByPost] = useState<
    Record<number, boolean>
  >({});

  const observerTarget = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Periodic interval to update relative timestamps live every 30s
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

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
        `/posts/feed?skip=${currentSkip}&limit=${LIMIT}`,
      );

      if (reset) {
        setPosts(response);
        setSkip(LIMIT);
      } else {
        setPosts((prev) => [...prev, ...response]);
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

  useEffect(() => {
    fetchFeed(true);
    fetchCurrentUser();
  }, []);

  // Create post action handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmittingPost(true);
    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        imageUrl = await apiRequest<string>("/posts/upload-image", {
          method: "POST",
          body: formData,
        });
      }

      const newPost = await apiRequest<PostResponse>("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: newPostContent,
          image_url: imageUrl,
          visibility: newPostVisibility,
        }),
      });

      // Add new post to start of state
      setPosts((prev) => [newPost, ...prev]);

      // Reset form states
      setNewPostContent("");
      setNewPostVisibility("PUBLIC");
      handleRemoveImage();
    } catch (err: any) {
      alert(err.message || "Failed to share the post.");
    } finally {
      setSubmittingPost(false);
    }
  };

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
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, loading, skip]);

  // Like / Unlike action
  const handleLikeToggle = async (
    postId: number,
    isCurrentlyLiked: boolean,
  ) => {
    // Optimistic Update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked
              ? post.likes_count - 1
              : post.likes_count + 1,
          };
        }
        return post;
      }),
    );

    try {
      if (isCurrentlyLiked) {
        await apiRequest(`/posts/${postId}/like`, { method: "DELETE" });
      } else {
        await apiRequest(`/posts/${postId}/like`, { method: "POST" });
      }
    } catch (err) {
      // Revert if API fails
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: isCurrentlyLiked,
              likes_count: isCurrentlyLiked
                ? post.likes_count + 1
                : post.likes_count - 1,
            };
          }
          return post;
        }),
      );
      alert("Could not update like. Please try again.");
    }
  };

  // Load comments for a specific post
  const toggleComments = async (postId: number) => {
    const isExpanded = !!expandedPosts[postId];
    setExpandedPosts((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsByPost[postId]) {
      setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await apiRequest<CommentResponse[]>(
          `/posts/${postId}/comments`,
        );
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        alert("Failed to load comments.");
      } finally {
        setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: false }));
      }
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
        },
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
        }),
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "STUDENTS_ONLY":
        return (
          <span
            title="Visible to students only"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full"
          >
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            <span>Students Only</span>
          </span>
        );
      case "STUDENTS_AND_ALUMNI":
        return (
          <span
            title="Visible to students and alumni"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full"
          >
            <UsersIcon className="w-3 h-3 text-purple-600" />
            <span>Students & Alumni</span>
          </span>
        );
      case "CONNECTIONS":
        return (
          <span
            title="Visible to connections only"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
          >
            <UsersIcon className="w-3 h-3 text-slate-500" />
            <span>Connections</span>
          </span>
        );
      case "PRIVATE":
        return (
          <span
            title="Private: visible to you only"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Private</span>
          </span>
        );
      default:
        return (
          <span
            title="For Everyone: visible to all campus accounts"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-full"
          >
            <Globe className="w-3 h-3 text-[#4B63D2]" />
            <span>Everyone</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        {/* Left / Center: Main Feed Stream */}
        <div className="lg:col-span-8 space-y-6">

          {/* Title Header Card */}
          <div className="relative overflow-hidden bg-white border border-[#EAE4F7] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-gradient-to-br from-[#C8B6E2]/20 via-[#4B63D2]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#4B63D2]/10 rounded-xl text-[#4B63D2]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
                  Campus Discussions Feed
                </h2>
              </div>
              <p className="text-[#5851A4] text-sm max-w-xl font-medium">
                Join the conversation! Share updates, view posts, and interact with
                students, alumni, faculty, and management.
              </p>
            </div>
          </div>


      {/* Create Post Form Card */}
      <form
        onSubmit={handleCreatePost}
        className="bg-white border border-[#EAE4F7] rounded-3xl p-5 md:p-6 space-y-4 hover:border-[#C8B6E2] transition-all duration-300 shadow-sm"
      >
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#4B63D2]/20 shrink-0">
            {getInitials(currentUser?.email)}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              placeholder={
                currentUser
                  ? `What's on your mind, ${getEmailPrefix(currentUser.email)}?`
                  : "What's on your mind?"
              }
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
              className="w-full bg-[#FAF9FD] border border-[#EAE4F7] focus:bg-white rounded-2xl p-3 resize-none text-[#1E2746] text-sm placeholder-[#9188BE] focus:ring-2 focus:ring-[#4B63D2]/20 focus:border-[#4B63D2] focus:outline-none min-h-[70px] transition-all"
            />

            {/* Selected Image Preview */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[#EAE4F7] bg-[#FAF9FD] aspect-video max-h-[300px]">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-[#1E2746]/80 hover:bg-[#1E2746] rounded-full text-white transition-all shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider and Actions Panel */}
        <div className="border-t border-[#EAE4F7] pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            {/* Image Upload Input & Button */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-[#5851A4] hover:text-[#4B63D2] font-semibold text-xs py-2 px-3 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer"
            >
              <Image className="w-4 h-4 text-[#4B63D2]" />
              <span>Photo</span>
            </button>

            {/* Visibility Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowVisibilityDropdown(!showVisibilityDropdown)
                }
                className="flex items-center gap-2 text-[#5851A4] hover:text-[#1E2746] font-semibold text-xs py-2 px-3 rounded-xl hover:bg-[#FAF9FD] border border-transparent hover:border-[#EAE4F7] transition-all cursor-pointer"
              >
                {newPostVisibility === "PUBLIC" && (
                  <Globe className="w-4 h-4 text-[#4B63D2]" />
                )}
                {newPostVisibility === "STUDENTS_ONLY" && (
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                )}
                {newPostVisibility === "STUDENTS_AND_ALUMNI" && (
                  <UsersIcon className="w-4 h-4 text-purple-600" />
                )}
                <span>
                  {newPostVisibility === "PUBLIC" && "For Everyone"}
                  {newPostVisibility === "STUDENTS_ONLY" && "Students Only"}
                  {newPostVisibility === "STUDENTS_AND_ALUMNI" && "Students & Alumni"}
                </span>
              </button>

              {showVisibilityDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVisibilityDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 bg-white border border-[#EAE4F7] rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-[#FAF9FD]">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9188BE]">
                      Who can see this post?
                    </div>

                    {/* Option 1: For Everyone */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("PUBLIC");
                        setShowVisibilityDropdown(false);
                      }}
                      className={`flex items-start gap-3 w-full text-left px-3.5 py-2.5 hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                        newPostVisibility === "PUBLIC" ? "bg-[#FAF9FD]" : ""
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-blue-50 text-[#4B63D2] shrink-0 mt-0.5">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E2746]">
                            For Everyone
                          </span>
                          {newPostVisibility === "PUBLIC" && (
                            <Check className="w-3.5 h-3.5 text-[#4B63D2]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#5851A4] font-medium leading-tight mt-0.5">
                          Anyone across campus (students to management)
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Students Only */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("STUDENTS_ONLY");
                        setShowVisibilityDropdown(false);
                      }}
                      className={`flex items-start gap-3 w-full text-left px-3.5 py-2.5 hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                        newPostVisibility === "STUDENTS_ONLY" ? "bg-[#FAF9FD]" : ""
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E2746]">
                            For Students Only
                          </span>
                          {newPostVisibility === "STUDENTS_ONLY" && (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#5851A4] font-medium leading-tight mt-0.5">
                          Only student accounts will be able to see this post
                        </p>
                      </div>
                    </button>

                    {/* Option 3: Students & Alumni */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("STUDENTS_AND_ALUMNI");
                        setShowVisibilityDropdown(false);
                      }}
                      className={`flex items-start gap-3 w-full text-left px-3.5 py-2.5 hover:bg-[#FAF9FD] transition-all cursor-pointer ${
                        newPostVisibility === "STUDENTS_AND_ALUMNI" ? "bg-[#FAF9FD]" : ""
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0 mt-0.5">
                        <UsersIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E2746]">
                            For Students & Alumni
                          </span>
                          {newPostVisibility === "STUDENTS_AND_ALUMNI" && (
                            <Check className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#5851A4] font-medium leading-tight mt-0.5">
                          Only students and alumni accounts will be able to see this post
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submittingPost || !newPostContent.trim()}
            className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-[#4B63D2]/25 cursor-pointer active:scale-95"
          >
            {submittingPost ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sharing...</span>
              </>
            ) : (
              <span>Share</span>
            )}
          </button>
        </div>
      </form>

      {/* Feed Visibility Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === "ALL"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:bg-[#FAF9FD]"
          }`}
        >
          All Updates
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("PUBLIC")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === "PUBLIC"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:bg-[#FAF9FD]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Everyone</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("STUDENTS_ONLY")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === "STUDENTS_ONLY"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-emerald-700 border border-emerald-200/80 hover:bg-emerald-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Students Only</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("STUDENTS_AND_ALUMNI")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === "STUDENTS_AND_ALUMNI"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-purple-700 border border-purple-200/80 hover:bg-purple-50"
          }`}
        >
          <UsersIcon className="w-3.5 h-3.5" />
          <span>Students & Alumni</span>
        </button>
      </div>

      {/* Main feed list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
          <p className="text-[#5851A4] text-sm font-medium">Gathering latest updates...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-[#1E2746] font-bold text-base">
            Error Loading Feed
          </h3>
          <p className="text-[#5851A4] text-sm max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchFeed(true)}
            className="px-4 py-2 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl text-xs font-bold transition-all"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <MessageSquare className="w-12 h-12 text-[#B9B1D9] mx-auto" />
          <h3 className="text-[#1E2746] font-bold text-lg">No posts yet</h3>
          <p className="text-[#5851A4] text-sm max-w-md mx-auto font-medium">
            The campus discussions are quiet. Be the first to start a
            conversation and share an update with your peers!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts
            .filter((post) => {
              if (activeFilter === "ALL") return true;
              if (activeFilter === "PUBLIC")
                return post.visibility === "PUBLIC" || !post.visibility;
              if (activeFilter === "STUDENTS_ONLY")
                return post.visibility === "STUDENTS_ONLY";
              if (activeFilter === "STUDENTS_AND_ALUMNI")
                return post.visibility === "STUDENTS_AND_ALUMNI";
              return true;
            })
            .map((post) => (
            <article
              key={post.id}
              className="bg-white border border-[#EAE4F7] rounded-3xl p-5 md:p-6 space-y-4 hover:border-[#C8B6E2] transition-all duration-300 hover:shadow-md shadow-sm"
            >
              {/* Card Header: Author Profile Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#4B63D2]/20">
                    {getInitials(post.author?.email)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#1E2746] hover:text-[#4B63D2] transition-colors cursor-pointer flex items-center gap-1.5">
                        <span>{getEmailPrefix(post.author?.email)}</span>
                        {hasInfinityBadge(post.author?.email) && (
                          <span
                            className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-gradient-to-r from-[#4B63D2] to-[#5851A4] text-white text-[10px] font-black shadow-sm"
                            title="Verified Campus Distinction / Leadership Position"
                          >
                            ∞
                          </span>
                        )}
                      </h4>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                        post.author?.email?.includes("alumni")
                          ? "bg-purple-50 border border-purple-200 text-purple-700"
                          : post.author?.email?.includes("prof")
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "bg-[#C8B6E2]/25 border border-[#C8B6E2] text-[#5851A4]"
                      }`}>
                        {post.author?.email?.includes("alumni")
                          ? "Alumni"
                          : post.author?.email?.includes("prof")
                          ? "Faculty"
                          : "Member"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-[#5851A4]/80 font-medium">
                        {formatTimeAgo(post.created_at)}
                      </p>
                      <span className="text-[#C8B6E2] text-[10px]">•</span>
                      {getVisibilityIcon(post.visibility)}
                    </div>
                  </div>
                </div>

                {/* Super Admin / Admin / Author Delete Control */}
                {(isSuperAdminOrAdmin || post.author_id === currentUser?.id) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    title={
                      isSuperAdmin
                        ? "Super Admin: Permanently delete post"
                        : isSuperAdminOrAdmin && post.author_id !== currentUser?.id
                        ? "Admin: Remove post"
                        : "Delete your post"
                    }
                    className="p-1.5 rounded-xl text-[#9188BE] hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1 text-xs shrink-0 group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {isSuperAdmin && (
                      <span className="hidden sm:inline text-[11px] font-bold text-rose-500">
                        Remove
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Card Body: Post Text Content */}
              <p className="text-[#1E2746] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {post.content}
              </p>

              {/* Card Body: Image Attachment if available */}
              {post.image_url && (
                <div className="relative rounded-2xl overflow-hidden border border-[#EAE4F7] bg-[#FAF9FD] aspect-video max-h-[360px]">
                  <img
                    src={getMediaUrl(post.image_url)}
                    alt="Post attachment"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Card Actions: Likes and Comments triggers */}
              <div className="flex items-center justify-between border-t border-[#EAE4F7] pt-4 text-xs font-semibold">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeToggle(post.id, post.is_liked)}
                    className={`flex items-center gap-1.5 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-[#FAF9FD] ${
                      post.is_liked
                        ? "text-rose-500 font-bold"
                        : "text-[#5851A4] hover:text-[#1E2746]"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`}
                    />
                    <span>
                      {post.likes_count}{" "}
                      {post.likes_count === 1 ? "Like" : "Likes"}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-[#FAF9FD] ${
                      expandedPosts[post.id]
                        ? "text-[#4B63D2] font-bold"
                        : "text-[#5851A4] hover:text-[#1E2746]"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {post.comments_count}{" "}
                      {post.comments_count === 1 ? "Comment" : "Comments"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Card Expanded Comments Section */}
              {expandedPosts[post.id] && (
                <div className="mt-4 border-t border-[#EAE4F7] pt-4 space-y-4">
                  <h5 className="text-xs font-bold text-[#5851A4] uppercase tracking-wider">
                    Comments
                  </h5>

                  {loadingCommentsByPost[post.id] ? (
                    <div className="flex items-center gap-2 py-3 text-[#5851A4] text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4B63D2]" />
                      <span>Loading discussion comments...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                      {!commentsByPost[post.id] ||
                      commentsByPost[post.id].length === 0 ? (
                        <p className="text-[#5851A4] text-xs italic py-2">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        commentsByPost[post.id].map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-[#FAF9FD] rounded-2xl p-3.5 border border-[#EAE4F7] text-xs space-y-1 group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#4B63D2]">
                                {getEmailPrefix(comment.author?.email)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#9188BE] text-[10px]">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                                {(isSuperAdminOrAdmin ||
                                  comment.author_id === currentUser?.id ||
                                  post.author_id === currentUser?.id) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(post.id, comment.id)
                                    }
                                    title="Delete comment"
                                    className="opacity-0 group-hover:opacity-100 text-[#9188BE] hover:text-rose-600 transition-all p-0.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[#1E2746] leading-relaxed font-medium">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form
                    onSubmit={(e) => handleAddComment(e, post.id)}
                    className="flex items-center gap-2 mt-2"
                  >
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      disabled={submittingCommentByPost[post.id]}
                      className="flex-1 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={
                        submittingCommentByPost[post.id] ||
                        !commentInputs[post.id]?.trim()
                      }
                      className="p-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center shrink-0 shadow-sm"
                    >
                      {submittingCommentByPost[post.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))}

          {/* Observer Sentinel Element for Infinite Scroll */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-6">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-[#4B63D2] text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more discussions...</span>
                </div>
              ) : (
                <button
                  onClick={() => fetchFeed(false)}
                  className="px-4 py-2 bg-white border border-[#EAE4F7] hover:bg-[#FAF9FD] rounded-xl text-xs text-[#5851A4] font-bold transition-all hover:text-[#1E2746] shadow-sm"
                >
                  Load More Posts
                </button>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-6 text-xs text-slate-600 font-medium">
              🎉 You've reached the end of the feed!
            </div>
          )}
        </div>
      )}
        </div>

        {/* Right Column: Ties Recommendations Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <TiesRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
}


