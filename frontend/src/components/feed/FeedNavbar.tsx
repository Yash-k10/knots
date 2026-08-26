import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Rss,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";

import KnotsLogo from "../common/KnotsLogo";
import { apiRequest, getMediaUrl } from "../../services/api";

interface UserProfileSummary {
  id: number;
  email: string;
  role?: { name: string };
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    department?: string | null;
  } | null;
}

export default function FeedNavbar() {
  const location = useLocation();
  const [user, setUser] = useState<UserProfileSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userData, notifData] = await Promise.all([
          apiRequest<UserProfileSummary>("/users/me").catch(() => null),
          apiRequest<{ unread_count: number }>("/notifications/unread-count").catch(() => ({ unread_count: 0 })),
        ]);
        if (userData) setUser(userData);
        if (notifData) setUnreadCount(notifData.unread_count || 0);
      } catch (err) {
        // Silently handled
      }
    };

    fetchUser();

    const handleRead = () => setUnreadCount((prev) => Math.max(0, prev - 1));
    const handleReadAll = () => setUnreadCount(0);

    window.addEventListener("notification-read", handleRead);
    window.addEventListener("notification-read-all", handleReadAll);

    return () => {
      window.removeEventListener("notification-read", handleRead);
      window.removeEventListener("notification-read-all", handleReadAll);
    };
  }, []);

  const navLinks = [
    { name: "Feed", path: "/feed", icon: Rss },
    { name: "Ties", path: "/connections", icon: Users },
    { name: "Jobs", path: "/jobs", icon: Briefcase },
    { name: "Events", path: "/events", icon: Calendar },
    { name: "Messages", path: "/messaging", icon: MessageSquare },
    { name: "Notifications", path: "/notifications", icon: Bell, badge: unreadCount },
  ];

  const fullName =
    `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const avatarUrl = getMediaUrl(user?.profile?.profile_picture);
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#EAE4F7] shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* 1. Logo on top left */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <KnotsLogo size="md" />
            <div className="hidden sm:block">
              <span className="text-xl font-black tracking-tight text-[#1E2746] group-hover:text-[#4B63D2] transition-colors">
                KNOTS
              </span>
              <span className="ml-2 text-[10px] font-bold text-[#4B63D2] bg-[#4B63D2]/10 px-2 py-0.5 rounded-full border border-[#4B63D2]/20">
                Feed
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Navbar with navigating pages */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/25"
                    : "text-[#5851A4] hover:bg-[#FAF9FD] hover:text-[#1E2746]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#FFD21A]" : "text-[#5851A4]"}`} />
                <span className="hidden md:inline">{link.name}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#FFD21A] text-[#1E2746] rounded-full animate-pulse">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. User Profile with PFP */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl hover:bg-[#FAF9FD] border border-transparent hover:border-[#EAE4F7] transition-all group"
            title="View Your Profile"
          >
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-[#1E2746] group-hover:text-[#4B63D2] transition-colors truncate max-w-[120px]">
                {fullName}
              </p>
              <p className="text-[10px] font-medium text-[#5851A4] truncate max-w-[120px]">
                {user?.role?.name || "Student"}
              </p>
            </div>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-9 w-9 rounded-xl object-cover border border-[#EAE4F7] shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#5851A4] to-[#4B63D2] flex items-center justify-center font-black text-sm text-white shadow-sm shadow-[#4B63D2]/25 group-hover:scale-105 transition-transform">
                {initial}
              </div>
            )}
          </Link>

          <Link
            to="/settings"
            className="p-2 text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD] rounded-xl border border-transparent hover:border-[#EAE4F7] transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
