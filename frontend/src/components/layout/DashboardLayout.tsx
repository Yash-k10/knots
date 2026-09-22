import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Bell,
  MessageSquare,
  Settings,
  Briefcase,
  Plus,
  Compass,
  Calendar,
  LogOut,
  User as UserIcon,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  Send,
  Sparkles,
  LayoutDashboard,
  Building,
} from "lucide-react";

import { wsClient } from "../../services/websocket";
import { apiRequest, getMediaUrl } from "../../services/api";
import KnotsLogo from "../common/KnotsLogo";
import ThemeToggle from "../common/ThemeToggle";

interface UserProfile {
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
}

interface UserRole {
  id: number;
  name: string;
}

interface CurrentUser {
  id: number;
  email: string;
  role_id?: number;
  role?: UserRole;
  profile?: UserProfile | null;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Quick Create Post Modal state (triggered by bottom center (+) button)
  const [createPostOpen, setCreatePostOpen] = useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState<boolean>(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Close profile dropdown on outside click or route change
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect();

    // Fetch user details
    const fetchUser = async () => {
      try {
        const userData = await apiRequest<CurrentUser>("/users/me");
        setUser(userData);
      } catch {
        // Fallback user fetch
      }
    };
    fetchUser();

    // Fetch notification count
    const fetchNotifCount = async () => {
      try {
        const res = await apiRequest<{ unread_count: number }>("/notifications/unread-count");
        setUnreadNotifications(res.unread_count || 0);
      } catch {}
    };
    fetchNotifCount();

    // Fetch messages count
    const fetchMsgCount = async () => {
      try {
        const res = await apiRequest<{ total_unread: number }>("/messages/unread/count");
        setUnreadMessages(res.total_unread || 0);
      } catch {}
    };
    fetchMsgCount();

    // WebSocket listeners
    const unsubNotif = wsClient.onNotification((data) => {
      if (typeof data.unread_count === "number") {
        setUnreadNotifications(data.unread_count);
      } else {
        setUnreadNotifications((prev) => prev + 1);
      }
    });

    const unsubMsg = wsClient.onMessage(() => {
      setUnreadMessages((prev) => prev + 1);
    });

    const handleNotifRead = () => setUnreadNotifications((prev) => Math.max(0, prev - 1));
    const handleNotifReadAll = () => setUnreadNotifications(0);
    const handleMsgRead = () => fetchMsgCount();

    window.addEventListener("notification-read", handleNotifRead);
    window.addEventListener("notification-read-all", handleNotifReadAll);
    window.addEventListener("refresh-unread-count", fetchNotifCount);
    window.addEventListener("refresh-unread-messages", handleMsgRead);

    return () => {
      unsubNotif();
      unsubMsg();
      window.removeEventListener("notification-read", handleNotifRead);
      window.removeEventListener("notification-read-all", handleNotifReadAll);
      window.removeEventListener("refresh-unread-count", fetchNotifCount);
      window.removeEventListener("refresh-unread-messages", handleMsgRead);
    };
  }, []);

  const handleLogout = () => {
    wsClient.disconnect();
    localStorage.removeItem("knots_token");
    localStorage.removeItem("knots_refresh_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Helper for role tag label
  const getRoleTagLabel = (): string => {
    const rawRole = user?.role?.name?.toLowerCase().trim() || "";
    if (rawRole.includes("student")) return "Student";
    if (rawRole.includes("alumni")) return "Alumni";
    if (rawRole.includes("faculty")) return "Faculty";
    if (rawRole.includes("hod")) return "HOD";
    if (rawRole.includes("controller")) return "Controller";
    if (rawRole.includes("admin")) return "Admin";
    if (rawRole.includes("dean")) return "Dean";
    if (rawRole.includes("ceo")) return "CEO";
    if (rawRole.includes("principal")) return "Principal";
    if (rawRole.includes("tpo")) return "TPO";
    if (rawRole) return rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
    return "Student";
  };

  const roleTag = getRoleTagLabel();

  // User avatar info
  const fullName =
    `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Campus Member");
  const avatarUrl = getMediaUrl(user?.profile?.profile_picture);
  const userInitial = fullName.charAt(0).toUpperCase();
  const isCentralAdmin =
    roleTag === "Admin" ||
    (user?.role?.name?.toLowerCase().includes("admin") ?? false) ||
    (user?.role?.name?.toLowerCase().includes("central admin") ?? false) ||
    user?.role_id === 1;

  const isFaculty =
    roleTag === "Faculty" ||
    (user?.role?.name?.toLowerCase().includes("faculty") ?? false) ||
    (user?.role?.name?.toLowerCase().includes("coordinator") ?? false) ||
    user?.role_id === 6;

  const isController =
    !isFaculty &&
    (roleTag === "Controller" ||
      isCentralAdmin ||
      (user?.role?.name?.toLowerCase().includes("controller") ?? false) ||
      user?.role_id === 8);

  const isTpo =
    roleTag === "TPO" ||
    (user?.role?.name?.toLowerCase().includes("tpo") ?? false);

  const isHod =
    roleTag === "HOD" ||
    (user?.role?.name?.toLowerCase().includes("hod") ?? false) ||
    user?.role_id === 10;

  // Create post submit handler
  const handleModalPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedFile) return;

    setSubmittingPost(true);
    try {
      let imageUrl: string | null = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        imageUrl = await apiRequest<string>("/posts/upload-image", {
          method: "POST",
          body: formData,
        });
      }

      const newPost = await apiRequest<any>("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: postContent.trim() || (selectedFile ? "Shared an attachment" : ""),
          image_url: imageUrl,
          visibility: "PUBLIC",
        }),
      });

      // Dispatch global event so feed can pick up new post
      window.dispatchEvent(new CustomEvent("post-created", { detail: newPost }));
      window.dispatchEvent(new Event("refresh-feed"));

      // Reset modal
      setPostContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setCreatePostOpen(false);

      // If not on feed, navigate to feed
      if (location.pathname !== "/" && location.pathname !== "/feed") {
        navigate("/");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create post.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const isHomeActive = location.pathname === "/" || location.pathname === "/feed";
  const isFriendsActive = location.pathname.startsWith("/connections");
  const isNotificationsActive = location.pathname.startsWith("/notifications");
  const isMessagesActive = location.pathname.startsWith("/messaging");
  const isSettingsActive = location.pathname.startsWith("/settings");
  const isOpportunitiesActive =
    location.pathname.startsWith("/jobs") ||
    location.pathname.startsWith("/opportunities") ||
    location.pathname.startsWith("/faculty-opportunities");
  const isClubsActive = location.pathname.startsWith("/clubs");
  const isEventsActive = location.pathname.startsWith("/events");

  return (
    <div className="min-h-screen bg-[#F8F6FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-[#4B63D2]/20">
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR (As shown in wireframe)                */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center">
          
          {/* Left: Knots Infinity Logo (flex-1 to balance right side) */}
          <div className="flex-1 flex items-center justify-start">
            <Link
              to="/"
              className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02] shrink-0"
              title="Knots Home Feed"
            >
              <KnotsLogo size="lg" />
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors">
                Knots
              </span>
            </Link>
          </div>

          {/* Center: Standard Diagram Icons in Blue Boxes - Centered & Flexed well throughout navbar */}
          <div className="flex-[2] flex items-center justify-center">
            <nav className="flex items-center justify-center gap-6 sm:gap-10 md:gap-16 lg:gap-22">
              {/* Home Feed Icon */}
              <Link
                to="/"
                title="Home Feed"
                className={`relative p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30 hover:shadow-lg hover:shadow-[#4B63D2]/40 hover:scale-110 active:scale-95 ${
                  isHomeActive
                    ? "ring-2 ring-[#4B63D2] ring-offset-2 dark:ring-offset-[#111827] scale-105"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <Home className="w-6 h-6 sm:w-7 sm:h-7" />
              </Link>

              {/* Friends Icon */}
              <Link
                to="/connections"
                title="Friends & Connections"
                className={`relative p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30 hover:shadow-lg hover:shadow-[#4B63D2]/40 hover:scale-110 active:scale-95 ${
                  isFriendsActive
                    ? "ring-2 ring-[#4B63D2] ring-offset-2 dark:ring-offset-[#111827] scale-105"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </Link>

              {/* Notification Icon */}
              <Link
                to="/notifications"
                title="Notifications"
                className={`relative p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30 hover:shadow-lg hover:shadow-[#4B63D2]/40 hover:scale-110 active:scale-95 ${
                  isNotificationsActive
                    ? "ring-2 ring-[#4B63D2] ring-offset-2 dark:ring-offset-[#111827] scale-105"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-[#FFD21A] text-[#1E2746] text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white dark:border-[#111827]">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Message Icon */}
              <Link
                to="/messaging"
                title="Messages"
                className={`relative p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/30 hover:shadow-lg hover:shadow-[#4B63D2]/40 hover:scale-110 active:scale-95 ${
                  isMessagesActive
                    ? "ring-2 ring-[#4B63D2] ring-offset-2 dark:ring-offset-[#111827] scale-105"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-[#FFD21A] text-[#1E2746] text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white dark:border-[#111827]">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Right: Profile Avatar & Role Tag (flex-1 to balance left side) */}
          <div className="flex-1 flex items-center justify-end">
            <div className="relative flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
                title={`Logged in as ${fullName} (${roleTag})`}
              >
                {/* Profile Circle Avatar */}
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#4B63D2]/40 group-hover:border-[#4B63D2] shadow-xs group-hover:scale-105 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-sm text-white border-2 border-white dark:border-[#1F2937] shadow-xs group-hover:scale-105 transition-all">
                      {userInitial}
                    </div>
                  )}
                </div>

                {/* Tag Capsule underneath avatar */}
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-[#4B63D2]/10 text-[#4B63D2] dark:bg-[#4B63D2]/20 dark:text-[#818CF8] border border-[#4B63D2]/20 shadow-2xs group-hover:bg-[#4B63D2] group-hover:text-white transition-all">
                  {roleTag}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-14 w-60 bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-[#FAF9FD] dark:divide-[#1F2937]">
                    <div className="px-4 py-2">
                      <p className="text-xs font-black text-[#1E2746] dark:text-[#F1F5F9] truncate">
                        {fullName}
                      </p>
                      <p className="text-[10px] text-[#5851A4] dark:text-[#94A3B8] font-semibold truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      {isController && (
                        <Link
                          to="/controller"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#4B63D2] dark:text-[#818CF8] hover:bg-[#4B63D2]/10 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#4B63D2]" />
                          <span>{isCentralAdmin ? "Central Admin Dashboard" : "Department Dashboard"}</span>
                        </Link>
                      )}

                      {isTpo && (
                        <Link
                          to="/tpo"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>TPO Command Dashboard</span>
                        </Link>
                      )}

                      {isHod && (
                        <Link
                          to="/hod"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        >
                          <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>HOD Department Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#4B63D2]" />
                        <span>View Profile</span>
                      </Link>

                      <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8]">
                        <span>Appearance</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN CENTER CONTENT CANVAS (Feed in Middle)               */}
      {/* ============================================================ */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28">
        <Outlet />
      </main>

      {/* ============================================================ */}
      {/* 3. BOTTOM NAVIGATION BAR (DOCK) (As shown in wireframe)      */}
      {/* ============================================================ */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#EAE4F7] dark:border-[#1F2937] shadow-xl"
      >
        <div className="w-full px-6 sm:px-14 md:px-24 lg:px-36 xl:px-48 h-20 flex items-center justify-between relative">
          {/* Item 1: Settings */}
          <Link
            to="/settings"
            title="Settings"
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-200 ${
              isSettingsActive
                ? "text-[#4B63D2] scale-110 font-black"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:scale-105"
            }`}
          >
            <Settings className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[11px] font-bold mt-1">Settings</span>
          </Link>

          {/* Item 2: Opportunities */}
          <Link
            to="/jobs"
            title="Opportunities"
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-200 ${
              isOpportunitiesActive
                ? "text-[#4B63D2] scale-110 font-black"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:scale-105"
            }`}
          >
            <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[11px] font-bold mt-1">Opportunities</span>
          </Link>

          {/* Item 3 (Center): Prominent Elevated (+) Create Post Button */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setCreatePostOpen(true)}
              title="Create New Post"
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#4B63D2] to-[#5851A4] text-white flex items-center justify-center shadow-xl shadow-[#4B63D2]/40 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-white dark:border-[#111827] group"
            >
              <Plus className="w-8 h-8 sm:w-9 sm:h-9 text-[#FFD21A] group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Item 4: Clubs */}
          <Link
            to="/clubs"
            title="Clubs"
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-200 ${
              isClubsActive
                ? "text-[#4B63D2] scale-110 font-black"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:scale-105"
            }`}
          >
            <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[11px] font-bold mt-1">Clubs</span>
          </Link>

          {/* Item 5: Events */}
          <Link
            to="/events"
            title="Events"
            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-200 ${
              isEventsActive
                ? "text-[#4B63D2] scale-110 font-black"
                : "text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:scale-105"
            }`}
          >
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[11px] font-bold mt-1">Events</span>
          </Link>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* 4. MODAL: QUICK CREATE POST (Triggered by (+) Button)        */}
      {/* ============================================================ */}
      {createPostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] border border-[#EAE4F7] dark:border-[#1F2937] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#4B63D2]/10 text-[#4B63D2] rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  Create a Post
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreatePostOpen(false)}
                className="p-1.5 text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalPostSubmit} className="p-5 space-y-4">
              {/* User Identity Info */}
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-10 h-10 rounded-full object-cover border border-[#EAE4F7] dark:border-[#1F2937]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-sm text-white">
                    {userInitial}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9]">
                    {fullName}
                  </p>
                  <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full">
                    {roleTag}
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening on campus? Share an update, doubt, or announcement..."
                rows={4}
                className="w-full bg-[#FAF9FD] dark:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#334155] rounded-2xl p-3.5 text-xs sm:text-sm text-[#1E2746] dark:text-[#F1F5F9] placeholder-[#9188BE] focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/20 focus:border-[#4B63D2] transition-all resize-none font-medium"
              />

              {/* Attachment Preview */}
              {previewUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-[#EAE4F7] dark:border-[#334155] max-h-48">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {selectedFile && !previewUrl && (
                <div className="flex items-center justify-between p-3 bg-[#4B63D2]/5 border border-[#4B63D2]/20 rounded-xl text-xs font-bold text-[#4B63D2]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-[#4B63D2]/10 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Actions & Audience */}
              <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPreviewUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setPreviewUrl(null);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#4B63D2] px-3 py-1.5 rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-transparent hover:border-[#EAE4F7] transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#4B63D2]" />
                    <span>Media / PDF</span>
                  </button>


                </div>

                <button
                  type="submit"
                  disabled={submittingPost || (!postContent.trim() && !selectedFile)}
                  className="px-5 py-2 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-[#4B63D2]/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {submittingPost ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <span>Post</span>
                      <Send className="w-3 h-3 text-[#FFD21A]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
