import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
  Users as UsersIcon,
  Image,
  X,
  GraduationCap,
  Check,
  Trash2,
  FileText,
  Link as LinkIcon,
  Maximize2,
  Share2,
  Download,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { apiRequest, getMediaUrl } from "../services/api";
import TiesRecommendations from "../components/feed/TiesRecommendations";
import { formatTimeAgo } from "../utils/date";

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
}

export interface PostAuthor {
  id: number;
  email: string;
  profile?: AuthorProfile | null;
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

  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

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
  const [attachedDoc, setAttachedDoc] = useState<{
    name: string;
    size: string;
    file: File;
  } | null>(null);
  const [externalLinkUrl, setExternalLinkUrl] = useState<string>("");
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(
    null
  );
  const [activePdfModalUrl, setActivePdfModalUrl] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  // Filter tab state ("ALL", "PUBLIC", "STUDENTS_ONLY", "STUDENTS_AND_ALUMNI", "DOCS", "MEDIA")
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Comments and Inputs State indexed by postId
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>(
    {}
  );
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
        `/posts/feed?skip=${currentSkip}&limit=${LIMIT}`
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

  const handleSharePost = (post: PostResponse) => {
    const shareUrl = `${window.location.origin}/feed#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
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
      setAttachedDoc(null);
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

    let contentToSubmit = newPostContent.trim();
    if (externalLinkUrl.trim()) {
      contentToSubmit = contentToSubmit
        ? `${contentToSubmit}\n\n${externalLinkUrl.trim()}`
        : externalLinkUrl.trim();
    }

    const fileToUpload = selectedImage || attachedDoc?.file;

    if (!contentToSubmit) {
      if (attachedDoc) {
        contentToSubmit = `Shared a document: ${attachedDoc.name}`;
      } else if (selectedImage) {
        contentToSubmit = `Shared a photo`;
      } else {
        alert(
          "Please write a post message, upload a file, or add a link before sharing."
        );
        return;
      }
    }

    setSubmittingPost(true);
    try {
      let imageUrl: string | null = null;

      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        imageUrl = await apiRequest<string>("/posts/upload-image", {
          method: "POST",
          body: formData,
        });
      }

      const newPost = await apiRequest<PostResponse>("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: contentToSubmit,
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
      setAttachedDoc(null);
      if (docInputRef.current) {
        docInputRef.current.value = "";
      }
      setShowLinkInput(false);
      setExternalLinkUrl("");
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
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, loading, skip]);

  // Like / Unlike action
  const handleLikeToggle = async (
    postId: number,
    isCurrentlyLiked: boolean
  ) => {
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
          `/posts/${postId}/comments`
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

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "STUDENTS_ONLY":
        return (
          <span
            title="Visible to students only"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full"
          >
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            <span>Students Only</span>
          </span>
        );
      case "STUDENTS_AND_ALUMNI":
        return (
          <span
            title="Visible to students and alumni"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full"
          >
            <UsersIcon className="w-3 h-3 text-purple-600" />
            <span>Students & Alumni</span>
          </span>
        );
      case "CONNECTIONS":
        return (
          <span
            title="Visible to connections only"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
          >
            <UsersIcon className="w-3 h-3 text-slate-500" />
            <span>Connections</span>
          </span>
        );
      default:
        return (
          <span
            title="Visible to everyone"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 border border-[#4B63D2]/20 px-2.5 py-0.5 rounded-full"
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
        {/* Main Feed Stream */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Header Card */}
          <div className="relative overflow-hidden bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-gradient-to-br from-[#C8B6E2]/20 via-[#4B63D2]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#4B63D2]/10 rounded-2xl text-[#4B63D2] shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1E2746] tracking-tight">
                  Campus Discussions Feed
                </h2>
              </div>
              <p className="text-[#5851A4] text-xs sm:text-sm max-w-xl font-medium pt-0.5">
                Share updates, ask doubts, discuss projects, and connect across the SBJIT campus network.
              </p>
            </div>
          </div>

          {/* Create Post Form Card */}
          <form
            onSubmit={handleCreatePost}
            className="bg-white border border-[#EAE4F7] rounded-3xl p-5 sm:p-6 space-y-4 hover:border-[#D5CBEE] transition-all duration-300 shadow-sm"
          >
            <div className="flex gap-3.5 items-start">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#4B63D2]/20 shrink-0">
                {getInitials(currentUser?.email)}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  placeholder={
                    currentUser
                      ? `What's happening on campus, ${getEmailPrefix(
                          currentUser.email
                        )}?`
                      : "What's on your mind? Share a post, note, or project link..."
                  }
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FAF9FD] border border-[#EAE4F7] focus:bg-white rounded-2xl p-3.5 resize-none text-[#1E2746] text-xs sm:text-sm placeholder-[#9188BE] focus:ring-2 focus:ring-[#4B63D2]/20 focus:border-[#4B63D2] focus:outline-none min-h-[75px] transition-all font-medium"
                />

                {/* Selected Image Preview */}
                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#EAE4F7] bg-[#FAF9FD] aspect-video max-h-[280px] shadow-sm animate-in zoom-in-95 duration-200">
                    <img
                      src={imagePreview}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-[#1E2746]/80 hover:bg-[#1E2746] rounded-full text-white transition-all shadow-md cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Attached Document Preview Pill */}
                {attachedDoc && (
                  <div className="flex items-center justify-between p-3 bg-[#4B63D2]/5 border border-[#4B63D2]/20 rounded-2xl text-xs font-bold text-[#4B63D2] animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileCheck className="w-4 h-4 text-[#4B63D2] shrink-0" />
                      <span className="truncate">
                        {attachedDoc.name}{" "}
                        <span className="text-[#9188BE] font-normal">
                          ({attachedDoc.size})
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedDoc(null)}
                      className="p-1 hover:bg-[#4B63D2]/10 rounded-full text-[#5851A4] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* External Link Input Field */}
                {showLinkInput && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#FAF9FD] border border-[#D5CBEE] rounded-2xl text-xs animate-in fade-in slide-in-from-top-1 duration-150 shadow-xs">
                    <LinkIcon className="w-4 h-4 text-[#4B63D2] shrink-0 ml-1" />
                    <input
                      type="url"
                      placeholder="Paste external link URL (e.g., https://github.com/project-repo)"
                      value={externalLinkUrl}
                      onChange={(e) => setExternalLinkUrl(e.target.value)}
                      className="flex-1 bg-transparent text-[#1E2746] placeholder-[#9188BE] font-semibold focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setExternalLinkUrl("");
                      }}
                      className="p-1 text-[#9188BE] hover:text-[#1E2746] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Divider and Actions Panel */}
            <div className="border-t border-[#EAE4F7] pt-3.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Image Upload Button */}
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
                  className="flex items-center gap-1.5 text-[#5851A4] hover:text-[#4B63D2] font-bold text-xs py-2 px-3 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer border border-transparent hover:border-[#EAE4F7]"
                >
                  <Image className="w-4 h-4 text-[#4B63D2]" />
                  <span>Photo</span>
                </button>

                {/* Document Upload Button (.pdf, .doc, .docx) */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  className="hidden"
                  ref={docInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                      setAttachedDoc({
                        name: file.name,
                        size: `${sizeMb} MB`,
                        file,
                      });
                      setSelectedImage(null);
                      setImagePreview(null);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[#5851A4] hover:text-[#4B63D2] font-bold text-xs py-2 px-3 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer border border-transparent hover:border-[#EAE4F7]"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>PDF / Notes</span>
                </button>

                {/* External Link Button */}
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className="flex items-center gap-1.5 text-[#5851A4] hover:text-[#4B63D2] font-bold text-xs py-2 px-3 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer border border-transparent hover:border-[#EAE4F7]"
                >
                  <LinkIcon className="w-4 h-4 text-purple-600" />
                  <span>Add Link</span>
                </button>

                {/* Visibility Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowVisibilityDropdown(!showVisibilityDropdown)
                    }
                    className="flex items-center gap-1.5 text-[#5851A4] hover:text-[#1E2746] font-bold text-xs py-2 px-3 rounded-xl bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#D5CBEE] transition-all cursor-pointer"
                  >
                    {newPostVisibility === "PUBLIC" && (
                      <Globe className="w-3.5 h-3.5 text-[#4B63D2]" />
                    )}
                    {newPostVisibility === "STUDENTS_ONLY" && (
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {newPostVisibility === "STUDENTS_AND_ALUMNI" && (
                      <UsersIcon className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>
                      {newPostVisibility === "PUBLIC" && "Everyone"}
                      {newPostVisibility === "STUDENTS_ONLY" && "Students Only"}
                      {newPostVisibility === "STUDENTS_AND_ALUMNI" &&
                        "Students & Alumni"}
                    </span>
                  </button>

                  {showVisibilityDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowVisibilityDropdown(false)}
                      />
                      <div className="absolute left-0 mt-2 w-72 bg-white border border-[#EAE4F7] rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-[#FAF9FD]">
                        <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9188BE]">
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
                              Visible across the entire campus community
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
                            newPostVisibility === "STUDENTS_ONLY"
                              ? "bg-[#FAF9FD]"
                              : ""
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
                              Visible only to enrolled students
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
                            newPostVisibility === "STUDENTS_AND_ALUMNI"
                              ? "bg-[#FAF9FD]"
                              : ""
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
                              For campus career networking & alumni discussions
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
                disabled={
                  submittingPost ||
                  (!newPostContent.trim() &&
                    !externalLinkUrl.trim() &&
                    !selectedImage &&
                    !attachedDoc)
                }
                className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-[#4B63D2]/25 cursor-pointer active:scale-95"
              >
                {submittingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD21A]" />
                    <span>Sharing Post...</span>
                  </>
                ) : (
                  <>
                    <span>Share Post</span>
                    <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feed Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "ALL"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
              }`}
            >
              All Posts
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("DOCS")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "DOCS"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-emerald-700 border border-emerald-200/80 hover:bg-emerald-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>PDF & Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("MEDIA")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "MEDIA"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:bg-[#FAF9FD]"
              }`}
            >
              <Image className="w-3.5 h-3.5 text-[#4B63D2]" />
              <span>Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("STUDENTS_ONLY")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "STUDENTS_ONLY"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-[#5851A4] border border-[#EAE4F7] hover:bg-[#FAF9FD]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Students Only</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("STUDENTS_AND_ALUMNI")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "STUDENTS_AND_ALUMNI"
                  ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20"
                  : "bg-white text-purple-700 border border-purple-200/80 hover:bg-purple-50"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Students & Alumni</span>
            </button>
          </div>

          {/* Main Feed Posts List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl border border-[#EAE4F7]">
              <Loader2 className="w-8 h-8 text-[#4B63D2] animate-spin" />
              <p className="text-[#5851A4] text-sm font-semibold">
                Gathering latest campus discussions...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-[#1E2746] font-bold text-base">
                Error Loading Feed
              </h3>
              <p className="text-[#5851A4] text-sm max-w-md mx-auto font-medium">
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
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <MessageSquare className="w-12 h-12 text-[#B9B1D9] mx-auto" />
              <h3 className="text-[#1E2746] font-bold text-lg">No posts yet</h3>
              <p className="text-[#5851A4] text-sm max-w-md mx-auto font-medium">
                The campus discussions are quiet. Be the first to share an update,
                study material, or project demo with your peers!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts
                .filter((post) => {
                  if (activeFilter === "ALL") return true;
                  if (activeFilter === "DOCS")
                    return isDocumentUrl(post.image_url);
                  if (activeFilter === "MEDIA")
                    return post.image_url && !isDocumentUrl(post.image_url);
                  if (activeFilter === "STUDENTS_ONLY")
                    return post.visibility === "STUDENTS_ONLY";
                  if (activeFilter === "STUDENTS_AND_ALUMNI")
                    return post.visibility === "STUDENTS_AND_ALUMNI";
                  return true;
                })
                .map((post) => (
                  <article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="bg-white border border-[#EAE4F7] rounded-3xl p-5 sm:p-6 space-y-4 hover:border-[#D5CBEE] transition-all duration-300 hover:shadow-md shadow-sm"
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
                        {getMediaUrl(post.author?.profile?.profile_picture) ? (
                          <img
                            src={getMediaUrl(
                              post.author?.profile?.profile_picture
                            )}
                            alt="Author Avatar"
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
                                  ? "bg-purple-50 border border-purple-200 text-purple-700"
                                  : post.author?.email?.includes("prof")
                                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                                  : "bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2]"
                              }`}
                            >
                              {post.author?.email?.includes("alumni")
                                ? "Alumni"
                                : post.author?.email?.includes("prof")
                                ? "Faculty"
                                : "Student"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-[#5851A4] font-semibold">
                              {formatTimeAgo(post.created_at)}
                            </p>
                            <span className="text-[#C8B6E2] text-[10px]">•</span>
                            {getVisibilityBadge(post.visibility)}
                          </div>
                        </div>
                      </Link>

                      {/* Top Action Buttons (Share & Delete) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSharePost(post)}
                          title="Copy link to post"
                          className="p-2 rounded-xl text-[#9188BE] hover:text-[#4B63D2] hover:bg-[#FAF9FD] transition-all cursor-pointer relative"
                        >
                          {copiedPostId === post.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                          {copiedPostId === post.id && (
                            <span className="absolute -top-7 right-0 bg-[#1E2746] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                              Link Copied!
                            </span>
                          )}
                        </button>

                        {(isSuperAdminOrAdmin ||
                          post.author_id === currentUser?.id) && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title={
                              isSuperAdmin
                                ? "Super Admin: Permanently delete post"
                                : isSuperAdminOrAdmin &&
                                  post.author_id !== currentUser?.id
                                ? "Admin: Remove post"
                                : "Delete your post"
                            }
                            className="p-2 rounded-xl text-[#9188BE] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                            className="w-auto max-w-full max-h-[500px] object-contain rounded-xl shadow-xs"
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
                      ) : null)}

                    {/* Card Actions: Likes and Comments triggers */}
                    <div className="flex items-center justify-between border-t border-[#EAE4F7] pt-3.5 text-xs font-semibold">
                      <div className="flex items-center gap-3">
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

                        <button
                          onClick={() => toggleComments(post.id)}
                          className={`flex items-center gap-1.5 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-[#FAF9FD] cursor-pointer ${
                            expandedPosts[post.id]
                              ? "text-[#4B63D2] font-bold bg-[#4B63D2]/10"
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

                      <button
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1 text-[#5851A4] hover:text-[#4B63D2] font-bold py-1.5 px-2.5 rounded-xl hover:bg-[#FAF9FD] transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Card Expanded Comments Section */}
                    {expandedPosts[post.id] && (
                      <div className="mt-4 border-t border-[#EAE4F7] pt-4 space-y-3.5 animate-in fade-in duration-200">
                        <h5 className="text-xs font-bold text-[#5851A4] uppercase tracking-wider">
                          Discussion Comments
                        </h5>

                        {loadingCommentsByPost[post.id] ? (
                          <div className="flex items-center gap-2 py-3 text-[#5851A4] text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4B63D2]" />
                            <span>Loading discussion comments...</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                            {!commentsByPost[post.id] ||
                            commentsByPost[post.id].length === 0 ? (
                              <p className="text-[#5851A4] text-xs italic py-2">
                                No comments yet. Be the first to share your thoughts!
                              </p>
                            ) : (
                              commentsByPost[post.id].map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-[#FAF9FD] rounded-2xl p-3.5 border border-[#EAE4F7] text-xs space-y-1 group"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <Link
                                      to={
                                        comment.author_id
                                          ? `/profile/${comment.author_id}`
                                          : "/profile"
                                      }
                                      className="font-black text-[#4B63D2] hover:underline"
                                    >
                                      {getEmailPrefix(comment.author?.email)}
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#9188BE] text-[10px] font-medium">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                      {(isSuperAdminOrAdmin ||
                                        comment.author_id ===
                                          currentUser?.id ||
                                        post.author_id === currentUser?.id) && (
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              post.id,
                                              comment.id
                                            )
                                          }
                                          title="Delete comment"
                                          className="opacity-0 group-hover:opacity-100 text-[#9188BE] hover:text-rose-600 transition-all p-0.5 cursor-pointer"
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
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            placeholder="Write a supportive comment or answer..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            disabled={submittingCommentByPost[post.id]}
                            className="flex-1 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition-all font-medium"
                          />
                          <button
                            type="submit"
                            disabled={
                              submittingCommentByPost[post.id] ||
                              !commentInputs[post.id]?.trim()
                            }
                            className="p-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center shrink-0 shadow-md shadow-[#4B63D2]/20 cursor-pointer active:scale-95"
                          >
                            {submittingCommentByPost[post.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5 text-[#FFD21A]" />
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

        {/* Right Column: Ties Recommendations Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <TiesRecommendations />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IN-APP PDF VIEWER MODAL                                                   */}
      {/* ========================================================================= */}
      {activePdfModalUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAE4F7]">
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
