import { useState, useEffect } from 'react'
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
  ArrowUpRight
} from 'lucide-react'
import {
  getDashboardStats,
  getAdminUsers,
  banUser,
  unbanUser,
  deleteAdminUser,
  DashboardStats,
  AdminUser
} from '../services/admin'

export default function Admin() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Confirmation modal state for user deletion
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [statsData, usersData] = await Promise.all([
        getDashboardStats(),
        getAdminUsers(0, 100)
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err)
      setError(err?.message || 'Failed to fetch admin dashboard data. Please check your credentials.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const handleBanToggle = async (user: AdminUser) => {
    setActionLoadingId(user.id)
    try {
      if (user.is_active) {
        const updated = await banUser(user.id)
        setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, is_active: false } : u)))
        showToast('success', `User ${updated.email} has been banned successfully.`)
      } else {
        const updated = await unbanUser(user.id)
        setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, is_active: true } : u)))
        showToast('success', `User ${updated.email} has been unbanned successfully.`)
      }
      // Refresh stats
      const newStats = await getDashboardStats()
      setStats(newStats)
    } catch (err: any) {
      showToast('error', err?.message || `Failed to update status for ${user.email}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await deleteAdminUser(userToDelete.id)
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
      showToast('success', `User ${userToDelete.email} was permanently deleted.`)
      setUserToDelete(null)
      // Refresh stats
      const newStats = await getDashboardStats()
      setStats(newStats)
    } catch (err: any) {
      showToast('error', err?.message || `Failed to delete user ${userToDelete.email}`)
    } finally {
      setDeleting(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      user.email.toLowerCase().includes(q) ||
      user.id.toString().includes(q) ||
      (user.role_id !== null && user.role_id.toString().includes(q))
    )
  })

  const getRoleLabel = (roleId: number | null) => {
    if (roleId === 1) return { label: 'Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
    if (roleId === 2) return { label: 'Faculty', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
    if (roleId === 3) return { label: 'Student', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    return { label: 'User', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/90 border-rose-800/80 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-slate-950/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Admin Console</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Governance
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            System administration center. Monitor platform metrics, audit account activities, and manage user roles and access privileges.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-rose-300">Administrative Data Error</p>
            <p className="text-rose-200/80 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="text-xs px-3 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-700 rounded-lg text-rose-100 font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Users */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-24 bg-slate-900 animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.total_users ?? users.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">registered</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
            <span>Active Accounts</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {stats?.active_users ?? users.filter(u => u.is_active).length}
            </span>
          </div>
        </div>

        {/* Card 2: Total Posts */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Posts</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-24 bg-slate-900 animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.total_posts ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">publications</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
            <span>Posts Created Today</span>
            <span className="text-purple-400 font-semibold">
              +{stats?.daily_activity?.posts_today ?? 0}
            </span>
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Users</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-24 bg-slate-900 animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.active_users ?? users.filter(u => u.is_active).length}
                </span>
                <span className="text-xs text-emerald-500 font-medium">in good standing</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
            <span>Signups Today</span>
            <span className="text-indigo-400 font-semibold">
              +{stats?.daily_activity?.users_today ?? 0}
            </span>
          </div>
        </div>

        {/* Card 4: Daily Activity */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Activity</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-24 bg-slate-900 animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.daily_activity?.actions_today ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">events today</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
            <span>System Status</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              Healthy
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Toolbar Header */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">User Directory & Governance</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage accounts, toggle ban status, and review security roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by email or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">User ID</th>
                <th className="py-3.5 px-6">Account Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/80 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-900 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-40 bg-slate-900 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-900 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-900 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-900 rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-20 bg-slate-900 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-600 mb-1" />
                      <p className="font-medium text-slate-400 text-sm">No users found</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery ? `No matching accounts for "${searchQuery}"` : 'The platform directory is empty.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const role = getRoleLabel(user.role_id)
                  const isPendingAction = actionLoadingId === user.id

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400 font-medium">#{user.id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase shrink-0">
                            {user.email.charAt(0)}
                          </div>
                          <span className="font-medium text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${role.color}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Banned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ban / Unban Button */}
                          <button
                            onClick={() => handleBanToggle(user)}
                            disabled={isPendingAction}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                              user.is_active
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            }`}
                            title={user.is_active ? 'Ban this user' : 'Unban this user'}
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

                          {/* Delete Button */}
                          <button
                            onClick={() => setUserToDelete(user)}
                            disabled={isPendingAction}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all duration-200"
                            title="Delete user permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-900/30 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredUsers.length} of {users.length} total users</span>
          <span>Role-based access active</span>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete User Account</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete user{' '}
              <strong className="text-white">{userToDelete.email}</strong> (ID: #{userToDelete.id})? This action cannot be undone and will purge all associated profile data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
