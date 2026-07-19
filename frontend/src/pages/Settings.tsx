import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  LogOut,
} from 'lucide-react'
import { apiRequest, ApiError } from '../services/api'

interface UserData {
  id: number
  email: string
  role_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserData | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Email state
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Preferences toggles (local state for UX completeness)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [chatStatus, setChatStatus] = useState(true)
  const [prefSuccess, setPrefSuccess] = useState(false)

  // Fetch current user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true)
        setFetchError(null)
        const response = await apiRequest<UserData>('/users/me')
        setUser(response)
        setEmail(response.email)
      } catch (err) {
        if (err instanceof ApiError) {
          setFetchError(err.message)
        } else if (err instanceof Error) {
          setFetchError(err.message)
        } else {
          setFetchError('Failed to fetch user details.')
        }
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  // Auto-clear success messages after 4 seconds
  useEffect(() => {
    if (emailSuccess) {
      const timer = setTimeout(() => setEmailSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [emailSuccess])

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [passwordSuccess])

  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSuccess(null)
    setEmailError(null)

    if (!user) return

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setEmailError('Email address is required.')
      return
    }
    if (!trimmedEmail.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (!trimmedEmail.endsWith('@sbjit.edu.in')) {
      setEmailError('Only college email addresses (@sbjit.edu.in) are allowed.')
      return
    }

    setEmailLoading(true)
    try {
      const updatedUser = await apiRequest<UserData>(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ email: trimmedEmail }),
      })
      setUser(updatedUser)
      setEmail(updatedUser.email)
      setEmailSuccess('Email address updated successfully.')
    } catch (err) {
      if (err instanceof ApiError) {
        setEmailError(err.message)
      } else if (err instanceof Error) {
        setEmailError(err.message)
      } else {
        setEmailError('An unexpected error occurred while updating email.')
      }
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle password change (uses secure current-password verification)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (!user) return

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (!newPassword) {
      setPasswordError('New password is required.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from the current password.')
      return
    }

    setPasswordLoading(true)
    try {
      await apiRequest<UserData>('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      setPasswordSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message)
      } else if (err instanceof Error) {
        setPasswordError(err.message)
      } else {
        setPasswordError('An unexpected error occurred while changing password.')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await apiRequest(`/users/${user.id}`, { method: 'DELETE' })
      localStorage.removeItem('knots_token')
      localStorage.removeItem('knots_refresh_token')
      navigate('/login')
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
      } else if (err instanceof Error) {
        setDeleteError(err.message)
      } else {
        setDeleteError('An unexpected error occurred.')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle preferences save (local state mock toggle action)
  const handleSavePreferences = () => {
    setPrefSuccess(true)
    setTimeout(() => setPrefSuccess(false), 3000)
  }

  const getRoleName = (roleId?: number) => {
    switch (roleId) {
      case 1:
        return 'Admin'
      case 2:
        return 'Student'
      case 3:
        return 'Alumni'
      case 4:
        return 'Recruiter'
      case 5:
        return 'Faculty'
      default:
        return 'User'
    }
  }

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 10) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' }
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' }
    if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-emerald-400' }
    return { level: 5, label: 'Excellent', color: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading user settings...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-6 flex items-start gap-3 max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white mb-1">Failed to Load Settings</h3>
          <p className="text-sm text-slate-400">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header with Account Info */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-400" /> Account Security & Settings
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configure your login credentials, email address, and notification preferences.</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> {getRoleName(user?.role_id)}
          </span>
        </div>

        {/* Account details row */}
        <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Shield className="h-3.5 w-3.5 text-slate-500" />
            <span>Account {user?.is_active ? 'Active' : 'Inactive'}</span>
            <span className={`inline-block h-2 w-2 rounded-full ${user?.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Email Form */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-400" /> Update Email Address
            </h3>
            <p className="text-xs text-slate-500 mt-1">Change the college email associated with your account.</p>
          </div>

          {emailError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-xs flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{emailSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sbjit.edu.in"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                required
                disabled={emailLoading}
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading || email === user?.email}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 font-semibold text-xs transition-all flex items-center gap-2"
            >
              {emailLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Email
            </button>
          </form>
        </div>

        {/* Password Form — Now uses current password verification */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" /> Change Password
            </h3>
            <p className="text-xs text-slate-500 mt-1">Verify your current password before setting a new one.</p>
          </div>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-xs flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.level <= 1 ? 'text-red-400' :
                    passwordStrength.level <= 2 ? 'text-amber-400' :
                    passwordStrength.level <= 3 ? 'text-yellow-400' :
                    'text-emerald-400'
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                required
                disabled={passwordLoading}
              />
              {confirmPassword && newPassword && confirmPassword !== newPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 font-semibold text-xs transition-all flex items-center gap-2"
            >
              {passwordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Save className="h-5 w-5 text-indigo-400" /> System Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-1">Manage notifications and chat visibility settings.</p>
        </div>

        {prefSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-xs flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-900">
            <div>
              <h4 className="text-sm font-semibold text-white">Email Alerts</h4>
              <p className="text-xs text-slate-500">Receive notifications when matching jobs are found</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded bg-slate-900 border-slate-800 cursor-pointer" 
            />
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-slate-900">
            <div>
              <h4 className="text-sm font-semibold text-white">Real-time Chat Status</h4>
              <p className="text-xs text-slate-500">Show online status badge to peers</p>
            </div>
            <input 
              type="checkbox" 
              checked={chatStatus}
              onChange={(e) => setChatStatus(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded bg-slate-900 border-slate-800 cursor-pointer" 
            />
          </div>

          <button 
            onClick={handleSavePreferences}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold text-xs transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-500 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-4 py-2.5 font-semibold text-xs transition-all flex items-center gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">Delete Account</h4>
                <p className="text-slate-400 text-xs">This action is permanent and cannot be reversed.</p>
              </div>
            </div>

            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-xs">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Type <span className="text-red-400 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-red-500 transition-all text-sm font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeleteError(null)
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg py-2.5 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
