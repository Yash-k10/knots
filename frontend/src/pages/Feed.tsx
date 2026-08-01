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
} from "lucide-react";
import { apiRequest } from "../services/api";

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
  } | null>(null);

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
      const response = await apiRequest<{ id: number; email: string }>(
        "/users/me",
      );
      setCurrentUser(response);
    } catch (err) {
      console.error("Failed to retrieve current user info:", err);
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

  const getEmailPrefix = (email: string | undefined) => {
    if (!email) return "Anonymous";
    return email.split("@")[0];
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();

      const seconds = Math.floor(diffMs / 1000);
      if (seconds < 60) return "Just now";

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;

      const days = Math.floor(hours / 24);
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Recent";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "CONNECTIONS":
        return (
          <span title="Visible to connections only">
            <UsersIcon className="w-3.5 h-3.5 text-slate-500" />
          </span>
        );
      case "PRIVATE":
        return (
          <span title="Private">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          </span>
        );
      default:
        return (
          <span title="Publicly visible">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title Header Card */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Campus Discussions Feed
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Join the conversation! Share updates, view posts, and interact with
            students, alumni, and faculty.
          </p>
        </div>
      </div>

      {/* Create Post Form Card */}
      <form
        onSubmit={handleCreatePost}
        className="bg-slate-950/70 backdrop-blur border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 hover:border-slate-700/80 transition-all duration-300 shadow-xl"
      >
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/10 shrink-0">
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
              className="w-full bg-transparent border-0 resize-none text-white text-sm placeholder-slate-500 focus:ring-0 focus:outline-none min-h-[60px]"
            />

            {/* Selected Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video max-h-[300px]">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-900 rounded-full text-slate-400 hover:text-white transition-all shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider and Actions Panel */}
        <div className="border-t border-slate-900 pt-4 flex items-center justify-between">
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
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-semibold text-xs py-2 px-3 rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
            >
              <Image className="w-4 h-4 text-indigo-400" />
              <span>Photo</span>
            </button>

            {/* Visibility Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowVisibilityDropdown(!showVisibilityDropdown)
                }
                className="flex items-center gap-2 text-slate-400 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
              >
                {newPostVisibility === "PUBLIC" && (
                  <Globe className="w-4 h-4 text-indigo-400" />
                )}
                {newPostVisibility === "CONNECTIONS" && (
                  <UsersIcon className="w-4 h-4 text-indigo-400" />
                )}
                {newPostVisibility === "PRIVATE" && (
                  <Lock className="w-4 h-4 text-indigo-400" />
                )}
                <span className="capitalize">
                  {newPostVisibility.toLowerCase()}
                </span>
              </button>

              {showVisibilityDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVisibilityDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("PUBLIC");
                        setShowVisibilityDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-slate-900 text-xs text-slate-300 hover:text-white font-semibold transition-all"
                    >
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>Public (Everyone)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("CONNECTIONS");
                        setShowVisibilityDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-slate-900 text-xs text-slate-300 hover:text-white font-semibold transition-all"
                    >
                      <UsersIcon className="w-4 h-4 text-indigo-400" />
                      <span>Connections Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostVisibility("PRIVATE");
                        setShowVisibilityDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-slate-900 text-xs text-slate-300 hover:text-white font-semibold transition-all"
                    >
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Private (Me only)</span>
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs py-2 px-5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
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

      {/* Main feed list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Gathering latest updates...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-white font-medium text-base">
            Error Loading Feed
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchFeed(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-white font-semibold text-lg">No posts yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The campus discussions are quiet. Be the first to start a
            conversation when post creation launches!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-slate-950/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 hover:border-slate-700/80 transition-all duration-300 hover:scale-[1.01] shadow-lg"
            >
              {/* Card Header: Author Profile Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/10">
                    {getInitials(post.author?.email)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer">
                        {getEmailPrefix(post.author?.email)}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {post.author?.email?.includes("alumni")
                          ? "Alumni"
                          : "Student"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-slate-500">
                        {formatTimeAgo(post.created_at)}
                      </p>
                      <span className="text-slate-700 text-[10px]">•</span>
                      {getVisibilityIcon(post.visibility)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body: Post Text Content */}
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Card Body: Image Attachment if available */}
              {post.image_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video max-h-[360px]">
                  <img
                    src={post.image_url}
                    alt="Post attachment"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Card Actions: Likes and Comments triggers */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-4 text-xs font-semibold">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeToggle(post.id, post.is_liked)}
                    className={`flex items-center gap-1.5 transition-colors duration-200 py-1 px-2 rounded-lg hover:bg-slate-900 ${
                      post.is_liked
                        ? "text-pink-500 hover:text-pink-400"
                        : "text-slate-400 hover:text-slate-300"
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
                    className={`flex items-center gap-1.5 transition-colors duration-200 py-1 px-2 rounded-lg hover:bg-slate-900 ${
                      expandedPosts[post.id]
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-slate-400 hover:text-slate-300"
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
                <div className="mt-4 border-t border-slate-900 pt-4 space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Comments
                  </h5>

                  {loadingCommentsByPost[post.id] ? (
                    <div className="flex items-center gap-2 py-3 text-slate-500 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading discussion comments...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                      {!commentsByPost[post.id] ||
                      commentsByPost[post.id].length === 0 ? (
                        <p className="text-slate-500 text-xs italic py-2">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        commentsByPost[post.id].map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/40 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-400">
                                {getEmailPrefix(comment.author?.email)}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">
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
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={
                        submittingCommentByPost[post.id] ||
                        !commentInputs[post.id]?.trim()
                      }
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all flex items-center justify-center shrink-0"
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
                <div className="flex items-center gap-2 text-indigo-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more discussions...</span>
                </div>
              ) : (
                <button
                  onClick={() => fetchFeed(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs text-slate-400 font-semibold transition-all hover:text-white"
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
  );
}
