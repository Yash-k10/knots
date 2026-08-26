import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Rss,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  Bell,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { wsClient } from "../../services/websocket";
import { apiRequest, getMediaUrl } from "../../services/api";
import GlobalSearchBar from "./GlobalSearchBar";
import KnotsLogo from "../common/KnotsLogo";

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
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Initialize WebSocket connection for real-time notifications
    wsClient.connect();

    // Fetch current logged in user details, role & profile
    const fetchCurrentUser = async () => {
      try {
        const userData = await apiRequest<CurrentUser>("/users/me");
        setUser(userData);
      } catch (err) {
        // Fallback user fetch error
      }
    };
    fetchCurrentUser();

    // Fetch initial unread count from API
    const fetchUnreadCount = async () => {
      try {
        const res = await apiRequest<{ unread_count: number }>(
          "/notifications/unread-count",
        );
        setUnreadNotifications(res.unread_count || 0);
      } catch (err) {
        // Fallback default
      }
    };
    fetchUnreadCount();

    // Subscribe to real-time WebSocket notification pushes
    const unsubscribe = wsClient.onNotification((data) => {
      if (typeof data.unread_count === "number") {
        setUnreadNotifications(data.unread_count);
      } else {
        setUnreadNotifications((prev) => prev + 1);
      }
    });

    // Handle local notification read events
    const handleNotificationRead = () => {
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    };

    const handleNotificationReadAll = () => {
      setUnreadNotifications(0);
    };

    window.addEventListener("notification-read", handleNotificationRead);
    window.addEventListener("notification-read-all", handleNotificationReadAll);
    window.addEventListener("refresh-unread-count", fetchUnreadCount);

    return () => {
      unsubscribe();
      window.removeEventListener("notification-read", handleNotificationRead);
      window.removeEventListener("notification-read-all", handleNotificationReadAll);
      window.removeEventListener("refresh-unread-count", fetchUnreadCount);
    };
  }, []);

  const handleLogout = () => {
    wsClient.disconnect();
    localStorage.removeItem("knots_token");
    localStorage.removeItem("knots_refresh_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isAdmin =
    user?.role_id === 1 || user?.role?.name?.toLowerCase() === "admin";

  const navLinks = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Feed", path: "/feed", icon: Rss },
    { name: "Ties", path: "/connections", icon: Users },
    { name: "Opportunities", path: "/jobs", icon: Briefcase },
    { name: "Events", path: "/events", icon: Calendar },
    { name: "Messages", path: "/messaging", icon: MessageSquare },

    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      badge: unreadNotifications,
    },
    ...(isAdmin
      ? [{ name: "Admin", path: "/admin", icon: ShieldAlert, adminOnly: true }]
      : []),
  ];

  const fullName =
    `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const avatarUrl = getMediaUrl(user?.profile?.profile_picture);
  const userInitial = fullName.charAt(0).toUpperCase();
  const roleBadgeLabel = user?.role?.name || (isAdmin ? "Admin" : "Student");

  return (
    <div className="min-h-screen bg-[#F8F6FD] text-[#1E2746] flex flex-col font-sans">
      {/* ============================================================ */}
      {/* UNIVERSAL TOP NAVBAR (NO SIDE NAVBAR)                        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#EAE4F7] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* 1. Brand Logo on Top Left */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/feed" className="flex items-center gap-2 group">
              <KnotsLogo size="md" />
              <div className="hidden sm:block">
                <span className="text-xl font-black tracking-tight text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                  KNOTS
                </span>
                <span className="ml-2 text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                  SBJIT
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2">
            <GlobalSearchBar />
          </div>

          {/* 3. Navigation Page Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto py-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25"
                      : "text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#FFD21A]" : "text-[#5851A4]"
                    }`}
                  />
                  <span>{link.name}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full animate-pulse">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 4. User Profile with PFP & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile notification bell */}
            <Link
              to="/notifications"
              className="lg:hidden relative p-2 text-[#5851A4] hover:text-[#1E2746] rounded-xl hover:bg-[#FAF9FD] transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFD21A] text-[10px] font-black text-[#1E2746] shadow-sm">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Profile Capsule with PFP */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-2xl hover:bg-[#FAF9FD] border border-[#EAE4F7] hover:border-[#C8B6E2] transition-all group"
              title="View Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#1E2746] group-hover:text-[#4B63D2] transition-colors truncate max-w-[110px]">
                  {fullName}
                </p>
                <p className="text-[10px] font-semibold text-[#5851A4] truncate max-w-[110px]">
                  {roleBadgeLabel}
                </p>
              </div>

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-9 w-9 rounded-xl object-cover border border-[#EAE4F7] shadow-sm group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-sm text-white shadow-sm shadow-[#4B63D2]/20 group-hover:scale-105 transition-transform">
                  {userInitial}
                </div>
              )}
            </Link>

            {/* Settings Link */}
            <Link
              to="/settings"
              className="hidden sm:flex p-2.5 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-xl border border-[#EAE4F7] hover:border-[#C8B6E2] transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#5851A4] hover:text-[#1E2746] rounded-xl hover:bg-[#FAF9FD] border border-[#EAE4F7] transition-all"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#EAE4F7] px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200 shadow-md">
            <div className="mb-3">
              <GlobalSearchBar />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/25"
                        : "text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746] border border-[#EAE4F7]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[#EAE4F7] flex items-center justify-between">
              <Link
                to="/settings"
                className="flex items-center gap-2 text-xs font-bold text-[#5851A4] hover:text-[#1E2746] py-1"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 py-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* MAIN APPLICATION CONTENT CANVAS (FULL WIDTH, NO SIDEBAR)     */}
      {/* ============================================================ */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
