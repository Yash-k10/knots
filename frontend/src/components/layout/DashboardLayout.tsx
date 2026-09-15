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
  GraduationCap,
  Layers,
  FileCheck2,
  Award,
  BarChart3,
  BookOpen,
  Building,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { wsClient } from "../../services/websocket";
import { apiRequest, getMediaUrl } from "../../services/api";
import GlobalSearchBar from "./GlobalSearchBar";
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
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
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

    // Fetch unread messages count from API
    const fetchUnreadMessagesCount = async () => {
      try {
        const res = await apiRequest<{ total_unread: number }>(
          "/messages/unread/count",
        );
        setUnreadMessages(res.total_unread || 0);
      } catch (err) {
        // Fallback default
      }
    };
    fetchUnreadMessagesCount();

    // Subscribe to real-time WebSocket notification pushes
    const unsubscribeNotif = wsClient.onNotification((data) => {
      if (typeof data.unread_count === "number") {
        setUnreadNotifications(data.unread_count);
      } else {
        setUnreadNotifications((prev) => prev + 1);
      }
    });

    // Subscribe to real-time WebSocket direct message pushes
    const unsubscribeMsg = wsClient.onMessage(() => {
      setUnreadMessages((prev) => prev + 1);
    });

    // Handle local notification read events
    const handleNotificationRead = () => {
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    };

    const handleNotificationReadAll = () => {
      setUnreadNotifications(0);
    };

    const handleMessagesRead = () => {
      fetchUnreadMessagesCount();
    };

    window.addEventListener("notification-read", handleNotificationRead);
    window.addEventListener("notification-read-all", handleNotificationReadAll);
    window.addEventListener("refresh-unread-count", fetchUnreadCount);
    window.addEventListener("refresh-unread-messages", handleMessagesRead);

    return () => {
      unsubscribeNotif();
      unsubscribeMsg();
      window.removeEventListener("notification-read", handleNotificationRead);
      window.removeEventListener("notification-read-all", handleNotificationReadAll);
      window.removeEventListener("refresh-unread-count", fetchUnreadCount);
      window.removeEventListener("refresh-unread-messages", handleMessagesRead);
    };
  }, []);

  const handleLogout = () => {
    wsClient.disconnect();
    localStorage.removeItem("knots_token");
    localStorage.removeItem("knots_refresh_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  interface NavLinkItem {
    name: string;
    path: string;
    icon: any;
    badge?: number;
  }

  const roleName = user?.role?.name?.toLowerCase().trim() || "";
  const isAdmin =
    user?.role_id === 1 ||
    roleName === "admin" ||
    roleName === "super admin" ||
    roleName === "superadmin" ||
    roleName === "central admin";

  const getRoleNavLinks = (): NavLinkItem[] => {
    const baseNotifications: NavLinkItem = {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      badge: unreadNotifications,
    };
    const baseMessages: NavLinkItem = {
      name: "Messages",
      path: "/messaging",
      icon: MessageSquare,
      badge: unreadMessages,
    };
    const baseEvents: NavLinkItem = {
      name: "Events",
      path: "/events",
      icon: Calendar,
    };

    switch (roleName) {
      case "student":
      case "alumni":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          { name: "Opportunities", path: "/jobs", icon: Briefcase },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "faculty":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          { name: "Students", path: "/students", icon: GraduationCap },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "hod":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          { name: "Department", path: "/department", icon: Layers },
          { name: "Reports", path: "/reports", icon: BarChart3 },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "controller":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Department", path: "/department", icon: Layers },
          { name: "Applications", path: "/applications", icon: FileCheck2 },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "central admin":
      case "admin":
      case "super admin":
      case "superadmin":
      case "management":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Users", path: "/admin", icon: UserCog },
          { name: "Departments", path: "/department", icon: Layers },
          { name: "Reports", path: "/reports", icon: BarChart3 },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "tpo":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Students", path: "/students", icon: GraduationCap },
          { name: "Opportunities", path: "/jobs", icon: Briefcase },
          { name: "Applications", path: "/applications", icon: FileCheck2 },
          { name: "Placements", path: "/placements", icon: Award },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "dean":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          {
            name: "Academic Overview",
            path: "/academic-overview",
            icon: BookOpen,
          },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "principal":
      case "ceo":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          { name: "Institution", path: "/institution", icon: Building },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      default:
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard },
          { name: "Feed", path: "/feed", icon: Rss },
          { name: "Ties", path: "/connections", icon: Users },
          { name: "Opportunities", path: "/jobs", icon: Briefcase },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
    }
  };

  const navLinks = getRoleNavLinks();

  const fullName =
    `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const avatarUrl = getMediaUrl(user?.profile?.profile_picture);
  const userInitial = fullName.charAt(0).toUpperCase();
  const roleBadgeLabel = user?.role?.name || (isAdmin ? "Admin" : "Student");

  return (
    <div className="min-h-screen bg-[#F8F6FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      {/* ============================================================ */}
      {/* UNIVERSAL TOP NAVBAR (NO SIDE NAVBAR)                        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EAE4F7] dark:border-[#1F2937] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* 1. Brand Logo on Top Left */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/feed" className="flex items-center gap-2 group">
              <KnotsLogo size="md" />
              <div className="hidden sm:block">
                <span className="text-xl font-black tracking-tight text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors">
                  KNOTS
                </span>
                <span className="ml-2 text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                  SBJIT
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Global Search Bar */}
          <div className="hidden md:flex flex-1 min-w-[200px] max-w-sm lg:max-w-md mx-2 lg:mx-3 shrink">
            <GlobalSearchBar />
          </div>

          {/* 3. Navigation Page Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 py-1 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25"
                      : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                    }`}
                  />
                  <span>{link.name}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full animate-pulse shrink-0">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 4. User Profile with PFP & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile notification bell */}
            <Link
              to="/notifications"
              className="xl:hidden relative p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] transition-all shrink-0"
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
              className="flex items-center gap-2 p-1.5 pl-2 rounded-2xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#C8B6E2] dark:hover:border-[#4B63D2] transition-all group shrink-0"
              title="View Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors truncate max-w-[100px] lg:max-w-[110px]">
                  {fullName}
                </p>
                <p className="text-[10px] font-semibold text-[#5851A4] dark:text-[#94A3B8] truncate max-w-[100px] lg:max-w-[110px]">
                  {roleBadgeLabel}
                </p>
              </div>

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover border border-[#EAE4F7] dark:border-[#1F2937] shadow-sm group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-sm shadow-[#4B63D2]/20 group-hover:scale-105 transition-transform shrink-0">
                  {userInitial}
                </div>
              )}
            </Link>

            {/* Settings Link */}
            <Link
              to="/settings"
              className="hidden sm:flex p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] rounded-xl border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#C8B6E2] dark:hover:border-[#4B63D2] transition-all shrink-0"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] transition-all shrink-0"
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
          <div className="xl:hidden bg-white dark:bg-[#111827] border-b border-[#EAE4F7] dark:border-[#1F2937] px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200 shadow-md">
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
                        : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] border border-[#EAE4F7] dark:border-[#1F2937]"
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
            <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] flex items-center justify-between">
              <Link
                to="/settings"
                className="flex items-center gap-2 text-xs font-bold text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] py-1"
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
