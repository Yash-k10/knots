import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  User,
  Shield,
  Trash2,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiRequest, ApiError } from "../services/api";

interface UserData {
  id: number;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Email state
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Preferences toggles (local state for UX completeness)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [chatStatus, setChatStatus] = useState(true);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Fetch current user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        setFetchError(null);
        const response = await apiRequest<UserData>("/users/me");
        setUser(response);
        setEmail(response.email);
      } catch (err) {
        if (err instanceof ApiError) {
          setFetchError(err.message);
        } else if (err instanceof Error) {
          setFetchError(err.message);
        } else {
          setFetchError("Failed to fetch user details.");
        }
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // Auto-clear success messages after 4 seconds
  useEffect(() => {
    if (!emailSuccess) return;
    const timer = setTimeout(() => setEmailSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [emailSuccess]);

  useEffect(() => {
    if (!passwordSuccess) return;
    const timer = setTimeout(() => setPasswordSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [passwordSuccess]);

  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccess(null);
    setEmailError(null);

    if (!user) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email address is required.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!trimmedEmail.endsWith("@sbjit.edu.in")) {
      setEmailError(
        "Only college email addresses (@sbjit.edu.in) are allowed.",
      );
      return;
    }

    setEmailLoading(true);
    try {
      const updatedUser = await apiRequest<UserData>(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setUser(updatedUser);
      setEmail(updatedUser.email);
      setEmailSuccess("Email address updated successfully.");
    } catch (err) {
      if (err instanceof ApiError) {
        setEmailError(err.message);
      } else if (err instanceof Error) {
        setEmailError(err.message);
      } else {
        setEmailError("An unexpected error occurred while updating email.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change (uses secure current-password verification)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!user) return;

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from the current password.",
      );
      return;
    }

    setPasswordLoading(true);
    try {
      await apiRequest<UserData>("/users/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError(
          "An unexpected error occurred while changing password.",
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiRequest("/users/me", { method: "DELETE" });
      localStorage.removeItem("knots_token");
      localStorage.removeItem("knots_refresh_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      navigate("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("An unexpected error occurred while deleting account.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };


  // Handle preferences save (local state mock toggle action)
  const handleSavePreferences = () => {
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  const getRoleName = (roleId?: number) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Student";
      case 3:
        return "Alumni";
      case 4:
        return "Recruiter";
      case 5:
        return "Faculty";
      default:
        return "User";
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-400" };
    if (score <= 4)
      return { level: 4, label: "Strong", color: "bg-emerald-400" };
    return { level: 5, label: "Excellent", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading user settings...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 flex items-start gap-3 max-w-2xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-rose-500" />
        <div>
          <h3 className="font-bold text-[#1E2746] mb-1">Failed to Load Settings</h3>
          <p className="text-sm text-[#5851A4] font-medium">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-[#4B63D2] hover:bg-[#3E53BE] text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header with Account Info */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1E2746] flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#4B63D2]" /> Account Security &
              Settings
            </h2>
            <p className="text-[#5851A4] text-sm mt-1 font-medium">
              Configure your login credentials, email address, and notification
              preferences.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#C8B6E2]/25 text-[#5851A4] border border-[#C8B6E2] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#4B63D2]" /> {getRoleName(user?.role_id)}
          </span>
        </div>

        {/* Account details row */}
        <div className="mt-5 pt-5 border-t border-[#EAE4F7] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-[#5851A4] text-xs font-medium">
            <Mail className="h-3.5 w-3.5 text-[#4B63D2]" />
            <span className="truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-[#5851A4] text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-[#4B63D2]" />
            <span>
              Joined{" "}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#5851A4] text-xs font-medium">
            <Shield className="h-3.5 w-3.5 text-[#4B63D2]" />
            <span>Account {user?.is_active ? "Active" : "Inactive"}</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${user?.is_active ? "bg-emerald-500" : "bg-rose-500"}`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Email Form */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#4B63D2]" /> Update Email Address
            </h3>
            <p className="text-xs text-[#5851A4] mt-1 font-medium">
              Change the college email associated with your account.
            </p>
          </div>

          {emailError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs flex items-start gap-2 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{emailSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sbjit.edu.in"
                className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-3 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-sm font-medium"
                required
                disabled={emailLoading}
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading || email === user?.email}
              className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              {emailLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Email
            </button>
          </form>
        </div>

        {/* Password Form — Now uses current password verification */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
              <Key className="h-5 w-5 text-[#4B63D2]" /> Change Password
            </h3>
            <p className="text-xs text-[#5851A4] mt-1 font-medium">
              Verify your current password before setting a new one.
            </p>
          </div>

          {passwordError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs flex items-start gap-2 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-3 pr-10 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-sm font-medium"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-3 pr-10 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-sm font-medium"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9188BE] hover:text-[#1E2746] transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-[#EAE4F7]"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-bold ${
                      passwordStrength.level <= 1
                        ? "text-rose-600"
                        : passwordStrength.level <= 2
                          ? "text-amber-600"
                          : passwordStrength.level <= 3
                            ? "text-yellow-600"
                            : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2746] uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-3 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-[#4B63D2] focus:ring-2 focus:ring-[#4B63D2]/20 transition-all text-sm font-medium"
                required
                disabled={passwordLoading}
              />
              {confirmPassword &&
                newPassword &&
                confirmPassword !== newPassword && (
                  <p className="text-rose-600 text-xs mt-1 font-bold">
                    Passwords do not match
                  </p>
                )}
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              {passwordLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-[#1E2746] flex items-center gap-2">
            <Save className="h-5 w-5 text-[#4B63D2]" /> System Preferences
          </h3>
          <p className="text-xs text-[#5851A4] mt-1 font-medium">
            Manage notifications and chat visibility settings.
          </p>
        </div>

        {prefSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs flex items-start gap-2 font-medium">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#EAE4F7]">
            <div>
              <h4 className="text-sm font-bold text-[#1E2746]">Email Alerts</h4>
              <p className="text-xs text-[#5851A4] font-medium">
                Receive notifications when matching jobs are found
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 text-[#4B63D2] focus:ring-[#4B63D2] rounded border-[#D5CBEE] cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-[#EAE4F7]">
            <div>
              <h4 className="text-sm font-bold text-[#1E2746]">
                Real-time Chat Status
              </h4>
              <p className="text-xs text-[#5851A4] font-medium">
                Show online status badge to peers
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatStatus}
              onChange={(e) => setChatStatus(e.target.checked)}
              className="h-4 w-4 text-[#4B63D2] focus:ring-[#4B63D2] rounded border-[#D5CBEE] cursor-pointer"
            />
          </div>

          <button
            onClick={handleSavePreferences}
            className="bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:from-[#5851A4] hover:to-[#4B63D2] text-white rounded-xl px-5 py-2.5 font-bold text-xs transition-all shadow-sm"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-black text-rose-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Danger Zone
          </h3>
          <p className="text-xs text-[#5851A4] mt-1 font-medium">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl px-4 py-2.5 font-bold text-xs transition-all flex items-center gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h4 className="text-[#1E2746] font-black">Delete Account</h4>
                <p className="text-[#5851A4] text-xs font-medium">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1E2746] mb-2">
                Type <span className="text-rose-600 font-mono">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white rounded-xl px-4 py-2.5 text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:border-rose-500 transition-all text-sm font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="flex-1 bg-[#FAF9FD] hover:bg-[#F3EFFB] text-[#5851A4] border border-[#EAE4F7] rounded-xl py-2.5 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-2.5 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {deleteLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
