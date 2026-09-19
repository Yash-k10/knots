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
  User as UserIcon,
  Compass,
  Send,
  TrendingUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
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

interface NavLinkItem {
  name: string;
  path: string;
  icon: any;
  badge?: number;
  section?: "main" | "communication" | "role" | "system" | "dept_mgmt" | "mgmt_connect" | "reports_analytics";
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);

  // Collapsible sections state for HOD and other hierarchical views
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dept_mgmt: true,
    mgmt_connect: true,
    reports_analytics: true,
    role: true,
    communication: true,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

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
      section: "communication",
    };
    const baseMessages: NavLinkItem = {
      name: "Messages",
      path: "/messaging",
      icon: MessageSquare,
      badge: unreadMessages,
      section: "communication",
    };
    const baseEvents: NavLinkItem = {
      name: "Events",
      path: "/events",
      icon: Calendar,
      section: "main",
    };


    switch (roleName) {
      case "alumni":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Campus Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Opportunities", path: "/jobs", icon: Briefcase, section: "main" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "student":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Opportunities", path: "/jobs", icon: Briefcase, section: "main" },
          { name: "Clubs", path: "/clubs", icon: Compass, section: "main" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "faculty":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Students", path: "/students", icon: GraduationCap, section: "role" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "hod":
        return [
          // 1. Main Navigation
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Campus Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Events", path: "/events", icon: Calendar, section: "main" },

          // 2. Department (Collapsible)
          { name: "My Department", path: "/department", icon: Layers, section: "dept_mgmt" },
          { name: "Students", path: "/students", icon: GraduationCap, section: "dept_mgmt" },
          { name: "Faculty", path: "/department?tab=faculty", icon: UserCog, section: "dept_mgmt" },
          { name: "Alumni", path: "/department?tab=alumni", icon: Users, section: "dept_mgmt" },
          { name: "Placements & Internships", path: "/placements", icon: Briefcase, section: "dept_mgmt" },
          { name: "Achievements", path: "/department?tab=achievements", icon: Award, section: "dept_mgmt" },
          { name: "Clubs & Events", path: "/clubs", icon: Compass, section: "dept_mgmt" },

          // 3. Management Connect (Collapsible)
          { name: "Announcements", path: "/management-connect?tab=announcements", icon: Bell, section: "mgmt_connect" },
          { name: "Requests", path: "/management-connect?tab=requests", icon: Send, badge: 3, section: "mgmt_connect" },
          { name: "Approvals", path: "/management-connect?tab=approvals", icon: FileCheck2, badge: 2, section: "mgmt_connect" },
          { name: "Messages", path: "/messaging", icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : 4, section: "mgmt_connect" },

          // 4. Reports & Analytics (Collapsible)
          { name: "Department Analytics", path: "/department-analytics", icon: TrendingUp, section: "reports_analytics" },
          { name: "Reports", path: "/reports", icon: BarChart3, section: "reports_analytics" },

          baseNotifications,
        ];
      case "controller":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Opportunities", path: "/jobs", icon: Briefcase, section: "main" },
          { name: "Clubs", path: "/clubs", icon: Compass, section: "main" },
          { name: "Students", path: "/students", icon: GraduationCap, section: "role" },
          { name: "My Department", path: "/department", icon: Layers, section: "role" },
          { name: "Applications", path: "/applications", icon: FileCheck2, section: "role" },
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
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Users", path: "/admin", icon: UserCog, section: "role" },
          { name: "Departments", path: "/department", icon: Layers, section: "role" },
          { name: "Reports", path: "/reports", icon: BarChart3, section: "role" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "tpo":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Opportunities", path: "/jobs", icon: Briefcase, section: "main" },
          { name: "Students", path: "/students", icon: GraduationCap, section: "role" },
          { name: "Applications", path: "/applications", icon: FileCheck2, section: "role" },
          { name: "Placements", path: "/placements", icon: Award, section: "role" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "dean":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          {
            name: "Academic Overview",
            path: "/academic-overview",
            icon: BookOpen,
            section: "role",
          },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      case "principal":
      case "ceo":
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          { name: "Institution", path: "/institution", icon: Building, section: "role" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
      default:
        return [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
          { name: "Feed", path: "/feed", icon: Rss, section: "main" },
          { name: "Ties", path: "/connections", icon: Users, section: "main" },
          baseEvents,
          baseMessages,
          baseNotifications,
        ];
    }
  };

  const isLinkActive = (path: string) => {
    const currentFull = location.pathname + location.search;
    if (path === "/") {
      return location.pathname === "/" && !location.search;
    }
    if (path.includes("?")) {
      return currentFull === path;
    }
    if (path === "/department") {
      return (
        location.pathname === "/department" &&
        (!location.search || location.search === "?tab=overview")
      );
    }
    if (path.startsWith("/messaging")) {
      return location.pathname.startsWith("/messaging");
    }
    return location.pathname === path;
  };

  const navLinks = getRoleNavLinks();

  const mainLinks = navLinks.filter((l) => l.section === "main" || !l.section);
  const deptLinks = navLinks.filter((l) => l.section === "dept_mgmt");
  const mgmtLinks = navLinks.filter((l) => l.section === "mgmt_connect");
  const reportsLinks = navLinks.filter((l) => l.section === "reports_analytics");
  const roleLinks = navLinks.filter((l) => l.section === "role");
  const commLinks = navLinks.filter((l) => l.section === "communication");

  const totalMgmtBadges = mgmtLinks.reduce(
    (sum, l) => sum + (l.badge && l.badge > 0 ? l.badge : 0),
    0
  );

  const fullName =
    `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const avatarUrl = getMediaUrl(user?.profile?.profile_picture);
  const userInitial = fullName.charAt(0).toUpperCase();
  const roleBadgeLabel =
    roleName === "alumni"
      ? "Alumni • SBJIT"
      : user?.role?.name || (isAdmin ? "Admin" : "Student");

  // Reusable Sidebar Navigation Content Component
  const renderSidebarLinks = (collapsedRail: boolean = false) => {
    if (collapsedRail) {
      return (
        <div className="flex flex-col h-full justify-between py-3">
          {/* Rail Icon Links */}
          <div className="flex-1 overflow-y-auto px-2 space-y-3 no-scrollbar">
            {/* Main Links */}
            <div className="space-y-1">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    title={link.name}
                    className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                        : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? "text-[#FFD21A]" : ""
                      }`}
                    />
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFD21A] ring-2 ring-white dark:ring-[#111827]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Department Rail Section */}
            {deptLinks.length > 0 && (
              <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] space-y-1">
                {deptLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      title={`Department: ${link.name}`}
                      className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                          : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : ""
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Management Rail Section */}
            {mgmtLinks.length > 0 && (
              <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] space-y-1">
                {mgmtLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      title={`Management Connect: ${link.name}${link.badge ? ` (${link.badge})` : ""}`}
                      className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                          : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : ""
                        }`}
                      />
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full ring-1 ring-white dark:ring-[#111827]">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Reports Rail Section */}
            {reportsLinks.length > 0 && (
              <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] space-y-1">
                {reportsLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      title={`Reports & Analytics: ${link.name}`}
                      className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                          : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : ""
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Role links for other roles */}
            {roleLinks.length > 0 && (
              <div className="pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937] space-y-1">
                {roleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      title={link.name}
                      className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                          : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : ""
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rail Bottom Avatar */}
          <div className="pt-3 border-t border-[#EAE4F7] dark:border-[#1F2937] flex flex-col items-center gap-2">
            <Link to="/profile" title="My Profile">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-8 w-8 rounded-xl object-cover border border-[#EAE4F7] dark:border-[#1F2937]"
                />
              ) : (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-xs text-white">
                  {userInitial}
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full justify-between">
        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Section 1: Main Navigation (Directly visible) */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/80 dark:text-[#94A3B8]/80">
              Main Navigation
            </p>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                      : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                      }`}
                    />
                    <span className="truncate">{link.name}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full shrink-0 animate-pulse">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Section 2: Department (Collapsible Section) */}
          {deptLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
              <button
                type="button"
                onClick={() => toggleSection("dept_mgmt")}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/90 dark:text-[#94A3B8]/90 hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-lg transition-colors cursor-pointer group select-none"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#4B63D2]" />
                  <span>Department</span>
                  {deptLinks.some((l) => isLinkActive(l.path)) && !expandedSections.dept_mgmt && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4B63D2]" />
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5851A4] dark:text-[#94A3B8] transition-transform duration-200 ${
                    expandedSections.dept_mgmt ? "transform rotate-0" : "transform -rotate-90"
                  }`}
                />
              </button>

              {expandedSections.dept_mgmt && (
                <div className="space-y-1 pl-2 border-l-2 border-[#EAE4F7] dark:border-[#1F2937] ml-3.5 my-1 animate-in fade-in duration-200">
                  {deptLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.path);
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                            : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                            }`}
                          />
                          <span className="truncate">{link.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Management Connect (Collapsible Section) */}
          {mgmtLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
              <button
                type="button"
                onClick={() => toggleSection("mgmt_connect")}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/90 dark:text-[#94A3B8]/90 hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-lg transition-colors cursor-pointer group select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Send className="w-3.5 h-3.5 text-[#4B63D2] shrink-0" />
                  <span className="truncate">Management Connect</span>
                  {!expandedSections.mgmt_connect && totalMgmtBadges > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full shrink-0">
                      {totalMgmtBadges}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5851A4] dark:text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                    expandedSections.mgmt_connect ? "transform rotate-0" : "transform -rotate-90"
                  }`}
                />
              </button>

              {expandedSections.mgmt_connect && (
                <div className="space-y-1 pl-2 border-l-2 border-[#EAE4F7] dark:border-[#1F2937] ml-3.5 my-1 animate-in fade-in duration-200">
                  {mgmtLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.path);
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                            : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                            }`}
                          />
                          <span className="truncate">{link.name}</span>
                        </div>
                        {link.badge !== undefined && link.badge > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full shrink-0">
                            {link.badge > 99 ? "99+" : link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Reports & Analytics (Collapsible Section) */}
          {reportsLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
              <button
                type="button"
                onClick={() => toggleSection("reports_analytics")}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/90 dark:text-[#94A3B8]/90 hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-lg transition-colors cursor-pointer group select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="w-3.5 h-3.5 text-[#4B63D2] shrink-0" />
                  <span className="truncate">Reports & Analytics</span>
                  {reportsLinks.some((l) => isLinkActive(l.path)) && !expandedSections.reports_analytics && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4B63D2]" />
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5851A4] dark:text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                    expandedSections.reports_analytics ? "transform rotate-0" : "transform -rotate-90"
                  }`}
                />
              </button>

              {expandedSections.reports_analytics && (
                <div className="space-y-1 pl-2 border-l-2 border-[#EAE4F7] dark:border-[#1F2937] ml-3.5 my-1 animate-in fade-in duration-200">
                  {reportsLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.path);
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                            : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                            }`}
                          />
                          <span className="truncate">{link.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section: General Campus Management for Other Roles */}
          {roleLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
              <p className="px-3 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/80 dark:text-[#94A3B8]/80">
                Campus Management
              </p>
              {roleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                        : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                        }`}
                      />
                      <span className="truncate">{link.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Section: Communication & Inbox */}
          {commLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
              <p className="px-3 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/80 dark:text-[#94A3B8]/80">
                Inbox & Alerts
              </p>
              {commLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                        : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#FFD21A]" : "text-[#5851A4] dark:text-[#94A3B8]"
                        }`}
                      />
                      <span className="truncate">{link.name}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full shrink-0">
                        {link.badge > 99 ? "99+" : link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Section: Bottom Navigation / Preferences */}
          <div className="space-y-1 pt-2 border-t border-[#EAE4F7] dark:border-[#1F2937]">
            <p className="px-3 text-[10px] font-black tracking-wider uppercase text-[#5851A4]/80 dark:text-[#94A3B8]/80">
              Preferences
            </p>
            <Link
              to="/profile"
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/profile"
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                  : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>My Profile</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/settings"
                  ? "bg-[#4B63D2] text-white shadow-sm shadow-[#4B63D2]/30"
                  : "text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] hover:text-[#1E2746] dark:hover:text-[#F1F5F9]"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer User Capsule */}
        <div className="p-3 border-t border-[#EAE4F7] dark:border-[#1F2937] bg-[#FAF9FD]/80 dark:bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
              title="View Profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-8 w-8 rounded-xl object-cover border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-xs text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] truncate group-hover:text-[#4B63D2] transition-colors">
                  {fullName}
                </p>
                <p className="text-[10px] font-semibold text-[#5851A4] dark:text-[#94A3B8] truncate">
                  {roleBadgeLabel}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-900/40 transition-colors cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F6FD] dark:bg-[#0B0F19] text-[#1E2746] dark:text-[#F1F5F9] flex font-sans transition-colors duration-200">
      {/* ============================================================ */}
      {/* 1. DESKTOP PERMANENT SCROLLING SIDEBAR (LEFT)                */}
      {/* ============================================================ */}
      <aside
        className={`hidden lg:flex flex-col ${
          isDesktopCollapsed ? "w-20" : "w-64"
        } bg-white dark:bg-[#111827] border-r border-[#EAE4F7] dark:border-[#1F2937] h-screen sticky top-0 z-30 shrink-0 select-none shadow-xs transition-all duration-300`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center justify-between px-4 border-b border-[#EAE4F7] dark:border-[#1F2937] shrink-0 transition-all`}
        >
          {!isDesktopCollapsed ? (
            <>
              <Link to="/feed" className="flex items-center gap-2.5 group min-w-0">
                <KnotsLogo size="md" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xl font-black tracking-tight text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors truncate">
                    KNOTS
                  </span>
                  <span className="text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 dark:bg-[#4B63D2]/20 px-2 py-0.5 rounded-full border border-[#4B63D2]/20 shrink-0">
                    SBJIT
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                title="Collapse sidebar (Icon-only)"
                className="p-1.5 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] rounded-xl border border-transparent hover:border-[#EAE4F7] dark:hover:border-[#1F2937] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(false)}
                title="Expand sidebar"
                className="p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#4B63D2] dark:hover:text-[#4B63D2] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] rounded-xl transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav links */}
        <div className="flex-1 overflow-hidden">
          {renderSidebarLinks(isDesktopCollapsed)}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE DRAWER SIDEBAR MODAL (< lg)                         */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white dark:bg-[#111827] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header with Close button */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#EAE4F7] dark:border-[#1F2937]">
              <div className="flex items-center gap-2">
                <KnotsLogo size="md" />
                <span className="text-lg font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  KNOTS
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#5851A4] dark:text-[#94A3B8] hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] rounded-xl border border-[#EAE4F7] dark:border-[#1F2937]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Content */}
            <div className="flex-1 overflow-hidden">
              {renderSidebarLinks(false)}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. RIGHT CONTENT AREA WITH 100% WIDTH TOP BAR                */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        {/* Universal Clean 100% Top Header */}
        <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EAE4F7] dark:border-[#1F2937] shadow-xs">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Mobile Drawer Button (< lg) & Brand Logo for mobile */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] transition-all cursor-pointer shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="lg:hidden flex items-center gap-1.5">
                <KnotsLogo size="sm" />
                <span className="text-base font-black text-[#1E2746] dark:text-[#F1F5F9]">
                  KNOTS
                </span>
              </div>
            </div>

            {/* Center: Expansive 100% Global Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto">
              <GlobalSearchBar />
            </div>

            {/* Right: Quick Action Controls (Theme, Notifications, Profile) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Messages Shortcut */}
              <Link
                to="/messaging"
                className="relative p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] transition-all shrink-0"
                title="Direct Messages"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#4B63D2] text-[10px] font-black text-white shadow-xs animate-pulse">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications Shortcut */}
              <Link
                to="/notifications"
                className="relative p-2 text-[#5851A4] dark:text-[#94A3B8] hover:text-[#1E2746] dark:hover:text-[#F1F5F9] rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] transition-all shrink-0"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FFD21A] text-[10px] font-black text-[#1E2746] shadow-xs">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Profile Capsule (Tablet/Desktop Top Right) */}
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 p-1.5 pl-2.5 rounded-xl hover:bg-[#FAF9FD] dark:hover:bg-[#1E293B] border border-[#EAE4F7] dark:border-[#1F2937] hover:border-[#C8B6E2] dark:hover:border-[#4B63D2] transition-all group shrink-0"
                title="View Profile"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-[#1E2746] dark:text-[#F1F5F9] group-hover:text-[#4B63D2] transition-colors truncate max-w-[110px]">
                    {fullName}
                  </p>
                  <p className="text-[10px] font-semibold text-[#5851A4] dark:text-[#94A3B8] truncate max-w-[110px]">
                    {roleBadgeLabel}
                  </p>
                </div>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-7 w-7 rounded-lg object-cover border border-[#EAE4F7] dark:border-[#1F2937] shadow-xs shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0">
                    {userInitial}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Application Page Content Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
