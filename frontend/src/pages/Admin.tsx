import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Search,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ArrowUpRight,
  Flag,
  Check,
  Ban,
  Clock,
  ShieldAlert,
  Terminal,
  Filter,
} from "lucide-react";
import {
  getDashboardStats,
  getAdminUsers,
  banUser,
  unbanUser,
  deleteAdminUser,
  getAuditLogs,
  getFlaggedPosts,
  resolveFlaggedPost,
  deletePostAsAdmin,
  DashboardStats,
  AdminUser,
  AuditLog,
  FlaggedPost,
} from "../services/admin";
import { getMediaUrl } from "../services/api";

type ActiveTab = "overview" | "moderation" | "audit";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Global state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter states
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [moderationFilterStatus, setModerationFilterStatus] =
    useState<string>("all");

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<
    number | string | null
  >(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Confirmation modals
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [postToRemove, setPostToRemove] = useState<{
    postId: number;
    flagId?: number;
  } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [statsData, usersData, logsData, flaggedData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAdminUsers(0, 100).catch(() => []),
        getAuditLogs(0, 100).catch(() => []),
        getFlaggedPosts(0, 100).catch(() => []),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setAuditLogs(logsData);
      setFlaggedPosts(flaggedData);
    } catch (err: any) {
      console.error("Failed to load admin dashboard data:", err);
      setError(
        err?.message ||
          "Failed to fetch admin data. Please check your admin privileges.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // User Actions
  const handleBanToggle = async (user: AdminUser) => {
    setActionLoadingId(`user-ban-${user.id}`);
    try {
      if (user.is_active) {
        const updated = await banUser(user.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u)),
        );
        showToast(
          "success",
          `User ${updated.email} has been banned successfully.`,
        );
      } else {
        const updated = await unbanUser(user.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: true } : u)),
        );
        showToast(
          "success",
          `User ${updated.email} has been unbanned successfully.`,
        );
      }
      // Refresh stats & audit logs
      const [newStats, newLogs] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAuditLogs(0, 100).catch(() => []),
      ]);
      if (newStats) setStats(newStats);
      if (newLogs) setAuditLogs(newLogs);
    } catch (err: any) {
      showToast(
        "error",
        err?.message || `Failed to update status for ${user.email}`,
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showToast(
        "success",
        `User ${userToDelete.email} was permanently deleted.`,
      );
      setUserToDelete(null);
      // Refresh stats & audit logs
      const [newStats, newLogs] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAuditLogs(0, 100).catch(() => []),
      ]);
      if (newStats) setStats(newStats);
      if (newLogs) setAuditLogs(newLogs);
    } catch (err: any) {
      showToast(
        "error",
        err?.message || `Failed to delete user ${userToDelete.email}`,
      );
    } finally {
      setDeleting(false);
    }
  };

  // Moderation Actions
  const handleResolveFlag = async (
    flagId: number,
    action: "resolved" | "dismissed",
  ) => {
    setActionLoadingId(`flag-${flagId}`);
    try {
      const updated = await resolveFlaggedPost(flagId, action);
      setFlaggedPosts((prev) =>
        prev.map((f) =>
          f.id === flagId ? { ...f, status: updated.status } : f,
        ),
      );
      showToast("success", `Flag #${flagId} marked as ${action}.`);
      // Refresh audit logs
      const newLogs = await getAuditLogs(0, 100).catch(() => []);
      if (newLogs) setAuditLogs(newLogs);
    } catch (err: any) {
      showToast("error", err?.message || `Failed to resolve flag #${flagId}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemovePostConfirm = async () => {
    if (!postToRemove) return;
    setDeleting(true);
    try {
      await deletePostAsAdmin(postToRemove.postId);
      if (postToRemove.flagId) {
        setFlaggedPosts((prev) =>
          prev.map((f) =>
            f.id === postToRemove.flagId ? { ...f, status: "resolved" } : f,
          ),
        );
      } else {
        setFlaggedPosts((prev) =>
          prev.filter((f) => f.post_id !== postToRemove.postId),
        );
      }
      showToast(
        "success",
        `Post #${postToRemove.postId} has been removed as admin.`,
      );
      setPostToRemove(null);
      // Refresh stats & audit logs
      const [newStats, newLogs] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAuditLogs(0, 100).catch(() => []),
      ]);
      if (newStats) setStats(newStats);
      if (newLogs) setAuditLogs(newLogs);
    } catch (err: any) {
      showToast(
        "error",
        err?.message || `Failed to remove post #${postToRemove.postId}`,
      );
    } finally {
      setDeleting(false);
    }
  };

  // Filter helpers
  const filteredUsers = users.filter((user) => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      user.email.toLowerCase().includes(q) ||
      user.id.toString().includes(q) ||
      (user.role_id !== null && user.role_id.toString().includes(q))
    );
  });

  const filteredFlaggedPosts = flaggedPosts.filter((flag) => {
    if (moderationFilterStatus === "pending")
      return flag.status.toLowerCase() === "pending";
    if (moderationFilterStatus === "resolved")
      return flag.status.toLowerCase() === "resolved";
    if (moderationFilterStatus === "dismissed")
      return flag.status.toLowerCase() === "dismissed";
    return true;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actor_id !== null && log.actor_id.toString().includes(q)) ||
      (log.target && log.target.toLowerCase().includes(q)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(q))
    );
  });

  const getRoleLabel = (roleId: number | null) => {
    if (roleId === 1)
      return {
        label: "Admin",
        color: "bg-[#5851A4]/15 text-[#5851A4] border-[#5851A4]/30 font-bold",
      };
    if (roleId === 2)
      return {
        label: "Faculty",
        color: "bg-[#4B63D2]/15 text-[#4B63D2] border-[#4B63D2]/30 font-bold",
      };
    if (roleId === 3)
      return {
        label: "Student",
        color: "bg-[#C8B6E2]/30 text-[#4B63D2] border-[#C8B6E2] font-bold",
      };
    return {
      label: "User",
      color: "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7] font-semibold",
    };
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("ban"))
      return "bg-rose-50 text-rose-700 border-rose-300 font-bold";
    if (act.includes("unban"))
      return "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
    if (act.includes("delete") || act.includes("remove"))
      return "bg-amber-50 text-amber-700 border-amber-300 font-bold";
    if (act.includes("resolve") || act.includes("dismiss"))
      return "bg-[#4B63D2]/10 text-[#4B63D2] border-[#4B63D2]/30 font-bold";
    return "bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7] font-medium";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#5851A4] hover:text-[#1E2746] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#C8B6E2]/25 border border-[#C8B6E2] text-[#4B63D2]">
              <Shield className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-black text-[#1E2746] tracking-tight">
              Admin Moderation Console
            </h2>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System Control
            </span>
          </div>
          <p className="text-[#5851A4] text-sm max-w-2xl font-medium">
            Complete platform management: audit security events, process flagged
            content reports, and manage user roles & privileges.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#1E2746] text-sm font-bold transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-[#4B63D2]" : "text-[#5851A4]"}`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh All"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-700">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-bold text-rose-800">Administrative Error</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="text-xs px-3 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl text-rose-800 font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE4F7] pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "overview"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Stats</span>
        </button>

        <button
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "moderation"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Content Moderation</span>
          {flaggedPosts.filter((f) => f.status.toLowerCase() === "pending")
            .length > 0 && (
            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-500 text-white">
              {
                flaggedPosts.filter((f) => f.status.toLowerCase() === "pending")
                  .length
              }
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#4B63D2] text-white shadow-sm"
              : "text-[#5851A4] hover:text-[#1E2746] hover:bg-[#FAF9FD]"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & USER GOVERNANCE */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5851A4]">
                  Total Users
                </span>
                <div className="p-2.5 rounded-2xl bg-[#4B63D2]/10 border border-[#4B63D2]/20 text-[#4B63D2]">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-24 bg-[#FAF9FD] animate-pulse rounded-xl" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#1E2746] tracking-tight">
                      {stats?.total_users ?? users.length}
                    </span>
                    <span className="text-xs text-[#5851A4] font-medium">
                      registered
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5851A4] border-t border-[#EAE4F7] pt-3">
                <span className="font-medium">Active Accounts</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {stats?.active_users ??
                    users.filter((u) => u.is_active).length}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5851A4]">
                  Total Posts
                </span>
                <div className="p-2.5 rounded-2xl bg-[#5851A4]/10 border border-[#5851A4]/20 text-[#5851A4]">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-24 bg-[#FAF9FD] animate-pulse rounded-xl" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#1E2746] tracking-tight">
                      {stats?.total_posts ?? 0}
                    </span>
                    <span className="text-xs text-[#5851A4] font-medium">
                      publications
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5851A4] border-t border-[#EAE4F7] pt-3">
                <span className="font-medium">Posts Today</span>
                <span className="text-[#5851A4] font-bold">
                  +{stats?.daily_activity?.posts_today ?? 0}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5851A4]">
                  Active Users
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-24 bg-[#FAF9FD] animate-pulse rounded-xl" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#1E2746] tracking-tight">
                      {stats?.active_users ??
                        users.filter((u) => u.is_active).length}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      active
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5851A4] border-t border-[#EAE4F7] pt-3">
                <span className="font-medium">Signups Today</span>
                <span className="text-[#4B63D2] font-bold">
                  +{stats?.daily_activity?.users_today ?? 0}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5851A4]">
                  Daily Activity
                </span>
                <div className="p-2.5 rounded-2xl bg-[#FFD21A]/20 border border-[#FFD21A]/50 text-[#5851A4]">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-24 bg-[#FAF9FD] animate-pulse rounded-xl" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#1E2746] tracking-tight">
                      {stats?.daily_activity?.actions_today ?? 0}
                    </span>
                    <span className="text-xs text-[#5851A4] font-medium">
                      events
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5851A4] border-t border-[#EAE4F7] pt-3">
                <span className="font-medium">System Status</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  Healthy
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#EAE4F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] tracking-tight">
                  User Directory & Governance
                </h3>
                <p className="text-[#5851A4] text-xs mt-0.5 font-medium">
                  Manage user status, roles, and ban account access.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#9188BE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by email or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition-colors font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9FD] border-b border-[#EAE4F7] text-[#5851A4] text-xs uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-6">User ID</th>
                    <th className="py-3.5 px-6">Account Email</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Joined Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] text-xs">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-6">
                          <div className="h-4 w-12 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-40 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-24 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="h-4 w-20 bg-[#FAF9FD] rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-[#5851A4]"
                      >
                        <Users className="w-8 h-8 mx-auto mb-2 text-[#B9B1D9]" />
                        <p className="font-bold text-[#1E2746] text-sm">
                          No users found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const role = getRoleLabel(user.role_id);
                      const isPendingAction =
                        actionLoadingId === `user-ban-${user.id}`;

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-[#FAF9FD] transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-[#5851A4] font-bold">
                            #{user.id}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-2xl bg-[#C8B6E2]/30 border border-[#C8B6E2] flex items-center justify-center text-[#4B63D2] font-black text-xs uppercase shrink-0">
                                {user.email.charAt(0)}
                              </div>
                              <span className="font-bold text-[#1E2746]">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] border ${role.color}`}
                            >
                              {role.label}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Banned
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-[#5851A4] font-medium">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleBanToggle(user)}
                                disabled={isPendingAction}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                                  user.is_active
                                    ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
                                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                                }`}
                              >
                                {isPendingAction ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : user.is_active ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Ban</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Unban</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => setUserToDelete(user)}
                                disabled={isPendingAction}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all duration-200 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT MODERATION PANEL */}
      {activeTab === "moderation" && (
        <div className="space-y-6 animate-fade-in">
          {/* Moderation Controls Header */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-[#1E2746] tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#4B63D2]" />
                Content Moderation Panel
              </h3>
              <p className="text-[#5851A4] text-xs mt-0.5 font-medium">
                Review flagged posts, take administrative action, or dismiss
                policy violation flags.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#FAF9FD] p-1.5 rounded-2xl border border-[#D5CBEE]">
              <Filter className="w-3.5 h-3.5 text-[#5851A4] ml-2" />
              {["all", "pending", "resolved", "dismissed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setModerationFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-150 cursor-pointer ${
                    moderationFilterStatus === status
                      ? "bg-[#4B63D2] text-white shadow-sm"
                      : "text-[#5851A4] hover:text-[#1E2746]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Flagged Content Feed */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#EAE4F7] rounded-3xl p-6 animate-pulse space-y-3 shadow-sm"
                >
                  <div className="h-4 w-48 bg-[#FAF9FD] rounded" />
                  <div className="h-16 w-full bg-[#FAF9FD] rounded" />
                  <div className="h-8 w-32 bg-[#FAF9FD] rounded ml-auto" />
                </div>
              ))
            ) : filteredFlaggedPosts.length === 0 ? (
              <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <p className="font-black text-[#1E2746] text-base">
                  No Flagged Posts Found
                </p>
                <p className="text-xs text-[#5851A4] max-w-md mx-auto mt-1 font-medium">
                  {moderationFilterStatus === "all"
                    ? "No community content reports or flagged posts are currently recorded."
                    : `No flagged content reports with status "${moderationFilterStatus}".`}
                </p>
              </div>
            ) : (
              filteredFlaggedPosts.map((flag) => {
                const isPendingAction = actionLoadingId === `flag-${flag.id}`;
                const isPending = flag.status.toLowerCase() === "pending";

                return (
                  <div
                    key={flag.id}
                    className="bg-white border border-[#EAE4F7] rounded-3xl p-6 space-y-4 hover:border-[#C8B6E2] transition-all duration-200 shadow-sm"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4F7] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#FAF9FD] text-[#4B63D2] border border-[#EAE4F7]">
                          Flag #{flag.id}
                        </span>
                        <span className="text-xs text-[#5851A4] font-medium">
                          Post ID:{" "}
                          <strong className="text-[#1E2746]">
                            #{flag.post_id}
                          </strong>
                        </span>
                        <span className="text-xs text-[#9188BE] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#9188BE]" />
                          {new Date(flag.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {flag.status.toLowerCase() === "pending" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Pending Review
                          </span>
                        ) : flag.status.toLowerCase() === "resolved" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9FD] text-[#5851A4] border border-[#EAE4F7] flex items-center gap-1.5">
                            Dismissed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Report Reason */}
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-900">
                          Flag Reason:
                        </span>{" "}
                        {flag.reason ||
                          "Flagged for community guideline check."}
                        <div className="text-[11px] text-[#5851A4] mt-1">
                          Reported by:{" "}
                          <span className="text-[#1E2746] font-bold">
                            {flag.flagger?.email || `User #${flag.flagger_id}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content Details */}
                    <div className="bg-[#FAF9FD] border border-[#EAE4F7] rounded-2xl p-4 space-y-2">
                      <div className="text-xs text-[#5851A4] flex items-center justify-between">
                        <span>
                          Post Author:{" "}
                          <strong className="text-[#1E2746] font-bold">
                            {flag.post?.author?.email ||
                              `User #${flag.post?.author_id || "Unknown"}`}
                          </strong>
                        </span>
                        {flag.post?.created_at && (
                          <span className="text-[11px] font-mono text-[#9188BE]">
                            {new Date(
                              flag.post.created_at,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#1E2746] italic bg-white p-3 rounded-xl border border-[#EAE4F7] font-medium leading-relaxed">
                        "
                        {flag.post?.content ||
                          "Post content preview unavailable (or post removed)."}
                        "
                      </p>
                      {flag.post?.image_url && (
                        <div className="mt-2">
                          <img
                            src={getMediaUrl(flag.post.image_url)}
                            alt="Flagged media"
                            className="max-h-48 rounded-xl object-cover border border-[#EAE4F7]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() =>
                              handleResolveFlag(flag.id, "dismissed")
                            }
                            disabled={isPendingAction}
                            className="px-3.5 py-2 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#5851A4] hover:text-[#1E2746] text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isPendingAction ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            <span>Dismiss Flag</span>
                          </button>

                          <button
                            onClick={() =>
                              handleResolveFlag(flag.id, "resolved")
                            }
                            disabled={isPendingAction}
                            className="px-3.5 py-2 rounded-xl bg-[#4B63D2]/10 hover:bg-[#4B63D2]/20 border border-[#4B63D2]/30 text-[#4B63D2] text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isPendingAction ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Mark Resolved</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          setPostToRemove({
                            postId: flag.post_id,
                            flagId: flag.id,
                          })
                        }
                        disabled={isPendingAction}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Post as Admin</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOGS VIEW */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl overflow-hidden shadow-sm">
            {/* Header toolbar */}
            <div className="p-6 border-b border-[#EAE4F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1E2746] tracking-tight flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#4B63D2]" />
                  Security Audit Logs
                </h3>
                <p className="text-[#5851A4] text-xs mt-0.5 font-medium">
                  Immutable record of administrative actions, moderation events,
                  and security events.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#9188BE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by action, actor, target, IP..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] transition-colors font-medium"
                />
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9FD] border-b border-[#EAE4F7] text-[#5851A4] text-xs uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Actor ID</th>
                    <th className="py-3.5 px-6">Action Event</th>
                    <th className="py-3.5 px-6">Target Resource</th>
                    <th className="py-3.5 px-6">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F7] text-xs">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-6">
                          <div className="h-4 w-32 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-24 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-48 bg-[#FAF9FD] rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-24 bg-[#FAF9FD] rounded" />
                        </td>
                      </tr>
                    ))
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-[#5851A4]"
                      >
                        <Terminal className="w-8 h-8 mx-auto mb-2 text-[#B9B1D9]" />
                        <p className="font-bold text-[#1E2746] text-sm">
                          No audit logs found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const badgeStyle = getActionBadge(log.action);

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-[#FAF9FD] transition-colors"
                        >
                          <td className="py-3.5 px-6 font-mono text-[#5851A4]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6">
                            {log.actor_id ? (
                              <span className="font-mono text-[#4B63D2] font-bold">
                                User #{log.actor_id}
                              </span>
                            ) : (
                              <span className="text-[#9188BE] italic">
                                System
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border uppercase tracking-wider ${badgeStyle}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-[#1E2746] font-bold">
                            {log.target || "—"}
                          </td>
                          <td className="py-3.5 px-6 font-mono text-[#5851A4]">
                            {log.ip_address || "127.0.0.1"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#FAF9FD] border-t border-[#EAE4F7] flex items-center justify-between text-xs text-[#5851A4] font-medium">
              <span>Showing {filteredAuditLogs.length} audit records</span>
              <span>Logged via FastAPI Middleware & Admin Audit System</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2746]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1E2746]">
                Delete User Account
              </h3>
            </div>

            <p className="text-sm text-[#5851A4] leading-relaxed font-medium">
              Are you sure you want to permanently delete user{" "}
              <strong className="text-[#1E2746]">{userToDelete.email}</strong> (ID:
              #{userToDelete.id})? This action cannot be undone and will purge
              all associated profile data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#5851A4] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUserConfirm}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete User"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {postToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2746]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1E2746]">
                Remove Post as Admin
              </h3>
            </div>

            <p className="text-sm text-[#5851A4] leading-relaxed font-medium">
              Are you sure you want to remove post{" "}
              <strong className="text-[#1E2746]">#{postToRemove.postId}</strong>?
              This action will permanently remove the publication from the feed
              and create a security audit log event.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPostToRemove(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-[#FAF9FD] hover:bg-white border border-[#D5CBEE] text-[#5851A4] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRemovePostConfirm}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Removing..." : "Remove Post"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
